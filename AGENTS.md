# NoteFerry Companion — agent rules

1. Read `PRODUCT.md`, `documentation/README.md`, and `documentation/dev/agent-snapshot.md` before editing.
2. This repository is only the Obsidian Desktop Companion. It is not a NoteFerry desktop app, SaaS, or second vault UI.
3. Use only these status words in handoff claims: `Implemented`, `Verified`, `Proposed`, `Unverified`.
4. Keep protocol types in `packages/protocol` aligned with [noteferry](https://github.com/lancelee2026/noteferry). Do not invent incompatible endpoints without updating both repos.
5. Never log secrets, vault paths, filenames, note titles, search terms, or note bodies. Logs may retain error code, duration, and byte count only.
6. Bind HTTP only to `127.0.0.1`. Reject path traversal. Store pairing secret hashes only, never plaintext secrets at rest.
7. User-facing copy must not expose port, localhost, token, bearer, HTTP, or API key jargon.
8. Do not add telemetry, cloud vault sync, write/delete vault mutations, MCP, RAG, agents, or BYOK.
9. Do not copy Local REST API or E2N plugin code. Original Obsidian API usage only.
10. Run `pnpm build`, `pnpm typecheck`, and `pnpm test` before claiming the automated gate.
11. Update `documentation/tests.md` and `documentation/dev/agent-snapshot.md` at handoff.

SSOT index: `documentation/README.md`.
Extension UI and attach success rules live in [noteferry](https://github.com/lancelee2026/noteferry).
