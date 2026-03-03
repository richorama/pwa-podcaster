import { useNavigate } from "react-router-dom";
import { useStore, useEpisode } from "../store";
import { useMemo } from "react";

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SPEEDS = [1, 1.25, 1.5, 2];

export default function PlayerPage() {
  const navigate = useNavigate();
  const {
    currentEpisodeId,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    togglePlayPause,
    seek,
    skipForward,
    skipBackward,
    setSpeed,
  } = useStore();

  const episode = useEpisode(currentEpisodeId ?? undefined);

  const progress = useMemo(
    () => (duration > 0 ? (currentTime / duration) * 100 : 0),
    [currentTime, duration]
  );

  if (!currentEpisodeId || !episode) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <p className="text-slate-500 text-lg">No episode playing</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-indigo-400 text-sm hover:text-indigo-300"
        >
          Go back to podcasts
        </button>
      </div>
    );
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  };

  return (
    <div className="flex flex-col h-full pb-safe">
      {/* Header */}
      <header className="flex items-center px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <span className="flex-1 text-center text-xs text-slate-500 uppercase tracking-wide font-semibold">
          Now Playing
        </span>
        <div className="w-9" />
      </header>

      {/* Artwork */}
      <div className="flex-1 flex items-center justify-center px-8 py-4">
        <div className="w-full max-w-xs aspect-square rounded-2xl bg-slate-800 overflow-hidden shadow-2xl">
          {episode.description ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/50 to-slate-800">
              <svg className="w-24 h-24 text-indigo-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4-1h8M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3z"
                />
              </svg>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/50 to-slate-800">
              <svg className="w-24 h-24 text-indigo-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4-1h8M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3z"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Info & Controls */}
      <div className="px-6 pb-8">
        {/* Title */}
        <h2 className="text-lg font-bold text-slate-100 text-center line-clamp-2 mb-1">
          {episode.title}
        </h2>

        {/* Progress Bar */}
        <div className="mt-6">
          <div
            className="h-2 bg-slate-700 rounded-full cursor-pointer relative"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-indigo-500 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md transform translate-x-1/2" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8 mt-6">
          {/* Skip Back */}
          <button
            onClick={skipBackward}
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <div className="relative">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                />
              </svg>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold">30</span>
            </div>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-400 transition-colors shadow-lg"
          >
            {isPlaying ? (
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Skip Forward */}
          <button
            onClick={skipForward}
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <div className="relative">
              <svg className="w-8 h-8 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                />
              </svg>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold">30</span>
            </div>
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => setSpeed(speed)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                playbackRate === speed
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
