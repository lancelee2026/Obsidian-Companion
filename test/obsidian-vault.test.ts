import {describe, expect, it} from "vitest";
import {ObsidianVaultAdapter, type ObsidianAppLike, type ObsidianTFile} from "../src/vault/obsidian";

function file(path: string, extension: string, size = 8): ObsidianTFile {
  const name = path.split("/").pop() ?? path;
  const basename = extension ? name.slice(0, -(extension.length + 1)) : name;
  return {path, basename, extension, stat: {mtime: 0, size}};
}

describe("obsidian embed resolve", () => {
  it("finds wiki embeds through getFirstLinkpathDest", async () => {
    const note = file("notes/alpha.md", "md");
    const sheet = file("files/data.xlsx", "xlsx", 16);
    const app: ObsidianAppLike = {
      vault: {
        getAbstractFileByPath: (path) => path === note.path ? note : null,
        getRoot: () => ({path: "", name: "", children: []}),
        getMarkdownFiles: () => [note],
        read: async () => "",
        readBinary: async () => new ArrayBuffer(0)
      },
      workspace: {
        getActiveFile: () => note,
        on: () => ({})
      },
      metadataCache: {
        getFileCache: (target) => target.path === note.path ? {embeds: [{link: "data.xlsx"}]} : null,
        getFirstLinkpathDest: (link) => link === "data.xlsx" ? sheet : null
      }
    };
    const attachments = await new ObsidianVaultAdapter(app).listAttachments(note.path);
    expect(attachments).toEqual([
      expect.objectContaining({
        id: "files/data.xlsx",
        displayName: "data.xlsx",
        kind: "other",
        byteLength: 16
      })
    ]);
  });
});
