import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock the store before importing the component
vi.mock("../store", () => ({
  useStore: Object.assign(
    (selector?: any) => {
      const state = {
        currentEpisodeId: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        playbackRate: 1.5,
        toasts: [],
        downloading: {},
        togglePlayPause: vi.fn(),
        setSpeed: vi.fn(),
        subscribe: vi.fn(),
        playEpisode: vi.fn(),
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        currentEpisodeId: null,
        isPlaying: false,
      }),
    }
  ),
  usePodcasts: () => [],
  useEpisode: () => undefined,
  useAllEpisodes: () => [],
  usePodcastMap: () => new Map(),
}));

import HomePage from "../pages/HomePage";
import Toast from "../components/Toast";

describe("HomePage", () => {
  it("renders the title", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByText("Podcaster")).toBeInTheDocument();
  });

  it("shows empty state when no podcasts", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByText("No podcasts yet")).toBeInTheDocument();
  });

  it("has an add button", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    // The + SVG button
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe("Toast", () => {
  it("renders nothing when no toasts", () => {
    const { container } = render(<Toast />);
    expect(container.firstChild).toBeNull();
  });
});
