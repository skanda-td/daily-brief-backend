# Daily Brief — Backend

> A lightweight Node.js backend that fetches daily news snippets from Google News RSS feeds and exposes a simple JSON API.

**Status:** Minimal, production-ready for small deployments

**Tech:** Node 18+ (ESM), Express, node-fetch, xml2js

## Features

- Aggregates multiple Google News RSS feeds (India, Karnataka, World, Cricket, Football)
- Returns the top 3 items per feed with title, link, and source
- Caches results per-day (one fetch per calendar day)
- Gracefully falls back to previous cached items on fetch errors

## Files

- [backend/server.js](backend/server.js)
- [backend/package.json](backend/package.json)

## API

- `GET /api/news` — returns the cached/updated news payload as JSON
- `GET /` — health endpoint, returns a short text message

Example curl:

```bash
curl http://localhost:3000/api/news
```

Example (trimmed) response:

```json
{
  "lastUpdated": "2025-12-26T12:00:00.000Z",
  "data": {
    "india": [
      { "title": "...", "link": "...", "source": "timesofindia.indiatimes.com" }
    ],
    "world": [ /* ... */ ]
  }
}
```

## Behavior & Notes

- The service keeps an in-memory cache refreshed once per calendar day (UTC date key).
- Each feed returns up to 3 items (most recent), extracted from RSS entries.
- Between individual feed requests the code waits ~800ms to avoid aggressive parallel requests.
- If a feed fetch fails, the server returns the last cached items for that section (if available).

## Requirements

- Node 18 or newer
- Typical dependencies are listed in [backend/package.json](backend/package.json). Install with `npm install`.

## Run locally

Install dependencies:

```bash
npm install
```

Start the server (default port 3000):

```bash
node server.js
# or if package.json defines a start script
npm start
```

Set a custom port (UNIX):

```bash
PORT=4000 node server.js
```

PowerShell (Windows):

```powershell
$env:PORT=4000; node server.js
```

## Production

- For production, run behind a process manager (PM2, systemd) or in a container.
- Consider persistent caching (Redis) if you need cache to survive restarts.

## Feeds

The server fetches these feeds (keys shown):

- `india` — https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en
- `karnataka` — https://news.google.com/rss/search?q=Karnataka+OR+Bengaluru&hl=en-IN&gl=IN&ceid=IN:en
- `world` — https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en
- `cricket` — https://news.google.com/rss/search?q=Cricket&hl=en-IN&gl=IN&ceid=IN:en
- `football` — https://news.google.com/rss/search?q=Football+Soccer&hl=en-IN&gl=IN&ceid=IN:en

## Contributing

- Fix bugs or add improvements by opening issues or PRs.
- Keep changes minimal and focused.

## License

MIT — see repository for license details.
