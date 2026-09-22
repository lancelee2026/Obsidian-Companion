# Test evidence

## Automated

| Area | Assertion | Status |
|---|---|---|
| Path normalize | traversal and absolute paths rejected | Verified by `pnpm test` |
| Pairing store | auth via hash; wrong secret fails; approved clients restore after recreate | Verified by `pnpm test` |
| Status | no vault fields in `/v1/status` | Verified by `pnpm test` |
| Resolve | image/pdf/mp4 included; nested skipped | Verified by `pnpm test` |
| File read | bytes returned; traversal `PATH_REJECTED` | Verified by `pnpm test` |
| Folder list | root/notes listing, attachmentCount, traversal rejected, truncated at show cap | Verified by `pnpm test` |
| Oversized body | large pair request rejected | Verified by `pnpm test` |
| Build | `dist/main.js` + `manifest.json` | Verified by `pnpm build` |

## Live / packaging (`Unverified`)

- Pairing Allow/Deny on real Obsidian Desktop (copy follows Obsidian language: 允许/拒绝 in zh).
- Server stops cleanly on plugin unload.
- macOS and Windows vault fixtures for path edge cases.
- Community Plugin listing disclosure matches runtime.

Current automated result: `pnpm test` (9), `pnpm typecheck`, and `pnpm build` pass after plugin UI follows Obsidian language.

Do not mark live rows Verified from Node FakeVault tests alone.
