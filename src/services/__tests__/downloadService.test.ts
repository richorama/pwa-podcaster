import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("../db", () => {
  const episodes = new Map<string, any>();
  return {
    db: {
      episodes: {
        get: vi.fn((id: string) => Promise.resolve(episodes.get(id))),
        update: vi.fn((id: string, changes: any) => {
          const existing = episodes.get(id);
          if (existing) episodes.set(id, { ...existing, ...changes });
          return Promise.resolve(1);
        }),
        // Expose for test setup
        _store: episodes,
      },
    },
  };
});

import { deleteDownload, getAudioUrl } from "../downloadService";
import { db } from "../db";

const store = (db.episodes as any)._store as Map<string, any>;

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
});

describe("deleteDownload", () => {
  it("marks episode as not downloaded", async () => {
    store.set("ep1", {
      id: "ep1",
      downloaded: true,
      localBlob: new Blob(["audio"]),
      audioUrl: "https://example.com/ep1.mp3",
    });

    await deleteDownload("ep1");

    expect(db.episodes.update).toHaveBeenCalledWith("ep1", {
      downloaded: false,
      localBlob: undefined,
    });
  });
});

describe("getAudioUrl", () => {
  it("throws if episode not found", async () => {
    await expect(getAudioUrl("nonexistent")).rejects.toThrow("Episode not found");
  });

  it("returns remote URL when not downloaded", async () => {
    store.set("ep1", {
      id: "ep1",
      downloaded: false,
      audioUrl: "https://example.com/ep1.mp3",
    });

    const url = await getAudioUrl("ep1");
    expect(url).toBe("https://example.com/ep1.mp3");
  });

  it("returns object URL when downloaded", async () => {
    const blob = new Blob(["audio"], { type: "audio/mpeg" });
    store.set("ep1", {
      id: "ep1",
      downloaded: true,
      localBlob: blob,
      audioUrl: "https://example.com/ep1.mp3",
    });

    const url = await getAudioUrl("ep1");
    expect(url).toMatch(/^blob:/);
  });
});
