# Architecture

## Snapshot

- **Implemented:** loopback HTTP server, pairing store with durable approved-client hashes (pending requests stay in memory), FakeVault tests, Obsidian vault adapter, plugin shell with Allow/Deny pairing UI, esbuild `dist/main.js` + `manifest.json`.
- **Proposed:** deeper Obsidian packaging UX polish, store listing assets.
- **Unverified:** live Obsidian Desktop on macOS/Windows, real-vault path edge cases beyond unit fixtures.

## Component map

```text
Obsidian Desktop
  NoteFerry plugin (this repo)
    pairing UI (Allow / Deny)
    vault/  — Obsidian API adapter
    server/ — 127.0.0.1:27125 HTTP
         |
         | Bearer session; vault JSON + file bytes
         v
Chrome extension service worker  (noteferry repo)
```

## Layers

| Layer | Responsibility |
|---|---|
| `src/server/http.ts` | Host/Origin/Content-Type/body/rate checks; routes |
| `src/core.ts` | Pairing store, path normalize, resolve policy, status |
| `src/vault/obsidian.ts` | Obsidian API: current, recent, search, embeds, read |
| `src/vault/fake.ts` | Deterministic vault for Node tests |
| `src/obsidian-main.ts` | Plugin entry, notices, settings copy |
| `packages/protocol` | Shared types with the extension |

## Data rules

- Paths are vault-relative JSON body fields only.
- `GET /v1/status` returns no vault fields.
- Binary responses are bounded; oversized bodies rejected.
- No vault content is sent to any NoteFerry cloud worker from this plugin.

## Sibling boundary

Attach success, Popup, and `@` Picker are not implemented here. See [noteferry](https://github.com/lancelee2026/noteferry).
