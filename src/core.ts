import {createHash, randomBytes, timingSafeEqual} from "node:crypto";
import type {
  CompanionError,
  CompanionErrorCode,
  CompanionSession,
  CompanionStatusResponse,
  FolderListRequest,
  FolderListResponse,
  PairRequest,
  PairResult,
  PairState,
  PairStatus,
  ProtocolVersion,
  ResolveContextRequest,
  ResolveContextResult,
  SearchRequest,
  SearchResponse,
  VaultAttachmentDescriptor,
  VaultNoteSummary
} from "@noteferry/protocol";
import {PROTOCOL_VERSION} from "@noteferry/protocol";

export const COMPANION_HOST = "127.0.0.1";
export const COMPANION_PORT = 27125;
export const SERVICE_VERSION = "0.1.9";
export const FOLDER_LIST_SCAN_MAX = 200;
export const FOLDER_LIST_SHOW_MAX = 80;

export const MAX_BODY_BYTES = 64 * 1024;
export const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
export const PAIR_TTL_MS = 120_000;
export const RECENT_LIMIT = 20;

export type VaultPort = {
  getCurrent(): Promise<VaultNoteSummary | null>;
  getRecent(): Promise<VaultNoteSummary[]>;
  search(request: SearchRequest): Promise<SearchResponse>;
  listFolder(request: FolderListRequest): Promise<FolderListResponse>;
  listAttachments(noteId: string): Promise<VaultAttachmentDescriptor[]>;
  resolveNotePath(noteId: string): Promise<string | null>;
  readFile(vaultRelativePath: string): Promise<Uint8Array>;
  noteSummary(noteId: string): Promise<VaultNoteSummary | null>;
};

export type PairingStore = {
  create(request: PairRequest): {requestId: string; status: PairStatus};
  get(requestId: string): PairStatus | null;
  approve(requestId: string): PairResult | null;
  deny(requestId: string): PairStatus | null;
  consumeApproval(requestId: string): PairResult | null;
  authenticate(bearer: string | null): CompanionSession | null;
  revoke(clientId: string): boolean;
  touch(clientId: string): void;
};

export type RateBucket = {count: number; resetAt: number};

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function generateSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function generateId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.byteLength !== right.byteLength) return false;
  return timingSafeEqual(left, right);
}

export function normalizeVaultRelativePath(raw: string): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 1024) return null;
  if (raw.includes("\0")) return null;
  const replaced = raw.replaceAll("\\", "/").trim();
  if (replaced.startsWith("/") || /^[a-zA-Z]:/.test(replaced)) return null;
  const parts = replaced.split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") return null;
    out.push(part);
  }
  if (out.length === 0) return null;
  return out.join("/");
}

/** Empty string is the vault root; other values use the same containment rules as file paths. */
export function normalizeFolderListPath(raw: string): string | null {
  if (typeof raw !== "string" || raw.length > 1024) return null;
  const trimmed = raw.replaceAll("\\", "/").trim();
  if (trimmed.length === 0) return "";
  return normalizeVaultRelativePath(trimmed);
}

export function parentFolderPath(path: string): string | null {
  if (!path) return null;
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

export function statusResponse(): CompanionStatusResponse {
  return {
    service: "NoteFerry Companion",
    serviceVersion: SERVICE_VERSION,
    protocolVersion: PROTOCOL_VERSION
  };
}

export function errorBody(code: CompanionErrorCode, message: string, retryable: boolean): {error: CompanionError} {
  return {error: {code, message, retryable}};
}

export function isProtocolVersion(value: unknown): value is ProtocolVersion {
  return value === PROTOCOL_VERSION;
}

export type StoredClient = {
  clientId: string;
  secretHash: string;
  pairedAt: string;
  lastSeenAt: string;
  protocolVersion: ProtocolVersion;
};

export type PendingPair = {
  requestId: string;
  clientName: string;
  extensionVersion: string;
  protocolVersion: ProtocolVersion;
  state: PairState;
  expiresAt: number;
  result?: PairResult;
};

export type PairingStoreOptions = {
  /** Restored approved clients (hashes only). Pending pair requests are never persisted. */
  initialClients?: readonly StoredClient[];
  /** Called after approve/revoke when the durable client set changes. */
  persistClients?: (clients: StoredClient[]) => void;
};

export function isStoredClient(value: unknown): value is StoredClient {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.clientId === "string" &&
    typeof row.secretHash === "string" &&
    /^[a-f0-9]{64}$/.test(row.secretHash) &&
    typeof row.pairedAt === "string" &&
    typeof row.lastSeenAt === "string" &&
    isProtocolVersion(row.protocolVersion)
  );
}

