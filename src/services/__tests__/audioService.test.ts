import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db
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
        _store: episodes,
      },
    },
  };
});

import * as audioService from "../audioService";
import { db } from "../db";

const store = (db.episodes as any)._store as Map<string, any>;

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  audioService.stop();
});

describe("audioService", () => {
  describe("subscribe/notify", () => {
    it("subscribe returns unsubscribe function", () => {
      const cb = vi.fn();
      const unsub = audioService.subscribe(cb);
      expect(typeof unsub).toBe("function");
      unsub();
    });
  });

  describe("getAudio", () => {
    it("returns null when nothing is playing", () => {
      expect(audioService.getAudio()).toBeNull();
    });
  });

  describe("getCurrentEpisodeId", () => {
    it("returns null when nothing is playing", () => {
      expect(audioService.getCurrentEpisodeId()).toBeNull();
    });
  });

  describe("play", () => {
    it("throws if episode not found", async () => {
      await expect(audioService.play("nonexistent")).rejects.toThrow(
        "Episode not found"
      );
    });
  });

  describe("pause", () => {
    it("does not throw when nothing is playing", () => {
      expect(() => audioService.pause()).not.toThrow();
    });
  });

  describe("seek", () => {
    it("does nothing when no audio", () => {
      expect(() => audioService.seek(10)).not.toThrow();
    });
  });

  describe("skip", () => {
    it("does nothing when no audio", () => {
      expect(() => audioService.skip(30)).not.toThrow();
    });
  });

  describe("setSpeed", () => {
    it("does nothing when no audio", () => {
      expect(() => audioService.setSpeed(2)).not.toThrow();
    });
  });

  describe("stop", () => {
    it("does not throw when nothing is playing", () => {
      expect(() => audioService.stop()).not.toThrow();
    });

    it("resets state", () => {
      audioService.stop();
      expect(audioService.getAudio()).toBeNull();
      expect(audioService.getCurrentEpisodeId()).toBeNull();
    });
  });
});
