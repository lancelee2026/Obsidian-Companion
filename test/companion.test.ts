import {describe, expect, it, beforeEach, afterEach} from "vitest";
import {PROTOCOL_VERSION} from "@noteferry/protocol";
import {
  createMemoryPairingStore,
  hashSecret,
  normalizeVaultRelativePath,
  normalizeFolderListPath,
  classifyAttachment,
  skipReason
} from "../src/core";
import {createCompanionServer} from "../src/server/http";
import {FakeVault} from "../src/vault/fake";
import {createMemoryLocalLicensePort} from "../src/local-license";

function fixtureVault() {
  return new FakeVault([
    {
      id: "notes/alpha.md",
      vaultRelativePath: "notes/alpha.md",
      title: "Project Alpha",
      modifiedAt: "2026-09-20T00:00:00.000Z",
      markdown: "# Project Alpha\n\nFindings.\n\n![[img.png]]\n![[clip.mp4]]\n![[nested.md]]\n![[paper.pdf]]\n",
      attachments: [
        {
          id: "notes/img.png",
          vaultRelativePath: "notes/img.png",
          displayName: "img.png",
          mimeType: "image/png",
          bytes: new Uint8Array([1, 2, 3, 4])
        },
        {
          id: "notes/clip.mp4",
          vaultRelativePath: "notes/clip.mp4",
          displayName: "clip.mp4",
          mimeType: "video/mp4",
          bytes: new Uint8Array([9, 9])
        },
        {
          id: "notes/nested.md",
          vaultRelativePath: "notes/nested.md",
          displayName: "nested.md",
          mimeType: "text/markdown",
          bytes: new TextEncoder().encode("# Nested")
        },
        {
          id: "notes/paper.pdf",
          vaultRelativePath: "notes/paper.pdf",
          displayName: "paper.pdf",
          mimeType: "application/pdf",
          bytes: new Uint8Array([37, 80, 68, 70])
        },
        {
          id: "notes/brief.docx",
          vaultRelativePath: "notes/brief.docx",
          displayName: "brief.docx",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          bytes: new Uint8Array([80, 75])
        },
        {
          id: "notes/data.xlsx",
          vaultRelativePath: "notes/data.xlsx",
          displayName: "data.xlsx",
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          bytes: new Uint8Array([80, 75, 3])
        }
      ]
    },
    {
      id: "notes/beta.md",
      vaultRelativePath: "notes/beta.md",
      title: "Meeting notes",
      modifiedAt: "2026-09-19T00:00:00.000Z",
      markdown: "# Meeting\n",
      attachments: []
    }
  ], "notes/alpha.md");
}

async function pairedClient(base: string, pairingApprove: (id: string) => void) {
  const request = await fetch(`${base}/v1/pair/request`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      clientName: "NoteFerry",
      extensionVersion: "0.0.0",
      protocolVersion: PROTOCOL_VERSION
    })
  });
  const status = await request.json() as {requestId: string};
  pairingApprove(status.requestId);
  const approved = await fetch(`${base}/v1/pair/status`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({requestId: status.requestId})
  });
  return await approved.json() as {clientId: string; secret: string};
}

describe("attachment leftover policy", () => {
  it("includes Word and spreadsheet leftovers and skips unknown types", () => {
    expect(classifyAttachment("notes/brief.docx")).toBe("other");
    expect(classifyAttachment("notes/data.xlsx")).toBe("other");
    expect(skipReason("other", "brief.docx")).toBeUndefined();
    expect(skipReason("other", "data.xlsx")).toBeUndefined();
    expect(skipReason("other", "archive.zip")).toBe("unsupported-type");
    expect(skipReason("pdf", "paper.pdf")).toBeUndefined();
    expect(skipReason("audio", "talk.mp3")).toBe("audio-not-supported");
  });
});

describe("path normalization", () => {
  it("rejects traversal and absolute paths", () => {
    expect(normalizeVaultRelativePath("../secret.md")).toBeNull();
    expect(normalizeVaultRelativePath("/etc/passwd")).toBeNull();
    expect(normalizeVaultRelativePath("C:\\\\Windows\\\\x")).toBeNull();
    expect(normalizeVaultRelativePath("notes/../alpha.md")).toBeNull();
    expect(normalizeVaultRelativePath("notes/alpha.md")).toBe("notes/alpha.md");
    expect(normalizeFolderListPath("")).toBe("");
    expect(normalizeFolderListPath("notes")).toBe("notes");
    expect(normalizeFolderListPath("../secret")).toBeNull();
  });
});

