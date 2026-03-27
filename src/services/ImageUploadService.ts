import {requestUrl, TFile} from "obsidian";
import NostrArticlePublishPlugin from "../../main";
import {sha256} from "@noble/hashes/sha256";
import {bytesToHex} from "@noble/hashes/utils";
import {finalizeEvent} from "nostr-tools";
import {toHex} from "../utilities";

export default class ImageUploadService {
	private plugin: NostrArticlePublishPlugin;

	constructor(plugin: NostrArticlePublishPlugin) {
		this.plugin = plugin;
	}

	async uploadImage(imageFile: TFile): Promise<string> {
		const imageBinary = await this.plugin.app.vault.readBinary(imageFile);
		return await this.uploadBinary(imageBinary, imageFile.name);
	}

	async uploadBinary(binary: ArrayBuffer, fileName: string): Promise<string> {
		const blossomURL = this.plugin.configuration.blossomServerURL;
		if (!blossomURL) {
			throw new Error("Blossom server URL is not configured.");
		}

		const hash = bytesToHex(sha256(new Uint8Array(binary)));
		const contentType = this.getContentType(fileName);
		const uploadUrl = `${blossomURL.replace(/\/$/, "")}/upload`;

		const authEvent = {
			kind: 24242,
			created_at: Math.floor(Date.now() / 1000),
			tags: [
				["u", uploadUrl],
				["method", "POST"],
				["payload", hash],
			],
			content: ""
		};

		const privateKeyHex = toHex(this.plugin.configuration.privateKey);
		const signedEvent = finalizeEvent(authEvent, Buffer.from(privateKeyHex, "hex"));
		const authHeader = `Nostr ${btoa(JSON.stringify(signedEvent))}`;

		try {
			const response = await requestUrl({
				url: uploadUrl,
				method: "POST",
				headers: {
					"Authorization": authHeader,
					"Content-Type": contentType,
				},
				body: binary
			});

			if (response.status === 200 || response.status === 201) {
				// Blossom response body is typically a JSON object with a 'url' field
				if (response.json && response.json.url) {
					return response.json.url;
				}
				// Fallback to Location header if present
				if (response.headers.location) {
					return response.headers.location;
				}
				// Or construct it if we have the hash and server URL
				return `${blossomURL.replace(/\/$/, "")}/${hash}`;
			} else {
				throw new Error(`Upload failed with status ${response.status}`);
			}
		} catch (error) {
			console.error("Blossom upload error:", error);
			throw new Error(`Failed to upload image: ${error.message}`);
		}
	}

	private getContentType(filename: string): string {
		const extension = filename.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'jpg':
			case 'jpeg':
				return 'image/jpeg';
			case 'png':
				return 'image/png';
			case 'gif':
				return 'image/gif';
			case 'webp':
				return 'image/webp';
			case 'svg':
				return 'image/svg+xml';
			default:
				return 'application/octet-stream';
		}
	}
}
