import { useStore, useAllEpisodes, usePodcastMap } from "../store";
import type { Episode } from "../store";

function formatDate(ts: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function EpisodeRow({
  episode,
  podcastTitle,
}: {
  episode: Episode;
  podcastTitle: string;
}) {
  const { playEpisode, download, removeDownload, downloading } = useStore();
  const isDownloading = episode.id in downloading;
  const progress = downloading[episode.id] ?? 0;

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

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="text-indigo-400 truncate max-w-[140px]">
              {podcastTitle}
            </span>
            <span>·</span>
            <span>{formatDate(episode.pubDate)}</span>
            {episode.duration > 0 && (
              <>
                <span>·</span>
                <span>{formatDuration(episode.duration)}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            {episode.completed && (
              <span className="text-emerald-500">Played</span>
            )}
            {!episode.completed && episode.playbackPosition > 0 && (
              <span className="text-indigo-400">In progress</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {/* Play button */}
          <button
            onClick={() => playEpisode(episode.id)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-400 transition-colors"
          >
            <svg
              className="w-4 h-4 text-white ml-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          {/* Download button */}
          {isDownloading ? (
            <div className="w-9 h-9 flex items-center justify-center">
              <div className="relative w-7 h-7">
                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                  <circle
                    cx="14"
                    cy="14"
                    r="12"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                  <circle
                    cx="14"
                    cy="14"
                    r="12"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
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
              <svg
                className="w-4 h-4 text-emerald-500 group-hover:text-red-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => download(episode.id)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Download"
            >
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
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

export default function AllEpisodesPage() {
  const episodes = useAllEpisodes();
  const podcastMap = usePodcastMap();

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-4 py-4">
        <h1 className="text-xl font-bold text-slate-100">All Episodes</h1>
      </header>

      {episodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <p className="text-sm text-slate-500">
            No episodes yet. Subscribe to a podcast first.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {episodes.map((ep) => (
            <EpisodeRow
              key={ep.id}
              episode={ep}
              podcastTitle={podcastMap.get(ep.podcastId)?.title ?? "Unknown"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
