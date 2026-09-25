import {open, mkdir, readFile, writeFile} from "node:fs/promises";
import {homedir} from "node:os";
import {dirname, join} from "node:path";
import {randomUUID} from "node:crypto";
import type {LocalLicenseResponse, LocalLicenseWriteRequest} from "@noteferry/protocol";
import type {StoredClient} from "./core";

export const SIDECAR_FILENAME = "noteferry-local.json";

export type VaultLicenseFields = {
  trialScopeId: string;
  trialCount: number;
  licenseKey: string;
};

export type PluginLicenseData = {
  clients?: StoredClient[];
  trialScopeId?: string;
  trialCount?: number;
  licenseKey?: string;
};

export type LocalLicensePort = {
  snapshot(): Promise<LocalLicenseResponse>;
  write(patch: LocalLicenseWriteRequest): Promise<LocalLicenseResponse>;
};

export type LicenseRuntime = LocalLicensePort & {
  fields(): VaultLicenseFields;
  persistClients(clients: StoredClient[]): Promise<void>;
  clearClients(): Promise<void>;
};

function normalizeCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function parseVaultLicense(raw: unknown): VaultLicenseFields | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const trialScopeId = typeof row.trialScopeId === "string" ? row.trialScopeId.trim() : "";
  const licenseKey = typeof row.licenseKey === "string" ? row.licenseKey : "";
  if (!trialScopeId && normalizeCount(row.trialCount) === 0 && !licenseKey) return null;
  return {
    trialScopeId,
    trialCount: normalizeCount(row.trialCount),
    licenseKey
  };
}

export function sidecarPayload(fields: VaultLicenseFields): VaultLicenseFields {
  return {
    trialScopeId: fields.trialScopeId,
    trialCount: fields.trialCount,
    licenseKey: fields.licenseKey
  };
}

export function mergeVaultLicense(
  sidecar: VaultLicenseFields | null,
  plugin: VaultLicenseFields | null,
  generateId: () => string = randomUUID
): VaultLicenseFields {
  const trialScopeId = sidecar?.trialScopeId || plugin?.trialScopeId || generateId();
  return {
    trialScopeId,
    trialCount: Math.max(sidecar?.trialCount ?? 0, plugin?.trialCount ?? 0),
    licenseKey: sidecar?.licenseKey || plugin?.licenseKey || ""
  };
}

export function applyLicenseWrite(current: VaultLicenseFields, patch: LocalLicenseWriteRequest): VaultLicenseFields {
  const nextCount = patch.trialCount === undefined
    ? current.trialCount
    : Math.max(current.trialCount, normalizeCount(patch.trialCount));
  const nextKey = patch.licenseKey && patch.licenseKey.length > 0 ? patch.licenseKey : current.licenseKey;
  return {
    trialScopeId: current.trialScopeId,
    trialCount: nextCount,
    licenseKey: nextKey
  };
}

export function deviceTokenPath(
  env: NodeJS.ProcessEnv = process.env,
  home = homedir(),
  platform = process.platform
): string {
  if (platform === "darwin") {
    return join(home, "Library", "Application Support", "noteferry", "device.json");
  }
  if (platform === "win32") {
    return join(env.APPDATA || join(home, "AppData", "Roaming"), "noteferry", "device.json");
  }
  return join(env.XDG_CONFIG_HOME || join(home, ".config"), "noteferry", "device.json");
}

export function sidecarPath(vaultBase: string, configDir: string): string {
  return join(vaultBase, configDir, SIDECAR_FILENAME);
}

function parseDeviceToken(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {deviceToken?: unknown};
    return typeof parsed.deviceToken === "string" ? parsed.deviceToken.trim() : "";
  } catch {
    return "";
  }
}

