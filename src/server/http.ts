import {createServer, type IncomingMessage, type Server, type ServerResponse} from "node:http";
import type {
  PairRequest,
  ReadFileRequest,
  ResolveContextRequest,
  SearchRequest
} from "@noteferry/protocol";
import {PROTOCOL_VERSION} from "@noteferry/protocol";
import {
  COMPANION_HOST,
  COMPANION_PORT,
  MAX_BODY_BYTES,
  MAX_FILE_BYTES,
  createMemoryPairingStore,
  errorBody,
  isProtocolVersion,
  normalizeVaultRelativePath,
  resolveContext,
  statusResponse,
  type PairingStore,
  type RateBucket,
  type VaultPort
} from "../core";

export type CompanionServerOptions = {
  vault: VaultPort;
  pairing?: PairingStore;
  host?: string;
  port?: number;
  allowedOrigins?: readonly string[];
  onPairRequested?: (requestId: string, clientName: string) => void;
};

export type CompanionServer = {
  readonly pairing: PairingStore;
  start(): Promise<{host: string; port: number}>;
  stop(): Promise<void>;
  address(): {host: string; port: number} | null;
};

export function createCompanionServer(options: CompanionServerOptions): CompanionServer {
  const pairing = options.pairing ?? createMemoryPairingStore();
  const host = options.host ?? COMPANION_HOST;
  const requestedPort = options.port ?? COMPANION_PORT;
  const allowedOrigins = new Set(options.allowedOrigins ?? []);
  const preAuth = new Map<string, RateBucket>();
  let server: Server | null = null;
  let boundPort = requestedPort;

  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      await route(req, res);
    } catch (error) {
      const httpStatus = error && typeof error === "object" && "httpStatus" in error
        ? Number((error as {httpStatus: unknown}).httpStatus)
        : 500;
      if (httpStatus === 413) {
        sendJson(res, 413, errorBody("PAYLOAD_TOO_LARGE", "Request is too large.", false));
        return;
      }
      if (httpStatus === 400) {
        sendJson(res, 400, errorBody("INVALID_REQUEST", "Invalid request.", false));
        return;
      }
      sendJson(res, 500, errorBody("INTERNAL_ERROR", "Something went wrong.", true));
    }
  };

  async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const hostHeader = req.headers.host ?? "";
    const expected = `${host}:${boundPort}`;
    if (hostHeader !== expected && hostHeader !== host) {
      sendJson(res, 400, errorBody("INVALID_REQUEST", "Invalid host.", false));
      return;
    }

    const origin = req.headers.origin;
    if (typeof origin === "string" && origin.length > 0) {
      if (allowedOrigins.size > 0 && !allowedOrigins.has(origin)) {
        sendJson(res, 403, errorBody("INVALID_REQUEST", "Origin is not allowed.", false));
        return;
      }
    }

    const url = new URL(req.url ?? "/", `http://${host}:${boundPort}`);
    const method = req.method ?? "GET";

    if (method === "GET" && url.pathname === "/v1/status") {
      sendJson(res, 200, statusResponse());
      return;
    }

    if (method === "POST" && url.pathname === "/v1/pair/request") {
      if (!rateOk(preAuth, clientKey(req), 10, 60_000)) {
        sendJson(res, 429, errorBody("RATE_LIMITED", "Too many pairing attempts.", true));
        return;
      }
      const body = await readJson(req);
      if (!body || !isPairRequest(body)) {
        sendJson(res, 400, errorBody("INVALID_REQUEST", "Invalid pairing request.", false));
        return;
      }
      if (!isProtocolVersion(body.protocolVersion)) {
        sendJson(res, 409, errorBody("PROTOCOL_MISMATCH", "Extension is out of date.", false));
        return;
      }
      const created = pairing.create(body);
      options.onPairRequested?.(created.requestId, body.clientName);
      sendJson(res, 200, created.status);
      return;
    }

    if (method === "POST" && url.pathname === "/v1/pair/status") {
      const body = await readJson(req);
      const requestId = body && typeof body === "object" && "requestId" in body
        ? String((body as {requestId: unknown}).requestId)
        : "";
      if (!requestId) {
        sendJson(res, 400, errorBody("INVALID_REQUEST", "Missing request id.", false));
        return;
      }
      const status = pairing.get(requestId);
      if (!status) {
        sendJson(res, 404, errorBody("NOT_FOUND", "Pairing request not found.", false));
        return;
      }
      if (status.state === "approved") {
        const result = pairing.consumeApproval(requestId);
        if (result) {
          sendJson(res, 200, result);
          return;
        }
      }
      if (status.state === "denied") {
        sendJson(res, 403, errorBody("PAIRING_DENIED", "Access was denied in Obsidian.", false));
        return;
      }
      if (status.state === "expired") {
        sendJson(res, 410, errorBody("PAIRING_EXPIRED", "Pairing request expired.", false));
        return;
      }
      sendJson(res, 200, status);
      return;
    }

    const session = pairing.authenticate(typeof req.headers.authorization === "string" ? req.headers.authorization : null);
    if (!session) {
      sendJson(res, 401, errorBody("AUTH_REQUIRED", "Pair Obsidian first.", false));
      return;
    }
    pairing.touch(session.clientId);

    if (method === "GET" && url.pathname === "/v1/session") {
      sendJson(res, 200, session);
      return;
    }

    if (method === "GET" && url.pathname === "/v1/current") {
      const current = await options.vault.getCurrent();
      if (!current) {
        sendJson(res, 404, errorBody("NOT_FOUND", "No current note.", false));
        return;
      }
      sendJson(res, 200, current);
      return;
    }

    if (method === "GET" && url.pathname === "/v1/recent") {
      sendJson(res, 200, await options.vault.getRecent());
      return;
    }

    if (method === "POST" && url.pathname === "/v1/search") {
      const body = await readJson(req);
      if (!body || typeof body !== "object" || typeof (body as SearchRequest).query !== "string") {
        sendJson(res, 400, errorBody("INVALID_REQUEST", "Invalid search request.", false));
        return;
      }
      sendJson(res, 200, await options.vault.search(body as SearchRequest));
      return;
    }

    if (method === "POST" && url.pathname === "/v1/context/resolve") {
      const body = await readJson(req);
      if (!isResolveRequest(body)) {
        sendJson(res, 400, errorBody("INVALID_REQUEST", "Invalid resolve request.", false));
        return;
      }
      sendJson(res, 200, await resolveContext(options.vault, body));
      return;
    }

    if (method === "POST" && url.pathname === "/v1/file/read") {
      const body = await readJson(req);
      if (!body || typeof body !== "object" || typeof (body as ReadFileRequest).vaultRelativePath !== "string") {
        sendJson(res, 400, errorBody("INVALID_REQUEST", "Invalid file request.", false));
        return;
      }
      const path = normalizeVaultRelativePath((body as ReadFileRequest).vaultRelativePath);
      if (!path) {
        sendJson(res, 400, errorBody("PATH_REJECTED", "The requested file is outside this vault.", false));
        return;
      }
      try {
        const bytes = await options.vault.readFile(path);
        if (bytes.byteLength > MAX_FILE_BYTES) {
          sendJson(res, 413, errorBody("PAYLOAD_TOO_LARGE", "File is too large.", false));
          return;
        }
        res.writeHead(200, {
          "Content-Type": "application/octet-stream",
          "Content-Length": bytes.byteLength
        });
        res.end(Buffer.from(bytes));
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? String((error as {code: unknown}).code) : "";
        if (code === "NOT_FOUND") {
          sendJson(res, 404, errorBody("NOT_FOUND", "File not found.", false));
          return;
        }
        if (code === "PATH_REJECTED") {
          sendJson(res, 400, errorBody("PATH_REJECTED", "The requested file is outside this vault.", false));
          return;
        }
        sendJson(res, 500, errorBody("INTERNAL_ERROR", "Something went wrong.", true));
      }
      return;
    }

    if (method === "DELETE" && url.pathname === "/v1/client") {
      pairing.revoke(session.clientId);
      res.writeHead(204);
      res.end();
      return;
    }

    sendJson(res, 404, errorBody("NOT_FOUND", "Unknown endpoint.", false));
  }

  return {
    pairing,
    async start() {
      if (server) {
        const address = this.address();
        if (!address) throw new Error("Server already starting");
        return address;
      }
      server = createServer((req, res) => {
        void handler(req, res);
      });
      await new Promise<void>((resolve, reject) => {
        server?.once("error", reject);
        server?.listen(requestedPort, host, () => resolve());
      });
      const addr = server.address();
      if (addr && typeof addr !== "string") boundPort = addr.port;
      return {host, port: boundPort};
    },
    async stop() {
      const current = server;
      server = null;
      if (!current) return;
      await new Promise<void>((resolve, reject) => {
        current.close((error) => (error ? reject(error) : resolve()));
      });
    },
    address() {
      if (!server) return null;
      const addr = server.address();
      if (!addr || typeof addr === "string") return null;
      return {host: addr.address, port: addr.port};
    }
  };
}

