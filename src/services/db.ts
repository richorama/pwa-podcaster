import Dexie, { type Table } from "dexie";

export interface Podcast {
  id: string;
  title: string;
  artwork: string;
  description: string;
  rssUrl: string;
  lastChecked: number;
}

export interface Episode {
  id: string;
  podcastId: string;
  title: string;
  description: string;
  audioUrl: string;
  pubDate: number;
  duration: number;
  downloaded: boolean;
  localBlob?: Blob;
  playbackPosition: number;
  completed: boolean;
  lastPlayed?: number;
}

class PodcasterDB extends Dexie {
  podcasts!: Table<Podcast, string>;
  episodes!: Table<Episode, string>;

  constructor() {
    super("podcasterDB");
    this.version(1).stores({
      podcasts: "id, rssUrl, lastChecked",
      episodes: "id, podcastId, pubDate, completed, downloaded",
    });
  }
}

export const db = new PodcasterDB();
