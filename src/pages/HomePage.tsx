import { useState } from "react";
import { useStore, usePodcasts } from "../store";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const podcasts = usePodcasts();
  const subscribe = useStore((s) => s.subscribe);
  const refreshAll = useStore((s) => s.refreshAll);
  const [showAdd, setShowAdd] = useState(false);
  const [feedUrl, setFeedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const handleAdd = async () => {
    const url = feedUrl.trim();
    if (!url) return;
    setLoading(true);
    try {
      await subscribe(url);
      setFeedUrl("");
      setShowAdd(false);
    } catch {
      // Toast already shown by store
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-100">Podcaster</h1>
          <div className="flex items-center gap-2">
            {podcasts.length > 0 && (
              <button
                onClick={async () => {
                  setRefreshing(true);
                  try { await refreshAll(); } finally { setRefreshing(false); }
                }}
                disabled={refreshing}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                <svg className={`w-5 h-5 text-slate-300 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-400 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Add Feed Form */}
        {showAdd && (
          <div className="mt-3 flex gap-2">
            <input
              type="url"
              placeholder="Paste RSS feed URL..."
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
              className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? "..." : "Add"}
            </button>
          </div>
        )}
      </header>

      {/* Podcast Grid */}
      {podcasts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4-1h8M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-300 mb-1">No podcasts yet</h2>
          <p className="text-sm text-slate-500">
            Tap the + button to add your first podcast feed
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {podcasts.map((podcast) => (
            <button
              key={podcast.id}
              onClick={() => navigate(`/podcast/${podcast.id}`)}
              className="bg-slate-800 rounded-xl overflow-hidden text-left hover:bg-slate-750 transition-colors group"
            >
              {podcast.artwork ? (
                <img
                  src={podcast.artwork}
                  alt={podcast.title}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-square bg-slate-700 flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4-1h8M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3z"
                    />
                  </svg>
                </div>
              )}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-slate-100 line-clamp-2">
                  {podcast.title}
                </h3>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
