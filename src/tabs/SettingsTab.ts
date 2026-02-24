import {App, ButtonComponent, Notice, PluginSettingTab, Setting, TextComponent} from "obsidian";
import NostrArticlePublishPlugin from "../../main";
import {validatePrivateKey, validateURL} from "../utilities";

export class SettingsTab extends PluginSettingTab {
	plugin: NostrArticlePublishPlugin;
	private readonly refresh: () => void;
	private relayUrlInput: TextComponent;

	constructor(app: App, plugin: NostrArticlePublishPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.refresh = () => this.display();
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		let privateKeyField: HTMLInputElement;

		// Private Key
		new Setting(containerEl)
			.setName('Nostr Private key')
			.setDesc("Your publishing nostr private key")
			.addText((text: TextComponent) => {
				text.setPlaceholder('nsec1..............')
				.setValue(this.plugin.configuration.privateKey)
				.onChange(async (value) => {
					if (validatePrivateKey(value)) {
						this.plugin.configuration.privateKey = value;
						await this.plugin.saveConfiguration();
						this.plugin.startService();
						new Notice("Private key saved!");
					}else {
						new Notice("The private key is not valid");
					}
				});
				privateKeyField = text.inputEl;
				privateKeyField.type = "password";
				privateKeyField.style.width = "400px";
				})
			.addButton((button) =>
				button
					.setTooltip("Copy private key")
					.setIcon("copy")
					.onClick(() => {
						if (privateKeyField) {
							navigator.clipboard.writeText(
								privateKeyField.value
							);
							new Notice("🔐 Private Key Copied to clipboard");
						}
					})
			)
		// end private key
		new Setting(containerEl)
			.setName('Blossom Server URL')
			.setDesc('URL of the Blossom server to connect to')
			.addText((text: TextComponent) => {
				text.setPlaceholder('https://blossom.server.com')
				.setValue(this.plugin.configuration.blossomServerURL)
				.onChange(async (value) => {
					if (validateURL(value)) {
						this.plugin.configuration.blossomServerURL = value;
						await this.plugin.saveConfiguration();
						new Notice("Blossom server URL saved!");
					}else {
						new Notice("The Blossom server URL is not valid");
					}
				});
				text.inputEl.style.width = "400px";
			})
		;

		// Configure relays
		new Setting(containerEl)
			.setName("Relay Configuration")
			.setDesc("Edit relay configuration to refresh connection to relays")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.configuration.relayConfigurationEnabled)
					.onChange(async (value) => {
						this.plugin.configuration.relayConfigurationEnabled = value;
						await this.plugin.saveConfiguration();
						this.refresh();
					})
			);
		// end configure relays
		// Manage Relays


		if (this.plugin.configuration.relayConfigurationEnabled) {
			containerEl.createEl("h5", { text: "Relay Configuration" });
			new Setting(this.containerEl)
				.setName("Reconnect to relays ")
				.setDesc("Refresh connection to relays")
				.addButton((btn: ButtonComponent) => {
					btn.setIcon("reset");
					btn.setCta();
					btn.setTooltip("Reconnect to relays");
					btn.onClick(async () => {
						new Notice(`Attempting to reconnect to relays...`);
						this.refresh();
						await this.plugin.nostrService.relaysConnect();
					});
				});
			new Setting(this.containerEl)
				.setDesc("Add a relay URL to settings")
				.setName("Add Relay")
				.addText((relayUrlInput) => {
					relayUrlInput.setPlaceholder("wss://relay.domain.com");
					relayUrlInput.onChange(() => {
						this.relayUrlInput = relayUrlInput;
					});
				})
				.addButton((btn) => {
					btn.setIcon("plus");
					btn.setCta();
					btn.setTooltip("Add this relay");
					btn.onClick(async () => {
						try {
							const addedRelayUrl = this.relayUrlInput.getValue();
							if (validateURL(addedRelayUrl)) {
								this.plugin.configuration.relayURLs.push(
									addedRelayUrl
								);
								await this.plugin.saveConfiguration();
								new Notice(
									`Added ${addedRelayUrl} to relay configuration.`
								);
								new Notice(`Re-connecting to Nostr...`);
								this.refresh();
								await this.plugin.nostrService.relaysConnect();
								this.relayUrlInput.setValue("");
							} else {
								new Notice("Invalid URL added");
							}
						} catch {
							new Notice("The relay url could not be added.");
						}
					});
				});

			for (const [i, url] of this.plugin.configuration.relayURLs.entries()) {
				new Setting(this.containerEl)
					.setDesc(
						`${this.plugin.nostrService.relayInformation(url)
							? "connected"
							: "disconnected"
						}`
					)
					.setName(
						`${this.plugin.nostrService.relayInformation(url)
							? "🟢"
							: "🔴"
						}  ${url} `
					)
					.addButton((btn) => {
						btn.setIcon("trash");
						btn.setTooltip("Remove this relay");
						btn.onClick(async () => {
							if (
								confirm(
									"Are you sure you want to delete this relay? This cannot be undone."
								)
							) {
								this.plugin.configuration.relayURLs.splice(i, 1);
								await this.plugin.saveConfiguration();
								this.refresh();
								new Notice("Relay successfully deleted.");
								new Notice(`Re-connecting to Nostr...`);
								await this.plugin.nostrService.relaysConnect();
							}
						});
					});
			}
		}
	}
}
