import { Component, useState, useEffect, type ReactNode } from "react";
import { HashRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PodcastPage from "./pages/PodcastPage";
import PlayerPage from "./pages/PlayerPage";
import AllEpisodesPage from "./pages/AllEpisodesPage";
import MiniPlayer from "./components/MiniPlayer";
import Toast from "./components/Toast";
import { useStore } from "./store";
import { db } from "./services/db";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-6 text-center">
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-400 mb-4">{this.state.error.message}</p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-sm font-medium transition-colors"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function BottomNav() {
  const location = useLocation();
  const currentEpisodeId = useStore((s) => s.currentEpisodeId);

  // Hide on full player page
  if (location.pathname === "/player") return null;

  const linkClass = (active: boolean) =>
    `flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors ${
      active ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
    }`;

  return (
    <nav
      className={`fixed left-0 right-0 z-30 bg-slate-900 border-t border-slate-800 flex justify-around py-2 ${
        currentEpisodeId ? "bottom-[60px]" : "bottom-0"
      }`}
    >
      <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
          />
        </svg>
        <span>Podcasts</span>
      </NavLink>
      <NavLink to="/episodes" className={({ isActive }) => linkClass(isActive)}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        <span>Episodes</span>
      </NavLink>
    </nav>
  );
}

function AppShell() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    db.open()
      .then(() => setDbReady(true))
      .catch((err) => setDbError(err.message || "Failed to open database"));
  }, []);

  if (dbError) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Database Error</h1>
        <p className="text-sm text-slate-400 mb-4">{dbError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="h-full flex flex-col bg-slate-900">
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/episodes" element={<AllEpisodesPage />} />
            <Route path="/podcast/:podcastId" element={<PodcastPage />} />
            <Route path="/player" element={<PlayerPage />} />
          </Routes>
        </div>
        <MiniPlayer />
        <BottomNav />
        <Toast />
      </div>
    </HashRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}
