import { db } from "./db";

export async function downloadEpisode(
  episodeId: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const episode = await db.episodes.get(episodeId);
  if (!episode) throw new Error("Episode not found");
  if (episode.downloaded && episode.localBlob) return;

  const response = await fetch(episode.audioUrl);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);

  const contentLength = Number(response.headers.get("content-length")) || 0;
  const reader = response.body?.getReader();

  if (!reader) {
    // Fallback: just get the whole blob at once
    const blob = await response.blob();
    await db.episodes.update(episodeId, { downloaded: true, localBlob: blob });
    return;
  }

  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, contentLength);
  }

  const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });

  try {
    await db.episodes.update(episodeId, { downloaded: true, localBlob: blob });
  } catch (err: any) {
    if (err.name === "QuotaExceededError") {
      throw new Error("Storage quota exceeded. Please delete some downloads.");
    }
    throw err;
  }
}

export async function deleteDownload(episodeId: string): Promise<void> {
  await db.episodes.update(episodeId, {
    downloaded: false,
    localBlob: undefined,
  });
}

/**
 * Auto-cleanup: remove downloaded blobs from played episodes,
 * and delete old played episodes entirely.
 * Returns counts for toast reporting.
 */
export async function cleanupEpisodes(
  currentEpisodeId: string | null
): Promise<{ blobsRemoved: number; episodesDeleted: number }> {
  let blobsRemoved = 0;
  let episodesDeleted = 0;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  // Get all completed episodes
  const played = await db.episodes
    .where("completed")
    .equals(1)
    .toArray();

  for (const ep of played) {
    // Never touch the currently-playing episode
    if (ep.id === currentEpisodeId) continue;

    // Delete old played episodes entirely (>30 days since published)
    if (ep.pubDate > 0 && ep.pubDate < thirtyDaysAgo) {
      await db.episodes.delete(ep.id);
      episodesDeleted++;
      continue;
    }

    // Remove blobs from played episodes to free storage
    if (ep.downloaded && ep.localBlob) {
      await db.episodes.update(ep.id, {
        downloaded: false,
        localBlob: undefined,
      });
      blobsRemoved++;
    }
  }

  return { blobsRemoved, episodesDeleted };
}

export async function getAudioUrl(episodeId: string): Promise<string> {
  const episode = await db.episodes.get(episodeId);
  if (!episode) throw new Error("Episode not found");

  if (episode.downloaded && episode.localBlob) {
    return URL.createObjectURL(episode.localBlob);
  }

  return episode.audioUrl;
}