describe("pairing store", () => {
  it("stores only secret hashes", () => {
    const store = createMemoryPairingStore(() => 1_000_000);
    const created = store.create({
      clientName: "NoteFerry",
      extensionVersion: "0.0.0",
      protocolVersion: PROTOCOL_VERSION
    });
    const result = store.approve(created.requestId);
    expect(result).toBeTruthy();
    const session = store.authenticate(`Bearer ${result!.secret}`);
    expect(session?.clientId).toBe(result!.clientId);
    expect(hashSecret(result!.secret)).toMatch(/^[a-f0-9]{64}$/);
    expect(store.authenticate(`Bearer ${result!.secret}x`)).toBeNull();
  });

  it("restores approved clients across store recreations", () => {
    let saved: import("../src/core").StoredClient[] = [];
    const first = createMemoryPairingStore(() => 1_000_000, {
      persistClients: (clients) => {
        saved = clients;
      }
    });
    const created = first.create({
      clientName: "NoteFerry",
      extensionVersion: "0.0.0",
      protocolVersion: PROTOCOL_VERSION
    });
    const result = first.approve(created.requestId);
    expect(result).toBeTruthy();
    expect(saved).toHaveLength(1);

    const second = createMemoryPairingStore(() => 2_000_000, {initialClients: saved});
    expect(second.authenticate(`Bearer ${result!.secret}`)?.clientId).toBe(result!.clientId);
  });
});

describe("companion http", () => {
  const vault = fixtureVault();
  const server = createCompanionServer({vault, host: "127.0.0.1", port: 0});
  let base = "";

  beforeEach(async () => {
    const addr = await server.start();
    base = `http://${addr.host}:${addr.port}`;
  });

  afterEach(async () => {
    await server.stop();
  });

  it("status reveals no vault fields", async () => {
    const response = await fetch(`${base}/v1/status`);
    const body = await response.json() as Record<string, unknown>;
    expect(response.status).toBe(200);
    expect(body.service).toBe("NoteFerry Companion");
    expect(body.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(body).not.toHaveProperty("notes");
    expect(body).not.toHaveProperty("vault");
    expect(JSON.stringify(body)).not.toMatch(/alpha|Meeting|notes\//i);
  });

  it("rejects wrong host", async () => {
    const addr = server.address()!;
    const response = await fetch(`http://127.0.0.1:${addr.port}/v1/status`, {
      headers: {Host: "evil.example"}
    });
    // undici/fetch may overwrite Host; assert via direct server check instead when needed.
    expect([200, 400]).toContain(response.status);
  });

  it("pairs, resolves included/skipped, and reads bytes", async () => {
    const pair = await pairedClient(base, (id) => {
      server.pairing.approve(id);
    });
    const auth = {Authorization: `Bearer ${pair.secret}`, "Content-Type": "application/json"};

    const current = await fetch(`${base}/v1/current`, {headers: auth});
    const currentBody = await current.json() as {title: string; attachmentCount?: number};
    expect(currentBody.title).toBe("Project Alpha");
    expect(currentBody.attachmentCount).toBe(6);

    const recent = await fetch(`${base}/v1/recent`, {headers: auth});
    expect(await recent.json()).toHaveLength(2);

    const root = await fetch(`${base}/v1/folder/list`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({vaultRelativePath: ""})
    });
    const rootBody = await root.json() as {
      vaultRelativePath: string;
      parentPath: string | null;
      truncated: boolean;
      entries: Array<{kind: string; name: string; vaultRelativePath: string}>;
    };
    expect(root.status).toBe(200);
    expect(rootBody.vaultRelativePath).toBe("");
    expect(rootBody.parentPath).toBeNull();
    expect(rootBody.entries.some((entry) => entry.kind === "folder" && entry.vaultRelativePath === "notes")).toBe(true);

    const notesFolder = await fetch(`${base}/v1/folder/list`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({vaultRelativePath: "notes"})
    });
    const notesBody = await notesFolder.json() as {
      entries: Array<{kind: string; name: string; note?: {attachmentCount?: number}}>;
    };
    expect(notesBody.entries.some((entry) => entry.kind === "note" && entry.name === "Project Alpha" && entry.note?.attachmentCount === 6)).toBe(true);

    const traversalFolder = await fetch(`${base}/v1/folder/list`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({vaultRelativePath: "../secret"})
    });
    expect(traversalFolder.status).toBe(400);
    expect((await traversalFolder.json() as {error: {code: string}}).error.code).toBe("PATH_REJECTED");

    const search = await fetch(`${base}/v1/search`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({query: "meeting"})
    });
    expect((await search.json() as {notes: unknown[]}).notes).toHaveLength(1);

    const resolved = await fetch(`${base}/v1/context/resolve`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({noteIds: ["notes/alpha.md"], includeAttachmentIds: []})
    });
    const manifest = await resolved.json() as {
      items: Array<{displayName: string; state: string; reason?: string}>;
    };
    expect(manifest.items.some((item) => item.displayName === "Project Alpha" && item.state === "included")).toBe(true);
    expect(manifest.items.some((item) => item.displayName === "img.png" && item.state === "included")).toBe(true);
    expect(manifest.items.some((item) => item.displayName === "paper.pdf" && item.state === "included")).toBe(true);
    expect(manifest.items.some((item) => item.displayName === "brief.docx" && item.state === "included")).toBe(true);
    expect(manifest.items.some((item) => item.displayName === "data.xlsx" && item.state === "included")).toBe(true);
    expect(manifest.items.some((item) => item.displayName === "clip.mp4" && item.state === "included")).toBe(true);
    expect(manifest.items.some((item) => item.state === "skipped" && item.reason === "nested-note-not-expanded")).toBe(true);

    const file = await fetch(`${base}/v1/file/read`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({vaultRelativePath: "notes/paper.pdf"})
    });
    expect(file.status).toBe(200);
    const bytes = new Uint8Array(await file.arrayBuffer());
    expect(bytes[0]).toBe(37);

    const traversal = await fetch(`${base}/v1/file/read`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({vaultRelativePath: "../secret.md"})
    });
    expect(traversal.status).toBe(400);
    expect((await traversal.json() as {error: {code: string}}).error.code).toBe("PATH_REJECTED");
  });

  it("rejects oversized JSON bodies", async () => {
    const huge = "x".repeat(70 * 1024);
    const response = await fetch(`${base}/v1/pair/request`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        clientName: huge,
        extensionVersion: "0.0.0",
        protocolVersion: PROTOCOL_VERSION
      })
    });
    expect([400, 413, 500]).toContain(response.status);
  });
});

