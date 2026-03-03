import { useState } from "react";
import { useStore, useEpisode } from "../store";
import { useNavigate } from "react-router-dom";

const SPEEDS = [1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MiniPlayer() {
  const {
    currentEpisodeId,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    togglePlayPause,
    setSpeed,
  } = useStore();
  const [showSpeed, setShowSpeed] = useState(false);

  const episode = useEpisode(currentEpisodeId ?? undefined);
  const navigate = useNavigate();

  if (!currentEpisodeId || !episode) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-40">
      {/* Progress bar */}
      <div className="h-1 bg-slate-700">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Episode info */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => navigate("/player")}
        >
          <p className="text-sm font-medium text-slate-100 truncate">
            {episode.title}
          </p>
          <p className="text-xs text-slate-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>

        {/* Speed control */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSpeed(!showSpeed);
            }}
            className="px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-300 transition-colors"
          >
            {playbackRate}×
          </button>
          {showSpeed && (
            <div className="absolute bottom-full right-0 mb-2 bg-slate-700 rounded-lg shadow-xl border border-slate-600 overflow-hidden">
              {SPEEDS.map((speed) => (
                <button
                  key={speed}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpeed(speed);
                    setShowSpeed(false);
                  }}
                  className={`block w-full px-4 py-2 text-xs font-semibold text-left transition-colors ${
                    playbackRate === speed
                      ? "bg-indigo-500 text-white"
                      : "text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {speed}×
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Play/Pause */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-400 transition-colors"
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
