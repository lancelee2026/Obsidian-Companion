/**
 * Obsidian vault adapter. Uses a narrow structural App surface so Node tests
 * never import the Obsidian runtime.
 */
import type {
  FolderListRequest,
  FolderListResponse,
  FolderListEntry,
  SearchRequest,
  SearchResponse,
  VaultAttachmentDescriptor,
  VaultNoteSummary
} from "@noteferry/protocol";
import {
  classifyAttachment,
  FOLDER_LIST_SCAN_MAX,
  FOLDER_LIST_SHOW_MAX,
  MAX_FILE_BYTES,
  normalizeFolderListPath,
  normalizeVaultRelativePath,
  parentFolderPath,
  RECENT_LIMIT,
  type VaultPort
} from "../core";

export type ObsidianTFile = {
  path: string;
  basename: string;
  extension: string;
  stat: {mtime: number; size: number};
};

export type ObsidianTFolder = {
  path: string;
  name: string;
  children: Array<ObsidianTFile | ObsidianTFolder>;
};

export type ObsidianMetadataCache = {
  getFileCache(file: ObsidianTFile): {
    embeds?: Array<{link: string}>;
    frontmatter?: Record<string, unknown>;
  } | null;
  getFirstLinkpathDest?(linkpath: string, sourcePath: string): ObsidianTFile | null;
};

export type ObsidianVaultApi = {
  getAbstractFileByPath(path: string): ObsidianTFile | ObsidianTFolder | null;
  getRoot(): ObsidianTFolder;
  getMarkdownFiles(): ObsidianTFile[];
  read(file: ObsidianTFile): Promise<string>;
  readBinary(file: ObsidianTFile): Promise<ArrayBuffer>;
  getResourcePath?(file: ObsidianTFile): string;
  adapter?: {getBasePath?: () => string};
  configDir?: string;
};

export type ObsidianWorkspaceApi = {
  getActiveFile(): ObsidianTFile | null;
  on(event: "file-open", callback: (file: ObsidianTFile | null) => void): {unload?: () => void};
};

export type ObsidianAppLike = {
  vault: ObsidianVaultApi;
  workspace: ObsidianWorkspaceApi;
  metadataCache: ObsidianMetadataCache;
};

function isMarkdown(file: ObsidianTFile | ObsidianTFolder | null | undefined): file is ObsidianTFile {
  return !!file && "extension" in file && file.extension === "md" && "stat" in file;
}

function isFolder(file: ObsidianTFile | ObsidianTFolder | null | undefined): file is ObsidianTFolder {
  return !!file && "children" in file && Array.isArray(file.children);
}

function mimeFor(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".md")) return "text/markdown";
  return "application/octet-stream";
}

export class ObsidianVaultAdapter implements VaultPort {
  private readonly recent: string[] = [];

  constructor(private readonly app: ObsidianAppLike) {
    this.app.workspace.on("file-open", (file) => {
      if (isMarkdown(file)) this.remember(file.path);
    });
    const active = this.app.workspace.getActiveFile();
    if (isMarkdown(active)) this.remember(active.path);
  }

  private remember(path: string): void {
    const next = [path, ...this.recent.filter((item) => item !== path)].slice(0, RECENT_LIMIT);
    this.recent.length = 0;
    this.recent.push(...next);
  }

  private toSummary(file: ObsidianTFile): VaultNoteSummary {
    const cache = this.app.metadataCache.getFileCache(file);
    return {
      id: file.path,
      vaultRelativePath: file.path,
      title: file.basename,
      modifiedAt: new Date(file.stat.mtime).toISOString(),
      byteLength: file.stat.size,
      attachmentCount: cache?.embeds?.length ?? 0
    };
  }

