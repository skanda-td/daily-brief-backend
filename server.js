/**
 * Daily Brief – Backend
 * - Fetches Google News RSS
 * - Converts to clean JSON
 * - Caches once per day
 * - Enables CORS for frontend
 */

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const xml2js = require("xml2js");

const app = express();
app.use(cors()); // ✅ REQUIRED for frontend
app.use(express.json());

/* =========================
   CONFIG
========================= */
const PORT = process.env.PORT || 3000;

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
   IN-MEMORY CACHE
========================= */
let cachedData = null;
let lastUpdatedDate = null;

/* =========================
   HELPERS
========================= */
function todayKey() {
  return new Date().toISOString().split("T")[0];
}

async function fetchRSS(url) {
  const res = await fetch(url, { timeout: 15000 });
  const xml = await res.text();
  return xml2js.parseStringPromise(xml, { trim: true });
}

function extractItems(parsed) {
  const items = parsed.rss.channel[0].item || [];
  return items.slice(0, 3).map(item => ({
    title: item.title?.[0] || "",
    link: item.link?.[0] || "",
    source: extractSource(item.link?.[0])
  }));
}

function extractSource(link) {
  try {
    const url = new URL(link);
    return url.hostname.replace("www.", "");
  } catch {
    return "news.google.com";
  }
}

/* =========================
   CORE FETCH LOGIC
========================= */
async function refreshNewsIfNeeded() {
  const today = todayKey();

  if (cachedData && lastUpdatedDate === today) {
    return cachedData; // ✅ use cache
  }

  const data = {};

  for (const [section, url] of Object.entries(FEEDS)) {
    try {
      const parsed = await fetchRSS(url);
      data[section] = extractItems(parsed);
    } catch (err) {
      data[section] = cachedData?.data?.[section] || [];
    }

    // small delay to avoid Google throttling
    await new Promise(r => setTimeout(r, 800));
  }

  cachedData = {
    lastUpdated: new Date().toISOString(),
    data
  };

  lastUpdatedDate = today;
  return cachedData;
}

/* =========================
   API ENDPOINT
========================= */
app.get("/api/news", async (req, res) => {
  try {
    const result = await refreshNewsIfNeeded();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to load news" });
  }
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (_, res) => {
  res.send("Daily Brief backend is running");
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`Daily Brief backend running on port ${PORT}`);
});