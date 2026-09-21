# Extension ↔ Companion protocol

Owned here for the Companion implementation. Types live in `packages/protocol`. Keep aligned with [noteferry](https://github.com/lancelee2026/noteferry) `packages/protocol`.

## Transport

- Bind: `127.0.0.1:27125` only.
- `PROTOCOL_VERSION = "1.0"`.
- JSON: `Content-Type: application/json`.
- Vault endpoints: `Authorization: Bearer <secret>`.
- `GET /v1/status` is unauthenticated and vault-free.

## Endpoints

| Method/path | Auth | Status |
|---|---|---|
| `GET /v1/status` | none | Implemented |
| `POST /v1/pair/request` | none, rate-limited | Implemented |
| `POST /v1/pair/status` | request id | Implemented |
| `GET /v1/session` | bearer | Implemented |
| `GET /v1/current` | bearer | Implemented |
| `GET /v1/recent` | bearer | Implemented |
| `POST /v1/search` | bearer | Implemented |
| `POST /v1/folder/list` | bearer | Implemented |
| `POST /v1/context/resolve` | bearer | Implemented |
| `POST /v1/file/read` | bearer | Implemented |
| `DELETE /v1/client` | bearer | Implemented |

## Pairing

1. Extension posts `PairRequest`.
2. Obsidian shows Allow/Deny.
3. Extension polls; on approve, secret returned once.
4. Companion stores SHA-256 hash only; extension stores secret in `chrome.storage.local`.
5. `DELETE /v1/client` revokes the session.

`VaultNoteSummary.attachmentCount` and `POST /v1/folder/list` are **Implemented** (additive). Folder listing uses Obsidian vault APIs only. Align types with [noteferry](https://github.com/lancelee2026/noteferry) `documentation/protocol.md` and `phase-plan.md` Picker pack slice.

## Errors

Envelope: `{ "error": { "code", "message", "retryable" } }` using `CompanionErrorCode`. Messages are UI-safe; logs omit paths and secrets.