  async listFolder(request: FolderListRequest): Promise<FolderListResponse> {
    const path = normalizeFolderListPath(request.vaultRelativePath);
    if (path === null) throw Object.assign(new Error("PATH_REJECTED"), {code: "PATH_REJECTED"});
    const folder = path === "" ? this.app.vault.getRoot() : this.app.vault.getAbstractFileByPath(path);
    if (!isFolder(folder)) throw Object.assign(new Error("NOT_FOUND"), {code: "NOT_FOUND"});
    const truncatedScan = folder.children.length > FOLDER_LIST_SCAN_MAX;
    const scanned = folder.children.slice(0, FOLDER_LIST_SCAN_MAX);
    const folders: FolderListEntry[] = [];
    const notes: FolderListEntry[] = [];
    for (const child of scanned) {
      if (isFolder(child)) {
        folders.push({
          kind: "folder",
          name: child.name || child.path.split("/").pop() || child.path,
          vaultRelativePath: child.path
        });
        continue;
      }
      if (isMarkdown(child)) {
        const summary = this.toSummary(child);
        notes.push({
          kind: "note",
          name: summary.title,
          vaultRelativePath: summary.vaultRelativePath,
          note: summary
        });
      }
    }
    folders.sort((a, b) => a.name.localeCompare(b.name));
    notes.sort((a, b) => a.name.localeCompare(b.name));
    const combined = [...folders, ...notes];
    return {
      vaultRelativePath: path,
      parentPath: parentFolderPath(path),
      entries: combined.slice(0, FOLDER_LIST_SHOW_MAX),
      truncated: truncatedScan || combined.length > FOLDER_LIST_SHOW_MAX
    };
  }

  async getCurrent(): Promise<VaultNoteSummary | null> {
    const active = this.app.workspace.getActiveFile();
    return isMarkdown(active) ? this.toSummary(active) : null;
  }

  async getRecent(): Promise<VaultNoteSummary[]> {
    const out: VaultNoteSummary[] = [];
    for (const path of this.recent) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (isMarkdown(file)) out.push(this.toSummary(file));
    }
    return out;
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    const query = request.query.trim().toLowerCase();
    const limit = request.limit ?? 20;
    if (!query) return {notes: []};
    const notes: VaultNoteSummary[] = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      const haystack = `${file.basename} ${file.path}`.toLowerCase();
      if (!haystack.includes(query)) continue;
      notes.push(this.toSummary(file));
      if (notes.length >= limit) break;
    }
    return {notes};
  }

  async listAttachments(noteId: string): Promise<VaultAttachmentDescriptor[]> {
    const file = this.app.vault.getAbstractFileByPath(noteId);
    if (!isMarkdown(file)) return [];
    const cache = this.app.metadataCache.getFileCache(file);
    const embeds = cache?.embeds ?? [];
    const out: VaultAttachmentDescriptor[] = [];
    for (const embed of embeds) {
      const target = this.resolveEmbed(file.path, embed.link);
      if (!target) continue;
      const kind = classifyAttachment(target.path, mimeFor(target.path));
      out.push({
        id: target.path,
        vaultRelativePath: target.path,
        displayName: target.basename + (target.extension ? `.${target.extension}` : ""),
        mimeType: mimeFor(target.path),
        byteLength: target.stat.size,
        kind
      });
    }
    return out;
  }

  private resolveEmbed(fromPath: string, link: string): ObsidianTFile | null {
    const cleaned = link.split("|")[0]?.split("#")[0]?.trim() ?? "";
    if (!cleaned) return null;
    const dest = this.app.metadataCache.getFirstLinkpathDest?.(cleaned, fromPath);
    if (dest && "stat" in dest) return dest;
    const direct = this.app.vault.getAbstractFileByPath(cleaned);
    if (direct && "stat" in direct) return direct;
    const folder = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/")) : "";
    const candidate = folder ? `${folder}/${cleaned}` : cleaned;
    const nested = this.app.vault.getAbstractFileByPath(candidate);
    if (nested && "stat" in nested) return nested;
    return null;
  }

  async resolveNotePath(noteId: string): Promise<string | null> {
    const file = this.app.vault.getAbstractFileByPath(noteId);
    return isMarkdown(file) ? file.path : null;
  }

  async readFile(vaultRelativePath: string): Promise<Uint8Array> {
    const path = normalizeVaultRelativePath(vaultRelativePath);
    if (!path) throw Object.assign(new Error("PATH_REJECTED"), {code: "PATH_REJECTED"});
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file || !("stat" in file)) throw Object.assign(new Error("NOT_FOUND"), {code: "NOT_FOUND"});
    if (file.stat.size > MAX_FILE_BYTES) {
      throw Object.assign(new Error("PAYLOAD_TOO_LARGE"), {code: "PAYLOAD_TOO_LARGE"});
    }
    if (file.extension === "md") {
      const text = await this.app.vault.read(file);
      return new TextEncoder().encode(text);
    }
    const buffer = await this.app.vault.readBinary(file);
    return new Uint8Array(buffer);
  }

  async noteSummary(noteId: string): Promise<VaultNoteSummary | null> {
    const file = this.app.vault.getAbstractFileByPath(noteId);
    return isMarkdown(file) ? this.toSummary(file) : null;
  }
}
