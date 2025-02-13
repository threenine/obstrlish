import NostrArticlePublishPlugin from "../../main";
import {App} from "obsidian";
import {NostrPublishConfiguration} from "../types";
import {finalizeEvent, Relay,  VerifiedEvent} from "nostr-tools";
import {
	DEFAULT_EXPLICIT_RELAY_URLS,
	NOSTR_D_TAG, NOSTR_IMAGE_TAG, NOSTR_PUBLISHED_AT_TAG,
	NOSTR_SUMMARY_TAG, NOSTR_TAGS_TAG,
	NOSTR_TITLE_TAG,
	toHex,
	validateURL
} from "../utilities";
import {v4 as uuidv4} from "uuid";


export default class NostrService {
	private readonly privateKey: string;
	private plugin: NostrArticlePublishPlugin;
	private connected: boolean;
	 poolUrls: string[];
	private relayURLs: string[];
	connectedRelays: Relay[];

	constructor(plugin: NostrArticlePublishPlugin, app: App, configuration: NostrPublishConfiguration) {

		if (!configuration.privateKey) {
			console.log("No private key set for Nostr Publish");
			return;
		}
		this.plugin = plugin;
		this.privateKey = configuration.privateKey;
		this.relayURLs = [];
        this.poolUrls = [];
		if (!configuration.relayURLs || configuration.relayURLs.length === 0) {
			this.relayURLs = DEFAULT_EXPLICIT_RELAY_URLS;
		} else {
			for (const url of configuration.relayURLs) {
				if (validateURL(url)) {
					this.relayURLs.push(url);
				}
			}
		}
		this.relaysConnect().then(result => {
			console.log(`Connected to relays :${result} `)
		});
	}

	public Connected(): boolean {
		return this.connected;
	}

	async relaysConnect(): Promise<void> {
		this.refreshRelayUrls();
		this.connectedRelays = [];

		const connectionPromises = [];
		for (const url of this.relayURLs) {
			connectionPromises.push(new Promise<Relay | null>( (resolve) => {
				Relay.connect(url).then(relayAttempt => {
					relayAttempt.onclose = () => {
						this.connectedRelays.remove(relayAttempt);
						resolve(null);
					}
					this.connectedRelays.push(relayAttempt);
					resolve(relayAttempt);
				}).catch(() => {
					resolve(null);
				});
			}));
		}

		Promise.all(connectionPromises).then(() => {
			if (this.connectedRelays.length > 0) {
				this.setConnectionPool();
				this.connected = true;
			}
		});
	}

	setConnectionPool = () => {
		for (const relay of this.connectedRelays) {
			this.poolUrls.push(relay.url);
		}
	}

	refreshRelayUrls(): void {

		if (!this.plugin.configuration.relayURLs || this.plugin.configuration.relayURLs.length === 0) {
			this.relayURLs = DEFAULT_EXPLICIT_RELAY_URLS;
		} else {
			for (const url of this.plugin.configuration.relayURLs) {
				if (validateURL(url)) {
					this.relayURLs.push(url);
				}
			}
		}
	}

	relayInformation(relayUrl: string): boolean {
		const connected = false;
		for (const r of this.connectedRelays) {
			if (r.url == relayUrl + "/") {
				return r.connected;
			}
		}
		return connected;
	}

	async publish(
		content: string,
		summary: string,
		image: string,
		title: string,
		tags: string[]
	): Promise<boolean> {

		const uuid: string = uuidv4().substring(0, 8);
		const noteTags: string[][] = [[NOSTR_D_TAG, uuid]];
		noteTags.push([NOSTR_SUMMARY_TAG, summary]);
		noteTags.push([NOSTR_TITLE_TAG, title]);
		noteTags.push([NOSTR_IMAGE_TAG, image]);
		if (tags.length > 0) {
			for (const tag of tags) {
				noteTags.push([NOSTR_TAGS_TAG, tag]);
			}
		}
		const timestamp = Math.floor(Date.now() / 1000);
		noteTags.push([NOSTR_PUBLISHED_AT_TAG, timestamp.toString()]);
		const note = {
			kind: 30023,
			created_at: timestamp,
			tags: noteTags,
			content: content
		};

		const hex = toHex(this.privateKey);
		const finalEvent = finalizeEvent(note, Buffer.from(hex));

		const result = await this.publishingToRelays(finalEvent)

		return result.success;
	}

	async publishingToRelays(event: VerifiedEvent)
		: Promise<{ success: boolean, publishedRelays: string[] }> {

		try {
			const publishPromises = this.connectedRelays.map(async (relay: Relay) => {
				try {
					if (relay.connected) {
						await relay.publish(event);
						return {success: true, url: relay.url};

					} else {
						return {success: false, url: relay.url};
					}
				} catch (error) {
					return {success: false, url: relay.url};

				}
			});
			const results = await Promise.all(publishPromises);
			const publishedRelays: string[] = results
				.filter((result) => result.success)
				.map((result) => result.url);

			console.log(
				`Published to ${publishedRelays.length} / ${this.connectedRelays.length} relays.`
			);
			if (publishedRelays.length === 0) {
				console.log("Didn't send to any relays");
				return {success: false, publishedRelays: []};

			} else {
				console.log("Sent to relays");
				return {success: true, publishedRelays};
			}

		} catch (error) {
			console.error("An error occurred while publishing to relays", error);
			return {success: false, publishedRelays: []};
		}
	}
}
