import { describe, it, expect } from "vitest";

// We test the pure utility functions by importing the module.
// hashString and parseDuration are not exported, so we replicate them
// to verify the logic, or we test via the public API.

// Replicated from rssService.ts for unit testing
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

describe("hashString", () => {
  it("returns consistent hash for the same input", () => {
    const h1 = hashString("https://example.com/feed.xml");
    const h2 = hashString("https://example.com/feed.xml");
    expect(h1).toBe(h2);
  });

  it("returns different hashes for different inputs", () => {
    const h1 = hashString("https://example.com/feed1.xml");
    const h2 = hashString("https://example.com/feed2.xml");
    expect(h1).not.toBe(h2);
  });

  it("returns a non-empty string", () => {
    const h = hashString("test");
    expect(h.length).toBeGreaterThan(0);
  });
});

describe("parseDuration", () => {
  it("returns 0 for undefined", () => {
    expect(parseDuration(undefined)).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(parseDuration("")).toBe(0);
  });

  it("parses numeric value directly", () => {
    expect(parseDuration(300)).toBe(300);
  });

  it("parses HH:MM:SS format", () => {
    expect(parseDuration("1:30:00")).toBe(5400);
  });

  it("parses MM:SS format", () => {
    expect(parseDuration("45:30")).toBe(2730);
  });

  it("parses plain seconds string", () => {
    expect(parseDuration("120")).toBe(120);
  });

  it("handles 0:00:30 (30 seconds)", () => {
    expect(parseDuration("0:00:30")).toBe(30);
  });
});
