import {Plugin, Notice, Modal, Setting, App, PluginSettingTab} from "obsidian";
import {startCompanion, type CompanionServer} from "./index";
import type {ObsidianAppLike} from "./vault/obsidian";

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
        // Revocation of the active client happens via DELETE from the extension.
        // This command shows recovery copy only.
        new Notice("Open the NoteFerry browser extension and disconnect if needed.");
      }
    });

    try {
      this.server = await startCompanion(this.app as unknown as ObsidianAppLike, {
        onPairRequested: (requestId, clientName, actions) => {
          const modal = new PairRequestModal(this.app, clientName, actions);
          modal.open();
          void requestId;
        }
      });
      new Notice("NoteFerry is ready to connect from your browser.");
    } catch {
      new Notice("NoteFerry could not start. Quit other copies of Obsidian and try again.");
    }

    this.addSettingTab(new NoteFerrySettingTab(this.app, this));
  }

  override async onunload(): Promise<void> {
    await this.server?.stop();
    this.server = null;
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
      text: "Connect the NoteFerry browser extension, then approve access when prompted. Notes never leave this computer until you attach them to an AI chat."
    });
    void this.plugin;
  }
}
