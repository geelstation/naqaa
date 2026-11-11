import { create } from 'zustand';
import type { TapeWithDetails, Track } from '../types';
import { api } from '../services/api';
import { getYouTubeVideoId } from '../utils/youtube';
import { youtubeControls } from '../utils/youtubePlayer';

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  // Current playback
  currentTape: TapeWithDetails | null;
  currentTrackIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;

  // Settings
  repeatMode: RepeatMode;
  shuffle: boolean;
  showFullPlayer: boolean;
  showQueue: boolean;

  // Loading state
  loading: boolean;
  error: string | null;

  // Actions
  loadTape: (tape: TapeWithDetails, startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  selectTrack: (index: number) => void;
  setShowFullPlayer: (show: boolean) => void;
  setShowQueue: (show: boolean) => void;
  setTime: (time: number) => void;
  setDuration: (dur: number) => void;
  setEnded: () => void;
  setError: (err: string | null) => void;
  closePlayer: () => void;
}

// Persist volume and settings
const savedVolume = parseFloat(localStorage.getItem('naqaa_volume') || '1');
const savedRepeat = (localStorage.getItem('naqaa_repeat') || 'off') as RepeatMode;
const savedShuffle = localStorage.getItem('naqaa_shuffle') === 'true';

// Singleton audio element
let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = 'metadata';
  }
  return audio;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTape: null,
  currentTrackIndex: 0,
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: savedVolume,
  muted: false,
  repeatMode: savedRepeat,
  shuffle: savedShuffle,
  showFullPlayer: false,
  showQueue: false,
  loading: false,
  error: null,

  loadTape: (tape, startIndex = 0) => {
    if (!tape.tracks || tape.tracks.length === 0) {
      set({ error: 'لا توجد مقاطع في هذا الشريط' });
      return;
    }

    const index = Math.min(startIndex, tape.tracks.length - 1);
    const track = tape.tracks[index];
    const isYouTube = Boolean(getYouTubeVideoId(track.url));

    set({
      currentTape: tape,
      currentTrackIndex: index,
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      error: null,
      showFullPlayer: true,
    });

    const el = getAudio();
    if (isYouTube) {
      el.pause();
      el.removeAttribute('src');
      el.load();
    } else {
      youtubeControls.stop();
      el.src = track.url;
      el.volume = get().muted ? 0 : get().volume;
      el.play().catch(() => {
        set({ error: 'تعذر تشغيل هذا المقطع. قد يكون الرابط غير متاح.' });
      });
    }

    // Increment play count
    api.playTape(tape.id).catch(() => {});
    // Record listen history
    api.recordListen(tape.id).catch(() => {});
  },

  play: () => {
    if (get().currentTrack && getYouTubeVideoId(get().currentTrack!.url)) {
      youtubeControls.play();
      set({ isPlaying: true });
      return;
    }
    const el = getAudio();
    if (el.src) {
      el.play().catch(() => {
        set({ error: 'تعذر تشغيل المقطع' });
      });
      set({ isPlaying: true });
    }
  },

  pause: () => {
    if (get().currentTrack && getYouTubeVideoId(get().currentTrack!.url)) {
      youtubeControls.pause();
      set({ isPlaying: false });
      return;
    }
    const el = getAudio();
    el.pause();
    set({ isPlaying: false });
  },

  toggle: () => {
    if (get().isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  next: () => {
    const { currentTape, currentTrackIndex, repeatMode, shuffle } = get();
    if (!currentTape?.tracks) return;

    const tracks = currentTape.tracks;
    let nextIndex: number;

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
      if (nextIndex === currentTrackIndex && tracks.length > 1) {
        nextIndex = (nextIndex + 1) % tracks.length;
      }
    } else {
      nextIndex = currentTrackIndex + 1;
      if (nextIndex >= tracks.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          get().pause();
          return;
        }
      }
    }

    get().selectTrack(nextIndex);
  },

  prev: () => {
    const { currentTape, currentTrackIndex, currentTime } = get();
    if (!currentTape?.tracks) return;

    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      get().seek(0);
      return;
    }

    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) {
      prevIndex = 0;
    }

    get().selectTrack(prevIndex);
  },

  seek: (time) => {
    if (get().currentTrack && getYouTubeVideoId(get().currentTrack!.url)) {
      youtubeControls.seek(time);
      set({ currentTime: time });
      return;
    }
    const el = getAudio();
    el.currentTime = time;
    set({ currentTime: time });
  },

  setVolume: (vol) => {
    const clamped = Math.max(0, Math.min(1, vol));
    localStorage.setItem('naqaa_volume', String(clamped));
    if (get().currentTrack && getYouTubeVideoId(get().currentTrack!.url)) {
      youtubeControls.setVolume(clamped);
      set({ volume: clamped, muted: clamped === 0 });
      return;
    }
    const el = getAudio();
    el.volume = clamped;
    set({ volume: clamped, muted: clamped === 0 });
  },

  toggleMute: () => {
    const { muted, volume } = get();
    if (get().currentTrack && getYouTubeVideoId(get().currentTrack!.url)) {
      if (muted) youtubeControls.unMute();
      else youtubeControls.mute();
      set({ muted: !muted });
      return;
    }
    const el = getAudio();
    if (muted) {
      el.volume = volume;
      set({ muted: false });
    } else {
      el.volume = 0;
      set({ muted: true });
    }
  },

  toggleRepeat: () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const current = get().repeatMode;
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    localStorage.setItem('naqaa_repeat', next);
    set({ repeatMode: next });
  },

  toggleShuffle: () => {
    const newShuffle = !get().shuffle;
    localStorage.setItem('naqaa_shuffle', String(newShuffle));
    set({ shuffle: newShuffle });
  },

  selectTrack: (index) => {
    const { currentTape } = get();
    if (!currentTape?.tracks || index < 0 || index >= currentTape.tracks.length) return;

    const track = currentTape.tracks[index];
    set({
      currentTrackIndex: index,
      currentTrack: track,
      currentTime: 0,
      duration: 0,
      isPlaying: true,
      error: null,
    });

    const el = getAudio();
    if (getYouTubeVideoId(track.url)) {
      el.pause();
      el.removeAttribute('src');
      el.load();
    } else {
      youtubeControls.stop();
      el.src = track.url;
      el.play().catch(() => {
        set({ error: 'تعذر تشغيل هذا المقطع' });
      });
    }
  },

  setShowFullPlayer: (show) => set({ showFullPlayer: show }),
  setShowQueue: (show) => set({ showQueue: show }),

  setTime: (time) => set({ currentTime: time }),
  setDuration: (dur) => set({ duration: dur }),

  setEnded: () => {
    const { repeatMode } = get();
    if (repeatMode === 'one') {
      get().seek(0);
      get().play();
    } else {
      get().next();
    }
  },

  setError: (err) => set({ error: err }),

  closePlayer: () => {
    const el = getAudio();
    el.pause();
    el.src = '';
    youtubeControls.stop();
    set({
      currentTape: null,
      currentTrack: null,
      currentTrackIndex: 0,
      isPlaying: false,
      showFullPlayer: false,
      showQueue: false,
      currentTime: 0,
      duration: 0,
    });
  },
}));

// Setup audio event listeners
function setupAudioListeners() {
  const el = getAudio();

  el.addEventListener('timeupdate', () => {
    usePlayerStore.getState().setTime(el.currentTime);
  });

  el.addEventListener('loadedmetadata', () => {
    usePlayerStore.getState().setDuration(el.duration);
  });

  el.addEventListener('ended', () => {
    usePlayerStore.getState().setEnded();
  });

  el.addEventListener('error', () => {
    usePlayerStore.getState().setError('تعذر تحميل المقطع الصوتي. تأكد من صحة الرابط.');
  });

  el.addEventListener('waiting', () => {
    usePlayerStore.getState().setError(null);
  });
}

setupAudioListeners();
