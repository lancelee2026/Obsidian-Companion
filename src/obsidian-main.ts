import {Plugin, Notice, Modal, Setting, App, PluginSettingTab, getLanguage} from "obsidian";
import {
  createLicenseRuntime,
  createMemoryPairingStore,
  deviceTokenPath,
  isStoredClient,
  sidecarPath,
  startCompanion,
  type CompanionServer,
  type LicenseRuntime,
  type PluginLicenseData
} from "./index";
import {detectLocale, interpolate, t, type Locale} from "./i18n";
import {companionSiteUrl} from "./site";
import type {ObsidianAppLike} from "./vault/obsidian";

type PluginData = PluginLicenseData;

/**
 * Obsidian entry. Bundled separately as main.js for the Community Plugin layout.
 */
export default class NoteFerryCompanionPlugin extends Plugin {
  private server: CompanionServer | null = null;
  private license: LicenseRuntime | null = null;

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
      this.license = await createLicenseRuntime({
        readPluginData: () => this.loadData(),
        writePluginData: (data) => this.saveData(data),
        ...(vaultSidecarPath(this.app) ? {sidecarPath: vaultSidecarPath(this.app)!} : {}),
        deviceTokenPath: deviceTokenPath()
      });
      const data = (await this.loadData()) as PluginData | null;
      const initialClients = Array.isArray(data?.clients)
        ? data.clients.filter(isStoredClient)
        : [];
      const pairing = createMemoryPairingStore(Date.now, {
        initialClients,
        persistClients: (clients) => {
          void this.license?.persistClients(clients);
        }
      });

      this.server = await startCompanion(this.app as unknown as ObsidianAppLike, {
        pairing,
        localLicense: this.license,
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

  override onunload(): void {
    const server = this.server;
    this.server = null;
    this.license = null;
    if (server) void server.stop();
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
    await this.license?.clearClients();
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
    new Setting(contentEl).setName(t("pairTitle", locale)).setHeading();
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
    new Setting(containerEl)
      .setName(t("settingsTitle", locale))
      .setDesc(t("settingsLead", locale))
      .setHeading();
    new Setting(containerEl)
      .setName(t("settingsAccess", locale))
      .setDesc(t("settingsAccessHint", locale))
      .addButton((button) =>
        button.setButtonText(t("settingsDisconnect", locale)).setWarning().onClick(() => {
          void this.plugin.revokeAllClients().then(() => this.display());
        })
      );
    addSiteSetting(containerEl, locale, "settingsHelp", "/help");
    addSiteSetting(containerEl, locale, "settingsPrivacy", "/privacy");
    addSiteSetting(containerEl, locale, "settingsContact", "/contact");
  }
}

function addSiteSetting(
  containerEl: HTMLElement,
  locale: Locale,
  nameKey: "settingsHelp" | "settingsPrivacy" | "settingsContact",
  path: string
): void {
  const url = companionSiteUrl(locale, path);
  if (!url) return;
  new Setting(containerEl)
    .setName(t(nameKey, locale))
    .addButton((button) =>
      button.setButtonText(t("settingsOpen", locale)).onClick(() => {
        window.open(url);
      })
    );
}

function vaultSidecarPath(app: App): string | null {
  const vault = app.vault;
  const adapter = vault.adapter as {getBasePath?: () => string};
  const base = adapter.getBasePath?.();
  const configDir = vault.configDir;
  if (!base || !configDir) return null;
  return sidecarPath(base, configDir);
}

function pluginLocale(): Locale {
  return detectLocale(getLanguage());
}
