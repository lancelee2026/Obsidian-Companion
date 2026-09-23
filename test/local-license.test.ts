import {describe, expect, it} from "vitest";
import {mkdtemp, readFile, writeFile, mkdir} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {
  applyLicenseWrite,
  createLicenseRuntime,
  deviceTokenPath,
  mergeVaultLicense,
  parseVaultLicense,
  readOrCreateDeviceToken,
  sidecarPayload
} from "../src/local-license";

describe("vault license merge", () => {
  it("lets the sidecar trialScopeId win and keeps the higher count", () => {
    const merged = mergeVaultLicense(
      {trialScopeId: "side", trialCount: 3, licenseKey: ""},
      {trialScopeId: "plugin", trialCount: 8, licenseKey: "NF-LT-a"},
      () => "fresh"
    );
    expect(merged).toEqual({trialScopeId: "side", trialCount: 8, licenseKey: "NF-LT-a"});
  });

  it("ignores a smaller POST trialCount", () => {
    const current = {trialScopeId: "scope", trialCount: 7, licenseKey: "k"};
    expect(applyLicenseWrite(current, {trialCount: 2}).trialCount).toBe(7);
    expect(applyLicenseWrite(current, {trialCount: 9}).trialCount).toBe(9);
  });

  it("does not put deviceToken into the sidecar payload", () => {
    const payload = sidecarPayload({trialScopeId: "s", trialCount: 1, licenseKey: "k"});
    expect(payload).toEqual({trialScopeId: "s", trialCount: 1, licenseKey: "k"});
    expect(payload).not.toHaveProperty("deviceToken");
  });

  it("returns null for empty plugin data", () => {
    expect(parseVaultLicense({clients: []})).toBeNull();
  });
});

describe("device token file", () => {
  it("uses the platform user-config folder", () => {
    expect(deviceTokenPath({}, "/Users/ada", "darwin")).toBe(
      "/Users/ada/Library/Application Support/noteferry/device.json"
    );
    expect(deviceTokenPath({APPDATA: "C:\\Users\\ada\\AppData\\Roaming"}, "/x", "win32")).toBe(
      join("C:\\Users\\ada\\AppData\\Roaming", "noteferry", "device.json")
    );
    expect(deviceTokenPath({}, "/home/ada", "linux")).toBe("/home/ada/.config/noteferry/device.json");
  });

  it("creates one token and reuses it on the next read", async () => {
    const dir = await mkdtemp(join(tmpdir(), "nf-device-"));
    const path = join(dir, "device.json");
    const first = await readOrCreateDeviceToken(path, () => "token-one");
    const second = await readOrCreateDeviceToken(path, () => "token-two");
    expect(first).toBe("token-one");
    expect(second).toBe("token-one");
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual({deviceToken: "token-one"});
  });
});

describe("license runtime persistence", () => {
  it("keeps trial fields after clients are cleared and mirrors the sidecar", async () => {
    const dir = await mkdtemp(join(tmpdir(), "nf-vault-"));
    const sidecar = join(dir, ".obsidian", "noteferry-local.json");
    await mkdir(join(dir, ".obsidian"), {recursive: true});
    await writeFile(sidecar, JSON.stringify({trialScopeId: "vault-a", trialCount: 4, licenseKey: "NF-LT-x"}));
    let pluginData: unknown = {clients: [{clientId: "c1"}]};
    const runtime = await createLicenseRuntime({
      readPluginData: async () => pluginData,
      writePluginData: async (data) => {
        pluginData = data;
      },
      sidecarPath: sidecar,
      deviceTokenPath: join(dir, "device.json")
    }, () => "generated");
    await runtime.clearClients();
    const stored = pluginData as {clients: unknown[]; trialScopeId: string; trialCount: number; licenseKey: string};
    expect(stored.clients).toEqual([]);
    expect(stored.trialScopeId).toBe("vault-a");
    expect(stored.trialCount).toBe(4);
    expect(stored.licenseKey).toBe("NF-LT-x");
    const sidecarBody = JSON.parse(await readFile(sidecar, "utf8")) as Record<string, unknown>;
    expect(sidecarBody).toEqual({trialScopeId: "vault-a", trialCount: 4, licenseKey: "NF-LT-x"});
    expect(sidecarBody).not.toHaveProperty("deviceToken");
  });
});
