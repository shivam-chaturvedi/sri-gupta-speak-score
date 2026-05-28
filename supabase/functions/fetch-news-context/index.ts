import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { XMLParser } from "npm:fast-xml-parser@4.4.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

type TopicId =
  | "geopolitics"
  | "economics"
  | "business"
  | "international"
  | "technology"
  | "policy"
  | "debate"
  | "current";

type Article = {
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO
  snippet?: string;
  matchedTopics: TopicId[];
};

const topicKeywords: Record<TopicId, string[]> = {
  geopolitics: [
    "geopolitic",
    "war",
    "conflict",
    "sanction",
    "nato",
    "israel",
    "gaza",
    "ukraine",
    "russia",
    "china",
    "taiwan",
    "iran",
    "diplomac",
    "military",
  ],
  economics: [
    "econom",
    "inflation",
    "gdp",
    "growth",
    "recession",
    "interest rate",
    "fed",
    "central bank",
    "imf",
    "world bank",
    "employment",
    "jobs",
    "unemployment",
  ],
  business: [
    "business",
    "company",
    "earnings",
    "ipo",
    "startup",
    "m&a",
    "acquisition",
    "merger",
    "antitrust",
    "market",
    "stock",
    "ceo",
  ],
  international: [
    "united nations",
    "un ",
    "treaty",
    "summit",
    "alliance",
    "foreign minister",
    "state visit",
    "bilateral",
    "multilateral",
    "embassy",
  ],
  technology: [
    "ai",
    "artificial intelligence",
    "chip",
    "semiconductor",
    "software",
    "cyber",
    "security",
    "privacy",
    "data",
    "robot",
    "startup",
    "openai",
    "google",
    "apple",
    "microsoft",
  ],
  policy: [
    "policy",
    "bill",
    "law",
    "regulation",
    "court",
    "supreme court",
    "parliament",
    "congress",
    "election",
    "budget",
    "tax",
    "ministry",
  ],
  debate: [
    "opinion",
    "editorial",
    "analysis",
    "column",
    "debate",
    "why",
    "should",
    "must",
    "could",
  ],
  current: [
    "breaking",
    "today",
    "live",
    "update",
    "developing",
    "accident",
    "crash",
    "protest",
    "weather",
  ],
};

const sources: Array<{ source: string; feeds: string[] }> = [
  { source: "The Hindu", feeds: ["https://www.thehindu.com/feeder/default.rss"] },
  {
    source: "NYT",
    feeds: [
      "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
      "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
      "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
      "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    ],
  },
  {
    source: "BBC",
    feeds: [
      "https://feeds.bbci.co.uk/news/rss.xml",
      "https://feeds.bbci.co.uk/news/world/rss.xml",
      "https://feeds.bbci.co.uk/news/business/rss.xml",
      "https://feeds.bbci.co.uk/news/technology/rss.xml",
    ],
  },
  {
    source: "The Guardian",
    feeds: [
      "https://www.theguardian.com/international/rss",
      "https://www.theguardian.com/world/rss",
      "https://www.theguardian.com/technology/rss",
      "https://www.theguardian.com/business/rss",
    ],
  },
  { source: "Al Jazeera", feeds: ["https://www.aljazeera.com/xml/rss/all.xml"] },
  {
    source: "Mint",
    feeds: [
      "https://www.livemint.com/rss/news",
      "https://www.livemint.com/rss/companies",
      "https://www.livemint.com/rss/technology",
    ],
  },
  { source: "Financial Times", feeds: ["https://www.ft.com/?format=rss"] },
  {
    source: "Economic Times",
    feeds: [
      "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
      "https://economictimes.indiatimes.com/rssfeeds/13352306.cms",
      "https://economictimes.indiatimes.com/rssfeeds/78570530.cms",
    ],
  },
  { source: "Mid-Day", feeds: ["https://www.mid-day.com/rss"] },
  { source: "Vogue", feeds: ["https://www.vogue.com/rss"] },
  { source: "Conde Nast", feeds: ["https://www.condenast.com/rss"] },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toText(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    // fast-xml-parser may produce objects like { "#text": "..." }
    const anyV = v as Record<string, unknown>;
    if (typeof anyV["#text"] === "string") return anyV["#text"];
    if (typeof anyV["text"] === "string") return anyV["text"];
  }
  return "";
}

function sanitizeSnippet(htmlish: string): string {
  return String(htmlish)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);
}

function guessTopics(title: string, snippet: string): TopicId[] {
  const hay = `${title}\n${snippet}`.toLowerCase();
  const matched: TopicId[] = [];
  (Object.keys(topicKeywords) as TopicId[]).forEach((topic) => {
    for (const kw of topicKeywords[topic]) {
      if (hay.includes(kw)) {
        matched.push(topic);
        break;
      }
    }
  });
  return matched;
}

