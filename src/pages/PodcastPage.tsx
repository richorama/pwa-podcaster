import { useParams, useNavigate } from "react-router-dom";
import { useStore, usePodcast, useEpisodes } from "../store";
import type { Episode } from "../services/db";

function formatDate(ts: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function EpisodeRow({ episode }: { episode: Episode }) {
  const { playEpisode, download, removeDownload, downloading } = useStore();
  const isDownloading = episode.id in downloading;
  const progress = downloading[episode.id] ?? 0;

  const progressPct =
    !episode.completed && episode.playbackPosition > 0 && episode.duration > 0
      ? Math.min(100, Math.round((episode.playbackPosition / episode.duration) * 100))
      : 0;
  const isNew = !episode.completed && episode.playbackPosition === 0;

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => playEpisode(episode.id)}
            className="text-left w-full"
          >
            <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 hover:text-indigo-400 transition-colors">
              {episode.title}
            </h3>
          </button>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
            <span>{formatDate(episode.pubDate)}</span>
            {episode.duration > 0 && (
              <>
                <span>·</span>
                <span>{formatDuration(episode.duration)}</span>
              </>
            )}
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 mt-2">
            {episode.completed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Played
              </span>
            )}
            {!episode.completed && episode.playbackPosition > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                {progressPct}% played
              </span>
            )}
            {isNew && (
              <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">
                NEW
              </span>
            )}
            {episode.downloaded && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Saved
              </span>
            )}
          </div>

          {/* Progress bar for in-progress episodes */}
          {progressPct > 0 && (
            <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          )}

          {episode.description && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-2">
              {episode.description.replace(/<[^>]*>/g, "")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {/* Play button */}
          <button
            onClick={() => playEpisode(episode.id)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-400 transition-colors"
          >
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          {/* Download button */}
          {isDownloading ? (
            <div className="w-9 h-9 flex items-center justify-center">
              <div className="relative w-7 h-7">
                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="12" fill="none" stroke="#475569" strokeWidth="2" />
                  <circle
                    cx="14" cy="14" r="12" fill="none" stroke="#6366f1" strokeWidth="2"
                    strokeDasharray={`${(progress / 100) * 75.4} 75.4`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-slate-400">
                  {progress}
                </span>
              </div>
            </div>
          ) : episode.downloaded ? (
            <button
              onClick={() => removeDownload(episode.id)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-700 hover:bg-red-600/20 transition-colors group"
              title="Remove download"
            >
              <svg className="w-4 h-4 text-emerald-500 group-hover:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => download(episode.id)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Download"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PodcastPage() {
  const { podcastId } = useParams<{ podcastId: string }>();
  const podcast = usePodcast(podcastId);
  const episodes = useEpisodes(podcastId);
  const { refresh, unsubscribe } = useStore();
  const navigate = useNavigate();

  if (!podcast) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const handleUnsubscribe = async () => {
    if (window.confirm(`Unsubscribe from ${podcast.title}?`)) {
      await unsubscribe(podcast.id);
      navigate("/");
    }
  };

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-100 truncate flex-1">
            {podcast.title}
          </h1>
        </div>
      </header>

      {/* Podcast Info */}
      <div className="px-4 py-4">
        <div className="flex gap-4">
          {podcast.artwork ? (
            <img
              src={podcast.artwork}
              alt={podcast.title}
              className="w-24 h-24 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4-1h8M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3z"
                />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 line-clamp-3">
              {podcast.description?.replace(/<[^>]*>/g, "")}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => refresh(podcast.id)}
                className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={handleUnsubscribe}
                className="text-xs bg-slate-800 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-900/30 transition-colors"
              >
                Unsubscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes */}
      <div className="px-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          {episodes.length} Episode{episodes.length !== 1 ? "s" : ""}
        </h2>
        <div className="flex flex-col gap-3">
          {episodes.map((ep) => (
            <EpisodeRow key={ep.id} episode={ep} />
          ))}
        </div>
      </div>
    </div>
  );
}