export async function readOrCreateDeviceToken(filePath: string, generateId: () => string = randomUUID): Promise<string> {
  await mkdir(dirname(filePath), {recursive: true});
  try {
    const handle = await open(filePath, "wx");
    try {
      const token = generateId();
      await handle.writeFile(JSON.stringify({deviceToken: token}), "utf8");
      return token;
    } finally {
      await handle.close();
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const token = parseDeviceToken(await readFile(filePath, "utf8"));
      if (token) return token;
    } catch {
      /* concurrent writer */
    }
    await delay(25);
  }
  const existing = parseDeviceToken(await readFile(filePath, "utf8").catch(() => ""));
  if (existing) return existing;
  const token = generateId();
  await writeFile(filePath, JSON.stringify({deviceToken: token}), "utf8");
  return token;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined") {
      window.setTimeout(resolve, ms);
      return;
    }
    queueMicrotask(resolve);
  });
}

async function readSidecarFile(path: string): Promise<VaultLicenseFields | null> {
  try {
    return parseVaultLicense(JSON.parse(await readFile(path, "utf8")) as unknown);
  } catch {
    return null;
  }
}

async function writeSidecarFile(path: string, fields: VaultLicenseFields): Promise<void> {
  await mkdir(dirname(path), {recursive: true});
  await writeFile(path, `${JSON.stringify(sidecarPayload(fields))}\n`, "utf8");
}

export type LicenseDisk = {
  readPluginData(): Promise<unknown>;
  writePluginData(data: PluginLicenseData): Promise<void>;
  sidecarPath?: string;
  deviceTokenPath: string;
};

export async function createLicenseRuntime(
  disk: LicenseDisk,
  generateId: () => string = randomUUID
): Promise<LicenseRuntime> {
  const pluginRaw = await disk.readPluginData();
  const pluginData = pluginRaw && typeof pluginRaw === "object" ? pluginRaw as PluginLicenseData : {};
  let clients = Array.isArray(pluginData.clients) ? pluginData.clients : [];
  let fields = mergeVaultLicense(
    disk.sidecarPath ? await readSidecarFile(disk.sidecarPath) : null,
    parseVaultLicense(pluginData),
    generateId
  );

  async function persist(): Promise<void> {
    const data: PluginLicenseData = {
      clients,
      trialScopeId: fields.trialScopeId,
      trialCount: fields.trialCount,
      licenseKey: fields.licenseKey
    };
    await disk.writePluginData(data);
    if (!disk.sidecarPath) return;
    try {
      await writeSidecarFile(disk.sidecarPath, fields);
    } catch {
      /* sidecar is best-effort */
    }
  }

  await persist();

  let chain = Promise.resolve();
  function enqueue(work: () => Promise<void>): Promise<void> {
    chain = chain.then(work, work);
    return chain;
  }

  async function snapshot(): Promise<LocalLicenseResponse> {
    const deviceToken = await readOrCreateDeviceToken(disk.deviceTokenPath, generateId);
    return {
      trialScopeId: fields.trialScopeId,
      trialCount: fields.trialCount,
      licenseKey: fields.licenseKey,
      deviceToken
    };
  }

  return {
    fields: () => ({...fields}),
    async persistClients(next) {
      await enqueue(async () => {
        clients = next;
        await persist();
      });
    },
    async clearClients() {
      await enqueue(async () => {
        clients = [];
        await persist();
      });
    },
    snapshot,
    async write(patch) {
      await enqueue(async () => {
        fields = applyLicenseWrite(fields, patch);
        await persist();
      });
      return snapshot();
    }
  };
}

export function createMemoryLocalLicensePort(initial?: Partial<LocalLicenseResponse>): LocalLicensePort {
  let fields: VaultLicenseFields = {
    trialScopeId: initial?.trialScopeId || "scope-test",
    trialCount: initial?.trialCount ?? 0,
    licenseKey: initial?.licenseKey ?? ""
  };
  const deviceToken = initial?.deviceToken || "device-test";
  return {
    async snapshot() {
      return {
        trialScopeId: fields.trialScopeId,
        trialCount: fields.trialCount,
        licenseKey: fields.licenseKey,
        deviceToken
      };
    },
    async write(patch) {
      fields = applyLicenseWrite(fields, patch);
      return this.snapshot();
    }
  };
}
