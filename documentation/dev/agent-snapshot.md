# Agent snapshot

## Start here

Read `PRODUCT.md`, `documentation/README.md`, `documentation/system-design.md`, then the area SSOT.

## Status

- `Implemented`: HTTP companion, pairing, vault ports, Obsidian plugin shell, protocol package, documentation set.
- `Verified`: `pnpm build`, `pnpm typecheck`, `pnpm test` (path, pairing, status, resolve/read).
- `Proposed`: Community Plugin listing polish, deeper packaging docs.
- `Unverified`: live Obsidian Desktop pairing UX; macOS/Windows release packaging.

## Next safe actions

1. Load `dist/` into a real vault; pair with the noteferry extension popup.
2. Record live evidence in `tests.md` only from observation.
3. Keep protocol changes synchronized with [noteferry](https://github.com/lancelee2026/noteferry).

## Out of scope here

Picker UI, provider adapters, website, Worker, Lifetime license forms.
