# Agent Assistant: Obstrlish Plugin

This file provides context and instructions for AI agents working on the Obstrlish Obsidian plugin.

## Project Overview
Obstrlish is an Obsidian plugin for publishing markdown notes to the Nostr protocol (specifically long-form Kind 30023). It handles:
- Multi-profile management (nsec storage).
- Relay connection management.
- Image uploads to blossom servers.
- Publishing, bookmarking, and highlighting on Nostr.

## Core Stack
- **Language**: TypeScript
- **Framework**: Obsidian Plugin API
- **Nostr Library**: `nostr-tools`
- **Build Tool**: `esbuild`

## Key Directories & Files
- `main.ts`: Entry point for the plugin, lifecycle management, and UI registration.
- `src/service/`: Core logic (Nostr, Image uploads).
- `src/tabs/`: Settings interface.
- `src/modals/`: User interaction dialogs.
- `manifest.json`: Plugin metadata for Obsidian.
- `package.json`: Dependencies and build scripts.
- `.juine/guidelines.md`: In-depth project architecture and feature descriptions.

## Development Workflow
- **Install Dependencies**: `npm install`
- **Build**: `npm run build` or `npm run dev` (watch mode).
- **Deployment**: The `main.js`, `manifest.json`, and `styles.css` files are required in the Obsidian vault's `.obsidian/plugins/obstrlish/` directory.

## Tips for Agents
- **Environment**: Always check `manifest.json` for the current version and API requirements.
- **Settings**: Plugin settings are persisted in `data.json` within the plugin folder (managed by Obsidian's `saveData` API).
- **Icons**: Uses Lucide icons (standard in Obsidian).
- **Error Handling**: Use Obsidian's `Notice` for user-facing feedback.
- **Testing**: Manual verification within an Obsidian vault is the primary testing method; check `src/service` for logic that can be unit-tested.

## Contextual Knowledge
Refer to `.juine/guidelines.md` for a deeper dive into the `NostrService` and `ImageUploadService` implementations.