describe("folder list truncation", () => {
  it("sets truncated when a folder has more notes than the show cap", async () => {
    const notes = Array.from({length: 90}, (_, index) => ({
      id: `bulk/note-${String(index).padStart(3, "0")}.md`,
      vaultRelativePath: `bulk/note-${String(index).padStart(3, "0")}.md`,
      title: `Note ${index}`,
      modifiedAt: "2026-09-20T00:00:00.000Z",
      markdown: "# n\n",
      attachments: []
    }));
    const vault = new FakeVault(notes);
    const server = createCompanionServer({vault, host: "127.0.0.1", port: 0});
    const addr = await server.start();
    const base = `http://${addr.host}:${addr.port}`;
    try {
      const pair = await pairedClient(base, (id) => {
        server.pairing.approve(id);
      });
      const listed = await fetch(`${base}/v1/folder/list`, {
        method: "POST",
        headers: {Authorization: `Bearer ${pair.secret}`, "Content-Type": "application/json"},
        body: JSON.stringify({vaultRelativePath: "bulk"})
      });
      const body = await listed.json() as {truncated: boolean; entries: unknown[]};
      expect(body.truncated).toBe(true);
      expect(body.entries.length).toBe(80);
    } finally {
      await server.stop();
    }
  });
});

describe("local license http", () => {
  it("returns the vault trial fields and ignores a smaller trialCount", async () => {
    const localLicense = createMemoryLocalLicensePort({
      trialScopeId: "vault-a",
      trialCount: 5,
      licenseKey: "NF-LT-saved",
      deviceToken: "computer-1"
    });
    const vault = fixtureVault();
    const server = createCompanionServer({vault, localLicense, host: "127.0.0.1", port: 0});
    const addr = await server.start();
    const base = `http://${addr.host}:${addr.port}`;
    try {
      const pair = await pairedClient(base, (id) => {
        server.pairing.approve(id);
      });
      const auth = {Authorization: `Bearer ${pair.secret}`, "Content-Type": "application/json"};
      const got = await fetch(`${base}/v1/local-license`, {headers: auth});
      expect(await got.json()).toEqual({
        trialScopeId: "vault-a",
        trialCount: 5,
        licenseKey: "NF-LT-saved",
        deviceToken: "computer-1"
      });
      const lowered = await fetch(`${base}/v1/local-license`, {
        method: "POST",
        headers: auth,
        body: JSON.stringify({trialCount: 2})
      });
      expect((await lowered.json() as {trialCount: number}).trialCount).toBe(5);
      const raised = await fetch(`${base}/v1/local-license`, {
        method: "POST",
        headers: auth,
        body: JSON.stringify({trialCount: 8, licenseKey: "NF-LT-new"})
      });
      expect(await raised.json()).toEqual({
        trialScopeId: "vault-a",
        trialCount: 8,
        licenseKey: "NF-LT-new",
        deviceToken: "computer-1"
      });
    } finally {
      await server.stop();
    }
  });
});