export function createMemoryPairingStore(
  now: () => number = Date.now,
  options: PairingStoreOptions = {}
): PairingStore {
  const pending = new Map<string, PendingPair>();
  const clients = new Map<string, StoredClient>();

  for (const client of options.initialClients ?? []) {
    if (isStoredClient(client)) clients.set(client.clientId, {...client});
  }

  function snapshotClients(): StoredClient[] {
    return [...clients.values()].map((client) => ({...client}));
  }

  function persist(): void {
    options.persistClients?.(snapshotClients());
  }

  function expire(entry: PendingPair): PairStatus {
    if (entry.state === "pending" && now() > entry.expiresAt) {
      entry.state = "expired";
    }
    return {
      requestId: entry.requestId,
      state: entry.state,
      expiresAt: new Date(entry.expiresAt).toISOString()
    };
  }

  return {
    create(request) {
      const requestId = generateId("pair");
      const expiresAt = now() + PAIR_TTL_MS;
      const entry: PendingPair = {
        requestId,
        clientName: request.clientName,
        extensionVersion: request.extensionVersion,
        protocolVersion: request.protocolVersion,
        state: "pending",
        expiresAt
      };
      pending.set(requestId, entry);
      return {requestId, status: expire(entry)};
    },
    get(requestId) {
      const entry = pending.get(requestId);
      return entry ? expire(entry) : null;
    },
    approve(requestId) {
      const entry = pending.get(requestId);
      if (!entry) return null;
      expire(entry);
      if (entry.state !== "pending") return null;
      const secret = generateSecret();
      const clientId = generateId("client");
      const sessionExpiresAt = new Date(now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const pairedAt = new Date(now()).toISOString();
      entry.state = "approved";
      entry.result = {clientId, secret, sessionExpiresAt};
      clients.set(clientId, {
        clientId,
        secretHash: hashSecret(secret),
        pairedAt,
        lastSeenAt: pairedAt,
        protocolVersion: entry.protocolVersion
      });
      persist();
      return entry.result;
    },
    deny(requestId) {
      const entry = pending.get(requestId);
      if (!entry) return null;
      expire(entry);
      if (entry.state !== "pending") return expire(entry);
      entry.state = "denied";
      return expire(entry);
    },
    consumeApproval(requestId) {
      const entry = pending.get(requestId);
      if (!entry) return null;
      expire(entry);
      if (entry.state !== "approved" || !entry.result) return null;
      const result = entry.result;
      delete entry.result;
      pending.delete(requestId);
      return result;
    },
    authenticate(bearer) {
      if (!bearer || !bearer.startsWith("Bearer ")) return null;
      const secret = bearer.slice("Bearer ".length).trim();
      if (!secret) return null;
      const digest = hashSecret(secret);
      for (const client of clients.values()) {
        if (safeEqualHex(client.secretHash, digest)) {
          return {
            clientId: client.clientId,
            pairedAt: client.pairedAt,
            lastSeenAt: client.lastSeenAt,
            protocolVersion: client.protocolVersion
          };
        }
      }
      return null;
    },
    revoke(clientId) {
      const removed = clients.delete(clientId);
      if (removed) persist();
      return removed;
    },
    touch(clientId) {
      const client = clients.get(clientId);
      if (client) client.lastSeenAt = new Date(now()).toISOString();
    }
  };
}

export function classifyAttachment(path: string, mimeType?: string): VaultAttachmentDescriptor["kind"] {
  const lower = path.toLowerCase();
  if (lower.endsWith(".md")) return "nested-note";
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(lower) || mimeType?.startsWith("image/")) return "image";
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") return "pdf";
  if (/\.(mp3|wav|m4a|aac|ogg|flac)$/.test(lower) || mimeType?.startsWith("audio/")) return "audio";
  if (/\.(mp4|mov|webm|mkv)$/.test(lower) || mimeType?.startsWith("video/")) return "video";
  return "other";
}

export function skipReason(kind: VaultAttachmentDescriptor["kind"], name = ""): string | undefined {
  if (kind === "audio") return /\.(mp3|m4a|wav)$/i.test(name) ? undefined : "audio-not-supported";
  if (kind === "video") {
    return /\.(mp4|m4v|webm|mov)$/i.test(name) ? undefined : "video-not-supported";
  }
  if (kind === "nested-note") return "nested-note-not-expanded";
  if (kind === "other") {
    return /\.(docx|doc|xlsx|xls|csv|pptx|txt)$/i.test(name) ? undefined : "unsupported-type";
  }
  return undefined;
}

export async function resolveContext(
  vault: VaultPort,
  request: ResolveContextRequest
): Promise<ResolveContextResult> {
  const items: ResolveContextResult["items"] = [];
  let totalIncludedBytes = 0;
  const allow = new Set(request.includeAttachmentIds);

  for (const noteId of request.noteIds) {
    const note = await vault.noteSummary(noteId);
    if (!note) continue;
    items.push({
      id: note.id,
      displayName: note.title,
      state: "included",
      byteLength: note.byteLength
    });
    totalIncludedBytes += note.byteLength;

    for (const attachment of await vault.listAttachments(noteId)) {
      if (allow.size > 0 && !allow.has(attachment.id)) continue;
      const reason = skipReason(attachment.kind, attachment.displayName);
      const state = reason ? "skipped" : "included";
      const item = {
        id: attachment.id,
        displayName: attachment.displayName,
        state,
        byteLength: attachment.byteLength,
        ...(reason ? {reason} : {})
      } as const;
      items.push(item);
      if (state === "included") totalIncludedBytes += attachment.byteLength;
    }
  }

  return {
    manifestId: generateId("manifest"),
    items,
    totalIncludedBytes
  };
}
