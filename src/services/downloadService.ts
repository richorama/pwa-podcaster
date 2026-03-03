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

export async function getAudioUrl(episodeId: string): Promise<string> {
  const episode = await db.episodes.get(episodeId);
  if (!episode) throw new Error("Episode not found");

  if (episode.downloaded && episode.localBlob) {
    return URL.createObjectURL(episode.localBlob);
  }

  return episode.audioUrl;
}
