
### Project Overview

This is an Obsidian plugin called "Obstrlish" that enables users to publish their markdown notes directly from Obsidian 
to the Nostr decentralized social network. The plugin handles long-form content, Kind 30023, publishing, image uploads, 
and bookmark management.

## Architecture

### Core Components

**NostrWriterPlugin (main.ts)**
- Main plugin class that extends Obsidian's Plugin
- Manages plugin lifecycle, settings, UI components (ribbon icons, status bar)
- Handles publish commands and modal interactions
- Coordinates between NostrService and various UI views

**NostrService (src/service/NostrService.ts)**
- Core service handling all Nostr protocol interactions
- Manages relay connections using nostr-tools library
- Handles event creation, signing, and publishing
- Supports multiple user profiles and image upload integration
- Manages bookmark and highlight retrieval from Nostr relays

**ImageUploadService (src/service/ImageUploadService.ts)**
- Handles image upload to Nostr-compatible image hosting services
- Processes inline images in markdown content
- Manages banner image uploads for articles

### UI Components

**Modal Components**
- `ConfirmPublishModal.ts` - Confirmation dialog before publishing
- `ShortFormModal.ts` - Modal for writing short-form notes

**View Components**
- `PublishedView.ts` - Shows previously published notes
- `ReaderView.ts` - Displays user's Nostr bookmarks
- `HighlightsView.ts` - Shows user's Nostr highlights
- `settings.ts` - Plugin settings interface

### Key Features Architecture

**Publishing Flow**
1. User triggers publish via ribbon icon or command
2. ConfirmPublishModal collects metadata (title, summary, tags, profile)
3. NostrService processes markdown content, uploads images, creates Nostr event
4. Event is published to configured relays
5. Published event metadata is saved to `published.json`

**Multi-Profile Support**
- Users can configure multiple Nostr identities
- Each profile has its own private key (nsec format)
- Publishing can be done under any configured profile

**Image Handling**
- Inline images in markdown are automatically detected
- Images are uploaded to configurable blossom servers
- Original image references are replaced with hosted URLs
- Supports banner images for articles

**Relay Management**
- Configurable list of Nostr relays
- Automatic connection management with status tracking
- Connection status shown in status bar
- Graceful handling of relay disconnections
