# Test evidence

## Automated

| Area | Assertion | Status |
|---|---|---|
| Path normalize | traversal and absolute paths rejected | Verified by `pnpm test` |
| Pairing store | auth via hash; wrong secret fails | Verified by `pnpm test` |
| Status | no vault fields in `/v1/status` | Verified by `pnpm test` |
| Resolve | image/pdf included; video/nested skipped | Verified by `pnpm test` |
| File read | bytes returned; traversal `PATH_REJECTED` | Verified by `pnpm test` |
| Oversized body | large pair request rejected | Verified by `pnpm test` |
| Build | `dist/main.js` + `manifest.json` | Verified by `pnpm build` |

## Live / packaging (`Unverified`)

- Pairing Allow/Deny on real Obsidian Desktop.
- Server stops cleanly on plugin unload.
- macOS and Windows vault fixtures for path edge cases.
- Community Plugin listing disclosure matches runtime.

Do not mark live rows Verified from Node FakeVault tests alone.
