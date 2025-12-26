import express from "express";
import Parser from "rss-parser";
import cron from "node-cron";
import cors from "cors";

const app = express();
const parser = new Parser();
app.use(cors());

const PORT = process.env.PORT || 3000;

/* =========================
   RSS FEEDS
========================= */
const feeds = {
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
   CACHE (IN MEMORY)
========================= */
let cache = {
  lastUpdated: null,
  data: {}
};

/* =========================
   FETCH + CACHE
========================= */
async function refreshNews() {
  console.log("🔄 Daily refresh started");

  const result = {};

  for (const [section, url] of Object.entries(feeds)) {
    try {
      const feed = await parser.parseURL(url);

      result[section] = feed.items.slice(0, 3).map(item => ({
        title: item.title,
        link: item.link,
        source: extractSource(item.link)
      }));

    } catch (e) {
      console.error(`❌ Failed ${section}`);
      result[section] = cache.data[section] || [];
    }
  }

  cache.data = result;
  cache.lastUpdated = new Date();

  console.log("✅ News cached");
}

/* =========================
   DAILY CRON (6 AM IST)
========================= */
cron.schedule("0 6 * * *", refreshNews, {
  timezone: "Asia/Kolkata"
});

/* =========================
   API
========================= */
app.get("/api/news", (req, res) => {
  res.json(cache);
});

/* =========================
   START
========================= */
app.listen(PORT, async () => {
  console.log(`🚀 Backend running on ${PORT}`);
  await refreshNews(); // first load
});

/* =========================
   HELPERS
========================= */
function extractSource(link) {
  try {
    return new URL(link).hostname.replace("www.", "");
  } catch {
    return "Google News";
  }
}