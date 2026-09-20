# Documentation map

This directory is the implementation authority for the Obsidian Companion. Status words:

- `Implemented`: code exists in this repository.
- `Verified`: a named check passed with evidence.
- `Proposed`: approved direction, not yet implemented.
- `Unverified`: required live or packaging observation is missing.

| Question | SSOT |
|---|---|
| What is the product? | [`../PRODUCT.md`](../PRODUCT.md) |
| Agent rules | [`../AGENTS.md`](../AGENTS.md) |
| What runs where? | [`architecture.md`](architecture.md) |
| Development constitution | [`system-design.md`](system-design.md) |
| Extension ↔ Companion protocol | [`protocol.md`](protocol.md) |
| Pairing, path, and logging defenses | [`security.md`](security.md) |
| What has been tested? | [`tests.md`](tests.md) |
| Where to resume? | [`dev/agent-snapshot.md`](dev/agent-snapshot.md) |

Chrome extension UI, provider attach, and `confirmAttached()` rules are owned by [noteferry](https://github.com/lancelee2026/noteferry). Keep `packages/protocol` aligned with that repo.
