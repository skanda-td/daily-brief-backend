/**
 * Daily Brief – Backend (ESM)
 * Node 18+ / 22 compatible
 */

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

/* =========================
   APP SETUP
========================= */
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* =========================
   FEEDS
========================= */
const FEEDS = {
  india: "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en",
  karnataka:
    "https://news.google.com/rss/search?q=Karnataka+OR+Bengaluru&hl=en-IN&gl=IN&ceid=IN:en",
  world: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
  cricket:
    "https://news.google.com/rss/search?q=Cricket&hl=en-IN&gl=IN&ceid=IN:en",
  football:
    "https://news.google.com/rss/search?q=Football+Soccer&hl=en-IN&gl=IN&ceid=IN:en"
};

/* =========================
   CACHE (daily)
========================= */
let cachedResponse = null;
let lastFetchDate = null;

/* =========================
   HELPERS
========================= */
const todayKey = () => new Date().toISOString().split("T")[0];

const extractSource = link => {
  try {
    return new URL(link).hostname.replace("www.", "");
  } catch {
    return "news.google.com";
  }
};

const extractItems = parsed =>
  (parsed?.rss?.channel?.[0]?.item || [])
    .slice(0, 3)
    .map(item => ({
      title: item.title?.[0] || "",
      link: item.link?.[0] || "",
      source: extractSource(item.link?.[0])
    }));

/* =========================
   FETCH LOGIC
========================= */
async function refreshIfNeeded() {
  const today = todayKey();

  if (cachedResponse && lastFetchDate === today) {
    return cachedResponse;
  }

  const data = {};

  for (const [section, url] of Object.entries(FEEDS)) {
    try {
      const res = await fetch(url, { timeout: 15000 });
      const xml = await res.text();
      const parsed = await parseStringPromise(xml, { trim: true });

      data[section] = extractItems(parsed);
    } catch {
      data[section] = cachedResponse?.data?.[section] || [];
    }

    await new Promise(r => setTimeout(r, 800));
  }

  cachedResponse = {
    lastUpdated: new Date().toISOString(),
    data
  };

  lastFetchDate = today;
  return cachedResponse;
}

/* =========================
   API
========================= */
app.get("/api/news", async (_req, res) => {
  try {
    const result = await refreshIfNeeded();
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to load news" });
  }
});

/* =========================
   HEALTH
========================= */
app.get("/", (_req, res) => {
  res.send("Daily Brief backend running");
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`✅ Daily Brief backend live on port ${PORT}`);
});