# Security

## Network

- Listen only on `127.0.0.1`.
- Reject unexpected `Host` headers.
- Optional Origin allowlist; extension service-worker requests may omit Origin.
- Cap JSON body size; reject oversized file reads.

## Pairing secrets

- Generate high-entropy secrets.
- Persist only SHA-256 hashes on the Companion side (Obsidian `data.json` across restarts).
- Pending Allow requests are short-lived and not persisted; approved clients are.
- Return plaintext secret once at approval; never log it.
- Compare hashes with timing-safe equality.

## Shop keys and trial state

- A pasted shop key may be stored in plaintext in this vault's plugin `data.json` and vault settings sidecar so the extension can redeem again after reinstall. Pairing secrets stay hashed.
- That shop key may follow the user's own vault sync or backup. This is accepted in V1.
- Trial count and vault trial scope stay when the user disconnects the browser.
- This computer's paid-seat identifier is a random UUID in the user-account directory. The file holds only that identifier. It is not written into the vault sidecar.
- Never log shop keys, seat identifiers, vault paths, filenames, titles, search terms, or note bodies.

## Path containment

- Normalize vault-relative paths; reject `..`, absolute paths, drive letters, NUL.
- Resolve through Obsidian APIs after normalization.
- Paths never appear in URL query strings.

## Logging

Allowed: error code, duration, byte count, opaque request id.
Forbidden: bearer values, absolute/vault paths, filenames, titles, search terms, note bodies, stacks with filesystem detail.

## Obsidian policy notes

- No client telemetry in this plugin.
- Disclose local network use in future Community Plugin listing text (`Proposed`).
- Desktop-only (`isDesktopOnly: true`).
