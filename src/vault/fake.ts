import type {
  SearchRequest,
  SearchResponse,
  VaultAttachmentDescriptor,
  VaultNoteSummary
} from "@noteferry/protocol";
import {classifyAttachment, type VaultPort} from "../core";

export type FakeNote = {
  id: string;
  vaultRelativePath: string;
  title: string;
  modifiedAt: string;
  markdown: string;
  attachments: Array<{
    id: string;
    vaultRelativePath: string;
    displayName: string;
    mimeType: string;
    bytes: Uint8Array;
  }>;
};

export class FakeVault implements VaultPort {
  private currentId: string | null;
  private readonly recentIds: string[] = [];
  private readonly notes = new Map<string, FakeNote>();
  private readonly files = new Map<string, Uint8Array>();

  constructor(notes: FakeNote[], currentId?: string) {
    for (const note of notes) {
      this.notes.set(note.id, note);
      this.files.set(note.vaultRelativePath, new TextEncoder().encode(note.markdown));
      for (const attachment of note.attachments) {
        this.files.set(attachment.vaultRelativePath, attachment.bytes);
      }
      this.recentIds.push(note.id);
    }
    this.currentId = currentId ?? notes[0]?.id ?? null;
  }

  setCurrent(noteId: string | null): void {
    this.currentId = noteId;
    if (noteId) {
      const next = [noteId, ...this.recentIds.filter((id) => id !== noteId)].slice(0, 20);
      this.recentIds.length = 0;
      this.recentIds.push(...next);
    }
  }

  async getCurrent(): Promise<VaultNoteSummary | null> {
    if (!this.currentId) return null;
    return this.noteSummary(this.currentId);
  }

  async getRecent(): Promise<VaultNoteSummary[]> {
    const out: VaultNoteSummary[] = [];
    for (const id of this.recentIds) {
      const summary = await this.noteSummary(id);
      if (summary) out.push(summary);
    }
    return out;
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    const query = request.query.trim().toLowerCase();
    const limit = request.limit ?? 20;
    if (!query) return {notes: []};
    const notes: VaultNoteSummary[] = [];
    for (const note of this.notes.values()) {
      const haystack = `${note.title} ${note.vaultRelativePath}`.toLowerCase();
      if (!haystack.includes(query)) continue;
      const summary = await this.noteSummary(note.id);
      if (summary) notes.push(summary);
      if (notes.length >= limit) break;
    }
    return {notes};
  }

  async listAttachments(noteId: string): Promise<VaultAttachmentDescriptor[]> {
    const note = this.notes.get(noteId);
    if (!note) return [];
    return note.attachments.map((attachment) => ({
      id: attachment.id,
      vaultRelativePath: attachment.vaultRelativePath,
      displayName: attachment.displayName,
      mimeType: attachment.mimeType,
      byteLength: attachment.bytes.byteLength,
      kind: classifyAttachment(attachment.vaultRelativePath, attachment.mimeType)
    }));
  }

  async resolveNotePath(noteId: string): Promise<string | null> {
    return this.notes.get(noteId)?.vaultRelativePath ?? null;
  }

  async readFile(vaultRelativePath: string): Promise<Uint8Array> {
    const bytes = this.files.get(vaultRelativePath);
    if (!bytes) throw Object.assign(new Error("NOT_FOUND"), {code: "NOT_FOUND"});
    return bytes;
  }

  async noteSummary(noteId: string): Promise<VaultNoteSummary | null> {
    const note = this.notes.get(noteId);
    if (!note) return null;
    const bytes = this.files.get(note.vaultRelativePath);
    return {
      id: note.id,
      vaultRelativePath: note.vaultRelativePath,
      title: note.title,
      modifiedAt: note.modifiedAt,
      byteLength: bytes?.byteLength ?? 0
    };
  }
}
