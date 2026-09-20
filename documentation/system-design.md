# System design

## Non-negotiable boundary

This plugin is a thin, local, read-only companion for NoteFerry. It must not grow into a vault manager, AI chat, sync service, or telemetry client.

## Gates

1. **Automated:** `pnpm build`, `pnpm typecheck`, `pnpm test` pass.
2. **Security:** pairing hash-only storage, path containment, Host checks, status without vault fields — covered by unit tests where listed in `tests.md`.
3. **Live Obsidian:** pairing modal, enable/disable, unload closes server — `Unverified` until observed.
4. **Release:** macOS/Windows packaging and Community Plugin disclosure — `Proposed`.

## Rules

- `strict` TypeScript; keep server logic testable without Obsidian runtime.
- Prefer Obsidian APIs over filesystem escape.
- Align `PROTOCOL_VERSION` with the extension before shipping protocol changes.
- User copy: no port, localhost, token, or HTTP jargon.
- Status vocabulary: `Implemented` / `Verified` / `Proposed` / `Unverified` only.

## Deferred

Write-back to vault, semantic search, recursive note expansion, multi-vault remote access, Firefox, mobile Obsidian, client telemetry.
