import {Plugin, Notice, Modal, Setting, App, PluginSettingTab} from "obsidian";
import * as ObsidianApi from "obsidian";
import {
  createMemoryPairingStore,
  isStoredClient,
  startCompanion,
  type CompanionServer,
  type StoredClient
} from "./index";
import {detectLocale, interpolate, t, type Locale} from "./i18n";
import type {ObsidianAppLike} from "./vault/obsidian";

type PluginData = {
  clients?: StoredClient[];
};

/**
 * Obsidian entry. Bundled separately as main.js for the Community Plugin layout.
 */
export default class NoteFerryCompanionPlugin extends Plugin {
  private server: CompanionServer | null = null;

  override async onload(): Promise<void> {
    const locale = pluginLocale();
    this.addCommand({
      id: "noteferry-revoke-browser",
      name: t("commandRevoke", locale),
      callback: () => {
        void this.revokeAllClients();
      }
    });

    try {
      const data = (await this.loadData()) as PluginData | null;
      const initialClients = Array.isArray(data?.clients)
        ? data.clients.filter(isStoredClient)
        : [];
      const pairing = createMemoryPairingStore(Date.now, {
        initialClients,
        persistClients: (clients) => {
          void this.saveData({clients} satisfies PluginData);
        }
      });

      this.server = await startCompanion(this.app as unknown as ObsidianAppLike, {
        pairing,
        onPairRequested: (requestId, clientName, actions) => {
          const modal = new PairRequestModal(this.app, clientName, actions);
          modal.open();
          void requestId;
        }
      });
      new Notice(
        t(initialClients.length > 0 ? "noticeReadyPaired" : "noticeReadyNew", locale)
      );
    } catch {
      new Notice(t("noticeStartFail", locale));
    }

    this.addSettingTab(new NoteFerrySettingTab(this.app, this));
  }

  override async onunload(): Promise<void> {
    await this.server?.stop();
    this.server = null;
  }

  async revokeAllClients(): Promise<void> {
    const locale = pluginLocale();
    const pairing = this.server?.pairing;
    if (!pairing) {
      new Notice(t("noticeNotRunning", locale));
      return;
    }
    const data = (await this.loadData()) as PluginData | null;
    const clients = Array.isArray(data?.clients) ? data.clients : [];
    for (const client of clients) {
      if (isStoredClient(client)) pairing.revoke(client.clientId);
    }
    await this.saveData({clients: []} satisfies PluginData);
    new Notice(t("noticeRevoked", locale));
  }
}

class PairRequestModal extends Modal {
  constructor(
    app: App,
    private readonly clientName: string,
    private readonly actions: {approve: () => void; deny: () => void}
  ) {
    super(app);
  }

  override onOpen(): void {
    const locale = pluginLocale();
    const {contentEl} = this;
    contentEl.empty();
    contentEl.createEl("h2", {text: t("pairTitle", locale)});
    contentEl.createEl("p", {
      text: interpolate(t("pairBody", locale), this.clientName)
    });
    new Setting(contentEl)
      .addButton((button) => button.setButtonText(t("deny", locale)).onClick(() => {
        this.actions.deny();
        this.close();
      }))
      .addButton((button) => button.setButtonText(t("allow", locale)).setCta().onClick(() => {
        this.actions.approve();
        this.close();
      }));
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}

class NoteFerrySettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: NoteFerryCompanionPlugin) {
    super(app, plugin);
  }

  override display(): void {
    const locale = pluginLocale();
    const {containerEl} = this;
    containerEl.empty();
    containerEl.createEl("h2", {text: t("settingsTitle", locale)});
    containerEl.createEl("p", {text: t("settingsLead", locale)});
    new Setting(containerEl)
      .setName(t("settingsAccess", locale))
      .setDesc(t("settingsAccessHint", locale))
      .addButton((button) =>
        button.setButtonText(t("settingsDisconnect", locale)).setWarning().onClick(() => {
          void this.plugin.revokeAllClients().then(() => this.display());
        })
      );
  }
}

function pluginLocale(): Locale {
  return detectLocale(obsidianLanguage());
}

function obsidianLanguage(): string {
  const read = (ObsidianApi as {getLanguage?: () => string}).getLanguage;
  if (typeof read === "function") return read();
  const api = globalThis as {moment?: {locale?: () => string}};
  try {
    const fromStorage = localStorage.getItem("language");
    if (fromStorage) return fromStorage;
  } catch {
    /* ignore */
  }
  if (typeof api.moment?.locale === "function") return api.moment.locale();
  return "";
}
