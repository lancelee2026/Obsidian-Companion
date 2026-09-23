# Test evidence

## Automated

| Area | Assertion | Status |
|---|---|---|
| Path normalize | traversal and absolute paths rejected | Verified by `pnpm test` |
| Pairing store | auth via hash; wrong secret fails; approved clients restore after recreate | Verified by `pnpm test` |
| Status | no vault fields in `/v1/status` | Verified by `pnpm test` |
| Resolve | image/pdf/mp4/docx/xlsx included; nested skipped | Verified by `pnpm test` |
| File read | bytes returned; traversal `PATH_REJECTED` | Verified by `pnpm test` |
| Folder list | root/notes listing, attachmentCount, traversal rejected, truncated at show cap | Verified by `pnpm test` |
| Oversized body | large pair request rejected | Verified by `pnpm test` |
| Locale | Obsidian zh-TW maps to zh-Hant; Allow is 允許 | Verified by `pnpm test` |
| Vault trial merge | sidecar scope wins; count takes max; smaller POST is ignored | Verified by `pnpm test` |
| Trial persist | clearing clients keeps trial fields; sidecar has no computer seat id | Verified by `pnpm test` |
| Local license HTTP | authenticated GET/POST; smaller trialCount ignored | Verified by `pnpm test` |
| Build | `dist/main.js` + `manifest.json` + `noteferry-companion.zip` | Verified by `pnpm build` |

## Live / packaging (`Unverified`)

- Pairing Allow/Deny on real Obsidian Desktop (copy follows Obsidian language: 允许/拒绝 in zh).
- Server stops cleanly on plugin unload.
- macOS and Windows vault fixtures for path edge cases.
- Community Plugin listing disclosure matches runtime.

Current automated result: `pnpm test` (19), `pnpm typecheck`, and `pnpm build` (includes `dist/noteferry-companion.zip`) pass after the wider leftover allowlist and the 2 GB read ceiling.

Do not mark live rows Verified from Node FakeVault tests alone.
