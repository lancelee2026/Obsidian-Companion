import {Plugin, Notice, Modal, Setting, App, PluginSettingTab} from "obsidian";
import {
  createMemoryPairingStore,
  isStoredClient,
  startCompanion,
  type CompanionServer,
  type StoredClient
} from "./index";
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
    this.addCommand({
      id: "noteferry-revoke-browser",
      name: "NoteFerry: Disconnect browser access",
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
        initialClients.length > 0
          ? "NoteFerry is ready. Your browser stays connected."
          : "NoteFerry is ready to connect from your browser."
      );
    } catch {
      new Notice("NoteFerry could not start. Quit other copies of Obsidian and try again.");
    }

    this.addSettingTab(new NoteFerrySettingTab(this.app, this));
  }

  override async onunload(): Promise<void> {
    await this.server?.stop();
    this.server = null;
  }

  async revokeAllClients(): Promise<void> {
    const pairing = this.server?.pairing;
    if (!pairing) {
      new Notice("NoteFerry is not running.");
      return;
    }
    const data = (await this.loadData()) as PluginData | null;
    const clients = Array.isArray(data?.clients) ? data.clients : [];
    for (const client of clients) {
      if (isStoredClient(client)) pairing.revoke(client.clientId);
    }
    await this.saveData({clients: []} satisfies PluginData);
    new Notice("NoteFerry browser access cleared. Pair again from the extension if needed.");
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
    const {contentEl} = this;
    contentEl.empty();
    contentEl.createEl("h2", {text: "Allow NoteFerry?"});
    contentEl.createEl("p", {
      text: `${this.clientName} wants to read notes you choose and attach them in ChatGPT, Claude, or Gemini. Vault files stay on this computer until you attach them.`
    });
    new Setting(contentEl)
      .addButton((button) => button.setButtonText("Deny").onClick(() => {
        this.actions.deny();
        this.close();
      }))
      .addButton((button) => button.setButtonText("Allow").setCta().onClick(() => {
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
    const {containerEl} = this;
    containerEl.empty();
    containerEl.createEl("h2", {text: "NoteFerry"});
    containerEl.createEl("p", {
      text: "Connect the NoteFerry browser extension once. After you Allow access, the connection stays until you disconnect. Notes never leave this computer until you attach them to an AI chat."
    });
    new Setting(containerEl)
      .setName("Browser access")
      .setDesc("Clear saved browser pairing on this computer.")
      .addButton((button) =>
        button.setButtonText("Disconnect browser").setWarning().onClick(() => {
          void this.plugin.revokeAllClients().then(() => this.display());
        })
      );
  }
}
