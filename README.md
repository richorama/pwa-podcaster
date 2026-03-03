# Podcaster

An offline-first Progressive Web App for subscribing to and listening to podcasts.

**Live:** https://richorama.github.io/pwa-podcaster/

## Features

- **Subscribe** to podcasts via RSS feed URL
- **Download** episodes for offline playback (stored in IndexedDB)
- **Variable speed** playback — 1×, 1.25×, 1.5× (default), 2×
- **Resume** from last position automatically
- **Track** played/unplayed/in-progress status
- **All Episodes** view aggregated across all feeds
- **Auto-download** the 3 newest episodes on subscribe/refresh
- **Lock screen controls** via Media Session API
- **Installable** as a standalone app on Android (Chrome)
- **Works offline** — cached app shell + downloaded audio

## Tech Stack

- **Framework:** React + TypeScript (Vite)
- **Styling:** Tailwind CSS v4
- **State:** Zustand
- **Storage:** IndexedDB via Dexie.js
- **RSS Parsing:** fast-xml-parser
- **PWA:** vite-plugin-pwa (Workbox)
- **Routing:** React Router (HashRouter for GH Pages)
- **Testing:** Vitest + Testing Library
- **CI/CD:** GitHub Actions → GitHub Pages

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
  components/     # MiniPlayer, Toast
  pages/          # HomePage, PodcastPage, PlayerPage, AllEpisodesPage
  services/       # db, rssService, downloadService, audioService
  store/          # Zustand store + Dexie live query hooks
public/
  icons/          # PWA icons
  favicon.svg
```

## Deployment

Pushes to `master`/`main` automatically run tests and deploy to GitHub Pages via the workflow in `.github/workflows/ci.yml`.

To deploy manually:

```bash
npm run build
# Upload contents of dist/ to any static host
```

The base path defaults to `/pwa-podcaster/`. Override with the `BASE_URL` environment variable if hosting elsewhere.

## License

MIT — see [LICENSE](LICENSE).
