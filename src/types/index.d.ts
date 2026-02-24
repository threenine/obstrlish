

export interface NostrPublishConfiguration {
	privateKey: string;
	relayConfigurationEnabled: boolean;
	relayURLs: string[];
	blossomServerURL: string;
}

export interface RelayConnectionResult {
	success: boolean;
	count: number;
}

