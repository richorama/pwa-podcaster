import { create } from "zustand";
import { db, type Podcast, type Episode } from "../services/db";
export type { Podcast, Episode } from "../services/db";
import { useLiveQuery } from "dexie-react-hooks";
import * as audioService from "../services/audioService";
import { subscribeToPodcast, refreshPodcast, unsubscribe } from "../services/rssService";
import { downloadEpisode, deleteDownload, cleanupEpisodes } from "../services/downloadService";

export interface Toast {
  id: string;
  message: string;
  type: "info" | "error" | "success";
}

interface AppState {
  // Player state
  isPlaying: boolean;
  currentEpisodeId: string | null;
  currentTime: number;
  duration: number;
  playbackRate: number;

  // UI state
  toasts: Toast[];
  downloading: Record<string, number>; // episodeId -> progress (0-100)

  // Actions
  playEpisode: (episodeId: string) => Promise<void>;
  pausePlayback: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  setSpeed: (rate: number) => void;

  subscribe: (rssUrl: string) => Promise<void>;
  refresh: (podcastId: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  unsubscribe: (podcastId: string) => Promise<void>;

  download: (episodeId: string) => Promise<void>;
  removeDownload: (episodeId: string) => Promise<void>;
  cleanup: () => Promise<void>;

  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;

  syncAudioState: () => void;
}

export const useStore = create<AppState>((set, get) => {
  // Subscribe to audio service changes
  audioService.subscribe(() => {
    get().syncAudioState();
  });

  return {
    isPlaying: false,
    currentEpisodeId: null,
    currentTime: 0,
    duration: 0,
    playbackRate: 1.5,
    toasts: [],
    downloading: {},

    syncAudioState: () => {
      const audio = audioService.getAudio();
      set({
        isPlaying: audio ? !audio.paused : false,
        currentEpisodeId: audioService.getCurrentEpisodeId(),
        currentTime: audio?.currentTime || 0,
        duration: audio?.duration || 0,
        playbackRate: audio?.playbackRate || 1.5,
      });
    },

    playEpisode: async (episodeId: string) => {
      try {
        await audioService.play(episodeId);
      } catch (err: any) {
        get().addToast(err.message || "Playback failed", "error");
      }
    },

    pausePlayback: () => audioService.pause(),
    togglePlayPause: () => audioService.togglePlayPause(),
    seek: (time: number) => audioService.seek(time),
    skipForward: () => audioService.skip(30),
    skipBackward: () => audioService.skip(-30),

    setSpeed: (rate: number) => {
      audioService.setSpeed(rate);
      set({ playbackRate: rate });
    },

    subscribe: async (rssUrl: string) => {
      try {
        const { podcast, newEpisodeIds } = await subscribeToPodcast(rssUrl);
        get().addToast(`Subscribed to ${podcast.title}`, "success");
        // Auto-download top 3 newest episodes
        for (const id of newEpisodeIds) {
          get().download(id);
        }
      } catch (err: any) {
        get().addToast(err.message || "Failed to subscribe", "error");
        throw err;
      }
    },

    refresh: async (podcastId: string) => {
      try {
        const newEpisodeIds = await refreshPodcast(podcastId);
        get().addToast("Feed updated", "success");
        // Auto-download top 3 newest new episodes
        for (const id of newEpisodeIds) {
          get().download(id);
        }
      } catch (err: any) {
        get().addToast(err.message || "Failed to refresh", "error");
      }
    },

    refreshAll: async () => {
      try {
        const podcasts = await db.podcasts.toArray();
        if (podcasts.length === 0) return;
        const results = await Promise.allSettled(
          podcasts.map((p) => refreshPodcast(p.id))
        );
        let newCount = 0;
        for (const r of results) {
          if (r.status === "fulfilled") {
            for (const id of r.value) {
              get().download(id);
              newCount++;
            }
          }
        }
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          get().addToast(`Refreshed with ${failed} error(s)`, "error");
        } else if (newCount > 0) {
          get().addToast(`${newCount} new episode(s) found`, "success");
        } else {
          get().addToast("All feeds up to date", "info");
        }
        // Auto-cleanup after refresh
        await get().cleanup();
      } catch (err: any) {
      }
    },

    unsubscribe: async (podcastId: string) => {
      try {
        await unsubscribe(podcastId);
        get().addToast("Unsubscribed", "info");
      } catch (err: any) {
        get().addToast(err.message || "Failed to unsubscribe", "error");
      }
    },

    download: async (episodeId: string) => {
      try {
        set((s) => ({
          downloading: { ...s.downloading, [episodeId]: 0 },
        }));

        await downloadEpisode(episodeId, (loaded, total) => {
          const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
          set((s) => ({
            downloading: { ...s.downloading, [episodeId]: progress },
          }));
        });

        set((s) => {
          const { [episodeId]: _, ...rest } = s.downloading;
          return { downloading: rest };
        });

        get().addToast("Download complete", "success");
      } catch (err: any) {
        set((s) => {
          const { [episodeId]: _, ...rest } = s.downloading;
          return { downloading: rest };
        });
        get().addToast(err.message || "Download failed", "error");
      }
    },

    removeDownload: async (episodeId: string) => {
      try {
        await deleteDownload(episodeId);
        get().addToast("Download removed", "info");
      } catch (err: any) {
        get().addToast(err.message || "Failed to remove download", "error");
      }
    },

    cleanup: async () => {
      try {
        const { blobsRemoved, episodesDeleted } = await cleanupEpisodes(
          get().currentEpisodeId
        );
        const parts: string[] = [];
        if (blobsRemoved > 0) parts.push(`${blobsRemoved} download(s) cleared`);
        if (episodesDeleted > 0) parts.push(`${episodesDeleted} old episode(s) removed`);
        if (parts.length > 0) {
          get().addToast(parts.join(", "), "success");
        }
      } catch (err: any) {
        get().addToast(err.message || "Cleanup failed", "error");
      }
    },

    addToast: (message: string, type: Toast["type"] = "info") => {
      const id = Date.now().toString(36);
      set((s) => ({
        toasts: [...s.toasts, { id, message, type }],
      }));
      setTimeout(() => get().removeToast(id), 4000);
    },

    removeToast: (id: string) => {
      set((s) => ({
        toasts: s.toasts.filter((t) => t.id !== id),
      }));
    },
  };
});

// Dexie live query hooks
export function usePodcasts() {
  return useLiveQuery(() => db.podcasts.toArray(), []) ?? [];
}

export function usePodcast(id: string | undefined) {
  return useLiveQuery(
    () => (id ? db.podcasts.get(id) : undefined),
    [id]
  );
}

export function useEpisodes(podcastId: string | undefined) {
  return (
    useLiveQuery(
      () =>
        podcastId
          ? db.episodes
              .where("podcastId")
              .equals(podcastId)
              .reverse()
              .sortBy("pubDate")
          : [],
      [podcastId]
    ) ?? []
  );
}

export function useAllEpisodes() {
  return (
    useLiveQuery(
      () => db.episodes.orderBy("pubDate").reverse().toArray(),
      []
    ) ?? []
  );
}

export function useEpisode(id: string | undefined) {
  return useLiveQuery(
    () => (id ? db.episodes.get(id) : undefined),
    [id]
  );
}

export function usePodcastMap() {
  const podcasts = usePodcasts();
  const map = new Map<string, Podcast>();
  for (const p of podcasts) map.set(p.id, p);
  return map;
}
