import {Notice, Plugin} from 'obsidian';
import {SettingsTab} from './src/tabs/SettingsTab';
import {NostrPublishConfiguration} from './src/types';
import NostrService from "./src/services/NostrService";
import {DEFAULT_EXPLICIT_RELAY_URLS} from "./src/utilities";
import Publish from "./src/modals/Publish";

export default class NostrArticlePublishPlugin extends Plugin {
	configuration: NostrPublishConfiguration
	nostrService: NostrService;

	async onload() {
		await this.loadConfiguration();
		this.startService();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));

		this.addRibbonIcon('newspaper', 'Publish to Nostr', async (evt: MouseEvent) => {
			if (!this.configuration.privateKey) {
				new Notice(`No private key set for Nostr Article Publish cannot publish ${evt.doc.title}`);
			}

			const file = this.app.workspace.getActiveFile()
			if (file) {
				if (this.nostrService.Connected()) {
					new Publish(this.app, this.nostrService, file, this).open()
				}
			}
		});
	}

	onunload() {

	}

	startService() {
		this.nostrService = new NostrService(this, this.app, this.configuration);
	}

	async loadConfiguration() {
		this.configuration = Object.assign({}, {
			privateKey: "",
			relayConfigurationEnabled: false,
			relayURLs: DEFAULT_EXPLICIT_RELAY_URLS,
			blossomServerURL: "",
			statusBarEnabled: true
		}, await this.loadData());
	}

	async saveConfiguration() {
		await this.saveData(this.configuration);
	}
}


