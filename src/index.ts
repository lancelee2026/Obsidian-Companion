import {PROTOCOL_VERSION, type CompanionStatusResponse} from "@noteferry/protocol";
import {
  SERVICE_VERSION,
  statusResponse,
  type PairingStore
} from "./core";
import {createCompanionServer, type CompanionServer} from "./server/http";
import {ObsidianVaultAdapter, type ObsidianAppLike} from "./vault/obsidian";
import type {LocalLicensePort} from "./local-license";

export {
  createMemoryPairingStore,
  hashSecret,
  isStoredClient,
  normalizeVaultRelativePath,
  normalizeFolderListPath,
  statusResponse,
  SERVICE_VERSION
} from "./core";
export type {PairingStore, PairingStoreOptions, StoredClient} from "./core";
export {createCompanionServer} from "./server/http";
export {FakeVault} from "./vault/fake";
export {ObsidianVaultAdapter} from "./vault/obsidian";
export type {CompanionServer} from "./server/http";
export type {ObsidianAppLike} from "./vault/obsidian";
export {
  applyLicenseWrite,
  createLicenseRuntime,
  createMemoryLocalLicensePort,
  deviceTokenPath,
  mergeVaultLicense,
  parseVaultLicense,
  readOrCreateDeviceToken,
  sidecarPath,
  sidecarPayload
} from "./local-license";
export type {LicenseRuntime, LocalLicensePort, PluginLicenseData, VaultLicenseFields} from "./local-license";

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
    pairing?: PairingStore;
    localLicense?: LocalLicensePort;
    onPairRequested?: (requestId: string, clientName: string, actions: {
      approve: () => void;
      deny: () => void;
    }) => void;
  }
): Promise<CompanionServer> {
  const vault = new ObsidianVaultAdapter(app);
  const server = createCompanionServer({
    vault,
    ...(options?.pairing ? {pairing: options.pairing} : {}),
    ...(options?.localLicense ? {localLicense: options.localLicense} : {}),
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
