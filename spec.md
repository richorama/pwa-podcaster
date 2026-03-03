# 📱 Podcast PWA – Technical Specification

## 1️⃣ Overview

Build a **Progressive Web App** for Android that:

* Subscribes to podcast RSS feeds
* Downloads episodes for offline playback
* Plays audio at variable speeds (default 1.5×)
* Remembers playback position
* Tracks played/unplayed status
* Works offline

Target platform: Android (Chrome installable PWA)

---

# 2️⃣ Core Requirements

## Functional Requirements

### Subscriptions

* User can:

  * Add RSS feed URL manually
  * View podcast metadata (title, artwork, description)
  * Delete subscription
* App polls feeds for new episodes
* New episodes are added to local database

---

### Episodes

* Display:

  * Title
  * Artwork
  * Duration
  * Publication date
  * Description
  * Download status
* Episode states:

  * Not downloaded
  * Downloaded
  * Played
  * In progress

---

### Audio Playback

* HTML5 audio player
* Features:

  * Play / Pause
  * Seek
  * Skip ±30 seconds
  * Playback speed selector (1x, 1.25x, 1.5x, 2x)
  * Resume from last position
* Default playback speed = 1.5x
* Use Media Session API for:

  * Lock screen controls
  * Background playback

---

### Downloads

* User can download episode for offline use
* Audio file stored in IndexedDB as Blob
* Show download progress
* Allow delete downloaded file
* Handle storage quota errors gracefully

---

### Playback Persistence

Store:

* Episode ID
* Playback position (seconds)
* Completed flag
* Last played timestamp

Auto-resume if:

* Playback > 30 seconds
* Not completed

Mark completed when:

* 95%+ played

---

# 3️⃣ Non-Functional Requirements

* Installable PWA
* Offline-first design
* Fast initial load (<2 seconds on 4G)
* Responsive mobile layout
* No backend required (initial version)

---

# 4️⃣ Technical Architecture

## Frontend

* Framework: React (Vite)
* State: Zustand or Redux Toolkit
* Routing: React Router
* Styling: Tailwind CSS

---

## Storage

### IndexedDB (via Dexie.js)

### Schema

```ts
podcasts: {
  id: string (rss URL hash)
  title: string
  artwork: string
  description: string
  rssUrl: string
  lastChecked: number
}

episodes: {
  id: string (guid or enclosure URL)
  podcastId: string
  title: string
  description: string
  audioUrl: string
  pubDate: number
  duration: number
  downloaded: boolean
  localBlob?: Blob
  playbackPosition: number
  completed: boolean
  lastPlayed?: number
}
```

Indexes:

* podcastId
* pubDate
* completed
* downloaded

---

## Service Worker

Responsibilities:

* Cache static assets
* Enable offline app shell
* Optional: Background sync for feed updates
* Manage fetch interception for downloaded media

Cache strategy:

* App shell → Cache First
* RSS feeds → Network First
* Media → IndexedDB lookup first

---

# 5️⃣ RSS Handling

* Fetch RSS XML
* Parse via fast-xml-parser
* Extract:

  * channel title
  * artwork (itunes:image)
  * item guid
  * enclosure URL
  * duration
  * pubDate
  * description
* Deduplicate by GUID or enclosure URL

---

# 6️⃣ UI Screens

## Home

* List of subscriptions
* Add subscription button

## Podcast Detail

* Episode list
* Download buttons
* Sort by newest

## Player

* Persistent mini-player
* Full-screen player view
* Speed selector
* Progress bar
* Skip controls

---

# 7️⃣ Media Session API

Implement:

```js
navigator.mediaSession.metadata = new MediaMetadata({
  title,
  artist,
  artwork
});
```

Handle:

* play
* pause
* seekbackward
* seekforward

---

# 8️⃣ PWA Requirements

* manifest.json
* Service worker registered
* Icons (192px, 512px)
* Display: standalone
* Background playback supported

---

# 9️⃣ Error Handling

Handle:

* RSS fetch failure
* Invalid XML
* Audio download failure
* Storage quota exceeded
* Playback failure

Show user-friendly toast notifications.

---

# 🔟 Future Enhancements (Not MVP)

* OPML import/export
* Cloud sync (Azure Functions + Cosmos DB)
* Push notifications for new episodes
* Playlist / queue
* Smart episode trimming
* Silence skipping
* Auto-delete played episodes

---

# 11️⃣ Project Structure

```
/src
  /components
  /pages
  /hooks
  /services
    rssService.ts
    downloadService.ts
    db.ts
    audioService.ts
  /store
  /pwa
```

---

# 12️⃣ Acceptance Criteria

* App installs on Android
* Offline playback works
* Playback resumes correctly
* Speed control works
* Subscriptions persist after reload
* Downloads survive browser restart

---

Hosted in GitHub pages.

No Azure components to begin with

Simple and modern aesthetic 