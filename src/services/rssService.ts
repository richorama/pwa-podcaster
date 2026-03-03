import { XMLParser } from "fast-xml-parser";
import { db, type Episode, type Podcast } from "./db";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

// CORS proxies to try, in order. The first successful one wins.
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function corsFetch(url: string): Promise<Response> {
  const errors: string[] = [];

  // First try direct fetch (works if the server allows CORS, or in contexts
  // where CORS is not enforced, e.g. some browser extensions)
  try {
    const direct = await fetch(url);
    if (direct.ok) return direct;
  } catch {
    // expected — CORS blocked
  }

  // Try each proxy in order
  for (const makeProxy of CORS_PROXIES) {
    try {
      const res = await fetch(makeProxy(url));
      if (res.ok) return res;
      errors.push(`${res.status}`);
    } catch (err: any) {
      errors.push(err.message ?? "network error");
    }
  }

  throw new Error(
    `All CORS proxies failed for ${url}. Errors: ${errors.join(", ")}`
  );
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function parseDuration(raw: string | number | undefined): number {
  if (!raw) return 0;
  if (typeof raw === "number") return raw;
  const parts = raw.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseInt(raw, 10) || 0;
}

export async function fetchAndParseFeed(rssUrl: string): Promise<{
  podcast: Podcast;
  episodes: Episode[];
}> {
  const response = await corsFetch(rssUrl);
  if (!response.ok) throw new Error(`Failed to fetch feed: ${response.status}`);

  const xml = await response.text();
  const result = parser.parse(xml);
  const channel = result?.rss?.channel;
  if (!channel) throw new Error("Invalid RSS feed: no channel found");

  const podcastId = hashString(rssUrl);

  const artwork =
    channel["itunes:image"]?.["@_href"] ||
    channel.image?.url ||
    "";

  const podcast: Podcast = {
    id: podcastId,
    title: channel.title || "Untitled Podcast",
    artwork,
    description: channel.description || "",
    rssUrl,
    lastChecked: Date.now(),
  };

  const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];

  const episodes: Episode[] = items.map((item: any) => {
    const enclosure = item.enclosure || {};
    const guid = item.guid?.["#text"] || item.guid || enclosure["@_url"] || item.title;
    const audioUrl = enclosure["@_url"] || "";

    return {
      id: hashString(String(guid)),
      podcastId,
      title: item.title || "Untitled Episode",
      description:
        item["itunes:summary"] ||
        item.description ||
        "",
      audioUrl,
      pubDate: item.pubDate ? new Date(item.pubDate).getTime() : 0,
      duration: parseDuration(item["itunes:duration"]),
      downloaded: false,
      playbackPosition: 0,
      completed: false,
    };
  });

  return { podcast, episodes };
}

export async function subscribeToPodcast(rssUrl: string) {
  const { podcast, episodes } = await fetchAndParseFeed(rssUrl);

  await db.podcasts.put(podcast);

  const newEpisodeIds: string[] = [];
  for (const episode of episodes) {
    const existing = await db.episodes.get(episode.id);
    if (!existing) {
      await db.episodes.put(episode);
      newEpisodeIds.push(episode.id);
    }
  }

  // Return the top 3 newest new episodes (already sorted newest-first from feed)
  const top3 = episodes
    .filter((e) => newEpisodeIds.includes(e.id))
    .sort((a, b) => b.pubDate - a.pubDate)
    .slice(0, 3)
    .map((e) => e.id);

  return { podcast, newEpisodeIds: top3 };
}

export async function refreshPodcast(podcastId: string) {
  const podcast = await db.podcasts.get(podcastId);
  if (!podcast) throw new Error("Podcast not found");

  const { podcast: updated, episodes } = await fetchAndParseFeed(podcast.rssUrl);

  await db.podcasts.put({ ...updated, id: podcastId });

  const newEpisodeIds: string[] = [];
  for (const episode of episodes) {
    const existing = await db.episodes.get(episode.id);
    if (!existing) {
      await db.episodes.put(episode);
      newEpisodeIds.push(episode.id);
    }
  }

  const top3 = episodes
    .filter((e) => newEpisodeIds.includes(e.id))
    .sort((a, b) => b.pubDate - a.pubDate)
    .slice(0, 3)
    .map((e) => e.id);

  return top3;
}

export async function unsubscribe(podcastId: string) {
  await db.episodes.where("podcastId").equals(podcastId).delete();
  await db.podcasts.delete(podcastId);
}