function clientKey(req: IncomingMessage): string {
  return req.socket.remoteAddress ?? "unknown";
}

function rateOk(buckets: Map<string, RateBucket>, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || now > existing.resetAt) {
    buckets.set(key, {count: 1, resetAt: now + windowMs});
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

async function readJson(req: IncomingMessage): Promise<unknown | null> {
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.includes("application/json")) {
    throw Object.assign(new Error("INVALID_REQUEST"), {httpStatus: 400});
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.byteLength;
    if (size > MAX_BODY_BYTES) {
      throw Object.assign(new Error("PAYLOAD_TOO_LARGE"), {httpStatus: 413});
    }
    chunks.push(buf);
  }
  if (chunks.length === 0) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    return null;
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = Buffer.from(JSON.stringify(body), "utf8");
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": payload.byteLength
  });
  res.end(payload);
}

function isPairRequest(value: unknown): value is PairRequest {
  if (!value || typeof value !== "object") return false;
  const body = value as PairRequest;
  return typeof body.clientName === "string"
    && typeof body.extensionVersion === "string"
    && typeof body.protocolVersion === "string";
}

function isResolveRequest(value: unknown): value is ResolveContextRequest {
  if (!value || typeof value !== "object") return false;
  const body = value as ResolveContextRequest;
  return Array.isArray(body.noteIds)
    && body.noteIds.every((id) => typeof id === "string")
    && Array.isArray(body.includeAttachmentIds)
    && body.includeAttachmentIds.every((id) => typeof id === "string");
}

export {PROTOCOL_VERSION};
