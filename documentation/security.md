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
