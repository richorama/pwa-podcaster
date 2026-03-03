import { db, type Episode } from "./db";

let audio: HTMLAudioElement | null = null;
let currentEpisodeId: string | null = null;
let saveInterval: ReturnType<typeof setInterval> | null = null;
let objectUrl: string | null = null;

type PlayerCallback = () => void;
const listeners = new Set<PlayerCallback>();

export function subscribe(cb: PlayerCallback) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  listeners.forEach((cb) => cb());
}

export function getAudio(): HTMLAudioElement | null {
  return audio;
}

export function getCurrentEpisodeId(): string | null {
  return currentEpisodeId;
}

export async function play(episodeId: string) {
  const episode = await db.episodes.get(episodeId);
  if (!episode) throw new Error("Episode not found");

  // If same episode, just resume
  if (currentEpisodeId === episodeId && audio) {
    await audio.play();
    notify();
    return;
  }

  // Cleanup previous
  stop();

  // Create audio source
  let src: string;
  if (episode.downloaded && episode.localBlob) {
    objectUrl = URL.createObjectURL(episode.localBlob);
    src = objectUrl;
  } else {
    src = episode.audioUrl;
  }

  audio = new Audio(src);
  audio.playbackRate = 1.5; // Default speed
  currentEpisodeId = episodeId;

  // Resume position
  if (episode.playbackPosition > 30 && !episode.completed) {
    audio.currentTime = episode.playbackPosition;
  }

  audio.addEventListener("timeupdate", handleTimeUpdate);
  audio.addEventListener("ended", handleEnded);
  audio.addEventListener("play", notify);
  audio.addEventListener("pause", notify);
  audio.addEventListener("loadedmetadata", notify);

  await audio.play();

  // Save position every 5 seconds
  saveInterval = setInterval(() => savePosition(), 5000);

  // Set Media Session
  updateMediaSession(episode);
  notify();
}

export function pause() {
  audio?.pause();
  savePosition();
  notify();
}

export function togglePlayPause() {
  if (!audio) return;
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
  notify();
}

export function seek(time: number) {
  if (!audio) return;
  audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
  notify();
}

export function skip(seconds: number) {
  if (!audio) return;
  audio.currentTime = Math.max(
    0,
    Math.min(audio.currentTime + seconds, audio.duration || 0)
  );
  notify();
}

export function setSpeed(rate: number) {
  if (!audio) return;
  audio.playbackRate = rate;
  notify();
}

export function stop() {
  if (saveInterval) clearInterval(saveInterval);
  savePosition();

  if (audio) {
    audio.pause();
    audio.removeEventListener("timeupdate", handleTimeUpdate);
    audio.removeEventListener("ended", handleEnded);
    audio.removeEventListener("play", notify);
    audio.removeEventListener("pause", notify);
    audio.removeEventListener("loadedmetadata", notify);
    audio.src = "";
    audio = null;
  }

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }

  currentEpisodeId = null;
  notify();
}

function handleTimeUpdate() {
  // Notify UI for progress updates
  notify();
}

async function handleEnded() {
  if (!currentEpisodeId) return;
  await db.episodes.update(currentEpisodeId, {
    completed: true,
    playbackPosition: 0,
    lastPlayed: Date.now(),
  });
  notify();
}

async function savePosition() {
  if (!audio || !currentEpisodeId) return;
  const position = audio.currentTime;
  const duration = audio.duration || 0;
  const completed = duration > 0 && position / duration >= 0.95;

  await db.episodes.update(currentEpisodeId, {
    playbackPosition: position,
    completed,
    lastPlayed: Date.now(),
  });
}

function updateMediaSession(episode: Episode) {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: episode.title,
    artist: "Podcast",
    artwork: [],
  });

  navigator.mediaSession.setActionHandler("play", () => {
    audio?.play();
    notify();
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    audio?.pause();
    notify();
  });

  navigator.mediaSession.setActionHandler("seekbackward", () => {
    skip(-30);
  });

  navigator.mediaSession.setActionHandler("seekforward", () => {
    skip(30);
  });
}
