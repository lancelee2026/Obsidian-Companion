import {PROTOCOL_VERSION, type CompanionStatusResponse} from "@noteferry/protocol";
import {
  SERVICE_VERSION,
  createMemoryPairingStore,
  hashSecret,
  normalizeVaultRelativePath,
  statusResponse
} from "./core";
import {createCompanionServer, type CompanionServer} from "./server/http";
import {FakeVault} from "./vault/fake";
import {ObsidianVaultAdapter, type ObsidianAppLike} from "./vault/obsidian";

export {
  createMemoryPairingStore,
  hashSecret,
  normalizeVaultRelativePath,
  statusResponse,
  SERVICE_VERSION
} from "./core";
export {createCompanionServer} from "./server/http";
export {FakeVault} from "./vault/fake";
export {ObsidianVaultAdapter} from "./vault/obsidian";
export type {CompanionServer} from "./server/http";
export type {ObsidianAppLike} from "./vault/obsidian";

/** Phase 0 contract anchor retained for imports. */
export const companionStatusFixture = (serviceVersion: string): CompanionStatusResponse => ({
  service: "NoteFerry Companion",
  serviceVersion,
  protocolVersion: PROTOCOL_VERSION
});

/**
 * Starts the local Companion HTTP service against an Obsidian-like app.
 * The Obsidian shell wires approve/deny notices without exposing engineering terms.
 */
export async function startCompanion(
  app: ObsidianAppLike,
  options?: {
    onPairRequested?: (requestId: string, clientName: string, actions: {
      approve: () => void;
      deny: () => void;
    }) => void;
  }
): Promise<CompanionServer> {
  const vault = new ObsidianVaultAdapter(app);
  const server = createCompanionServer({
    vault,
    onPairRequested: (requestId, clientName) => {
      options?.onPairRequested?.(requestId, clientName, {
        approve: () => {
          server.pairing.approve(requestId);
        },
        deny: () => {
          server.pairing.deny(requestId);
        }
      });
    }
  });
  await server.start();
  return server;
}

export const companionMeta = {
  serviceVersion: SERVICE_VERSION,
  protocolVersion: PROTOCOL_VERSION,
  status: statusResponse()
} as const;
