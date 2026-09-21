export const PROTOCOL_VERSION = "1.0" as const;
export type ProtocolVersion = typeof PROTOCOL_VERSION;

export type CompanionErrorCode =
  | "AUTH_REQUIRED"
  | "PAIRING_EXPIRED"
  | "PAIRING_DENIED"
  | "PROTOCOL_MISMATCH"
  | "INVALID_REQUEST"
  | "UNSUPPORTED_MEDIA"
  | "PATH_REJECTED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL_ERROR";

export interface CompanionError {
  code: CompanionErrorCode;
  message: string;
  retryable: boolean;
}

export interface CompanionStatusResponse {
  service: "NoteFerry Companion";
  serviceVersion: string;
  protocolVersion: ProtocolVersion;
}

export interface PairRequest {
  clientName: string;
  extensionVersion: string;
  protocolVersion: ProtocolVersion;
}

export type PairState = "pending" | "approved" | "denied" | "expired";

export interface PairStatus {
  requestId: string;
  state: PairState;
  expiresAt: string;
}

export interface PairResult {
  clientId: string;
  secret: string;
  sessionExpiresAt: string;
}

export interface CompanionSession {
  clientId: string;
  pairedAt: string;
  lastSeenAt: string;
  protocolVersion: ProtocolVersion;
}

export type VaultAttachmentKind = "image" | "pdf" | "audio" | "video" | "nested-note" | "other";

export interface VaultAttachmentDescriptor {
  id: string;
  vaultRelativePath: string;
  displayName: string;
  mimeType: string;
  byteLength: number;
  kind: VaultAttachmentKind;
}

export interface VaultNoteSummary {
  id: string;
  vaultRelativePath: string;
  title: string;
  modifiedAt: string;
  byteLength: number;
  attachmentCount?: number;
}

export interface SearchRequest {
  query: string;
  limit?: number;
}

export interface SearchResponse {
  notes: VaultNoteSummary[];
}

export interface FolderListRequest {
  vaultRelativePath: string;
}

export type FolderListEntry =
  | {
      kind: "folder";
      name: string;
      vaultRelativePath: string;
    }
  | {
      kind: "note";
      name: string;
      vaultRelativePath: string;
      note: VaultNoteSummary;
    };

export interface FolderListResponse {
  vaultRelativePath: string;
  parentPath: string | null;
  entries: FolderListEntry[];
  truncated: boolean;
}

export interface ResolveContextRequest {
  noteIds: string[];
  includeAttachmentIds: string[];
}

export type InclusionState = "included" | "skipped";

export interface ResolvedContextItem {
  id: string;
  displayName: string;
  state: InclusionState;
  reason?: string;
  byteLength: number;
}

export interface ResolveContextResult {
  manifestId: string;
  items: ResolvedContextItem[];
  totalIncludedBytes: number;
}

export interface ReadFileRequest {
  vaultRelativePath: string;
}