function parseRss(xmlText: string): Array<{
  title: string;
  url: string;
  publishedAt: string | null;
  snippet: string;
}> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // Some feeds have invalid entities; tolerate them.
    processEntities: true,
  });

  const doc: any = parser.parse(xmlText);
  const items: any[] =
    doc?.rss?.channel?.item
      ? Array.isArray(doc.rss.channel.item)
        ? doc.rss.channel.item
        : [doc.rss.channel.item]
      : doc?.feed?.entry
        ? Array.isArray(doc.feed.entry)
          ? doc.feed.entry
          : [doc.feed.entry]
        : [];

  const out: Array<{ title: string; url: string; publishedAt: string | null; snippet: string }> = [];

  for (const item of items) {
    const title = toText(item?.title)?.trim();
    if (!title) continue;

    let url = "";
    if (item?.link) {
      if (typeof item.link === "string") url = item.link;
      else if (Array.isArray(item.link)) {
        // Atom: [{ "@_href": "...", "@_rel": "alternate" }, ...]
        const alt = item.link.find((l: any) => l?.["@_rel"] === "alternate") ?? item.link[0];
        url = String(alt?.["@_href"] ?? alt?.["@_url"] ?? alt?.href ?? alt ?? "");
      } else if (typeof item.link === "object") {
        url = String((item.link as any)?.["@_href"] ?? (item.link as any)?.href ?? toText(item.link));
      }
    }
    if (!url) url = toText(item?.guid)?.trim();
    if (!url) continue;

    const dateRaw =
      toText(item?.pubDate) ||
      toText(item?.published) ||
      toText(item?.updated) ||
      toText(item?.["dc:date"]);
    const t = dateRaw ? Date.parse(dateRaw) : NaN;
    const publishedAt = Number.isFinite(t) ? new Date(t).toISOString() : null;

    const snippet =
      sanitizeSnippet(
        toText(item?.description) ||
          toText(item?.summary) ||
          toText(item?.content) ||
          "",
      );

    out.push({ title, url, publishedAt, snippet });
  }

  return out;
}

async function fetchFeed(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "DialectaDailyNewsletterBot/1.0 (+https://example.invalid; admin-newsletter-context)",
      "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
  });
  if (!res.ok) {
    throw new Error(`Feed fetch failed: ${url} (${res.status})`);
  }
  return await res.text();
}

console.log('Function "fetch-news-context" up and running!');

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      topics?: unknown;
      days?: unknown;
      perTopicLimit?: unknown;
    };

    const topics = (Array.isArray(body.topics) ? body.topics : [])
      .map((t) => String(t))
      .filter(Boolean) as TopicId[];

    if (topics.length === 0) {
      return jsonResponse(
        { success: false, error: "At least one topic is required" },
        400,
      );
    }

    const days = Math.min(14, Math.max(1, Number(body.days ?? 7) || 7));
    const perTopicLimit = Math.min(12, Math.max(2, Number(body.perTopicLimit ?? 6) || 6));

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const all: Article[] = [];
    const seen = new Set<string>();

    for (const s of sources) {
      for (const feedUrl of s.feeds) {
        let xmlText = "";
        try {
          xmlText = await fetchFeed(feedUrl);
        } catch (e) {
          console.warn("Feed fetch failed:", s.source, feedUrl, e);
          continue;
        }

        let items: ReturnType<typeof parseRss> = [];
        try {
          items = parseRss(xmlText);
        } catch (e) {
          console.warn("Feed parse failed:", s.source, feedUrl, e);
          continue;
        }

        for (const item of items) {
          const url = item.url.trim();
          if (!url || seen.has(url)) continue;

          const publishedAt = item.publishedAt ?? new Date().toISOString();
          const t = Date.parse(publishedAt);
          if (Number.isFinite(t) && t < cutoff) continue;

          const matchedTopics = guessTopics(item.title, item.snippet);
          if (!matchedTopics.some((t) => topics.includes(t))) continue;

          seen.add(url);
          all.push({
            title: item.title,
            url,
            source: s.source,
            publishedAt,
            snippet: item.snippet || undefined,
            matchedTopics,
          });
        }
      }
    }

    all.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

    const byTopic: Record<TopicId, Article[]> = {
      geopolitics: [],
      economics: [],
      business: [],
      international: [],
      technology: [],
      policy: [],
      debate: [],
      current: [],
    };

    for (const a of all) {
      for (const t of a.matchedTopics) {
        if (!topics.includes(t)) continue;
        if (byTopic[t].length >= perTopicLimit) continue;
        byTopic[t].push(a);
      }
    }

    return jsonResponse({
      success: true,
      days,
      perTopicLimit,
      topics,
      total: all.length,
      byTopic,
      all: all.slice(0, Math.min(all.length, topics.length * perTopicLimit * 2)),
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ success: false, error: message }, 500);
  }
});

