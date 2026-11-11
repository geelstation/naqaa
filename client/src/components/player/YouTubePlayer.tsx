import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { getYouTubeVideoId } from '../../utils/youtube';
import { setYouTubePlayer, youtubeControls, type YouTubePlayerApi } from '../../utils/youtubePlayer';

interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: () => void;
        onStateChange: (event: { data: number }) => void;
        onError: () => void;
      };
    },
  ) => YouTubePlayerApi;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number };
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let player: YouTubePlayerApi | null = null;
let ready = false;
let pendingVideoId: string | null = null;
let progressTimer: number | undefined;
let scriptPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) {
      existingScript.addEventListener('error', () => reject(new Error('تعذر تحميل مشغل يوتيوب')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => reject(new Error('تعذر تحميل مشغل يوتيوب'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function YouTubePlayer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const showFullPlayer = usePlayerStore((state) => state.showFullPlayer);
  const muted = usePlayerStore((state) => state.muted);
  const volume = usePlayerStore((state) => state.volume);
  const videoId = currentTrack ? getYouTubeVideoId(currentTrack.url) : null;
  const isTapePage = location.pathname.startsWith('/tape/');
  const showInline = Boolean(videoId && isTapePage);
  const [inlineBounds, setInlineBounds] = useState<DOMRect | null>(null);
  const [slotVisible, setSlotVisible] = useState(true);

  useLayoutEffect(() => {
    if (!showInline) {
      setInlineBounds(null);
      setSlotVisible(true);
      return;
    }

    const slot = document.getElementById('youtube-inline-player-slot');
    if (!slot) return;

    const updateBounds = () => setInlineBounds(slot.getBoundingClientRect());
    updateBounds();
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds, true);
    const observer = new ResizeObserver(updateBounds);
    observer.observe(slot);
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => setSlotVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    visibilityObserver.observe(slot);

    return () => {
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds, true);
      observer.disconnect();
      visibilityObserver.disconnect();
    };
  }, [showInline, location.pathname]);

  useEffect(() => {
    if (!videoId || !hostRef.current) {
      pendingVideoId = null;
      youtubeControls.stop();
      return;
    }

    pendingVideoId = videoId;
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT) return;

      if (player) {
        if (ready) player.loadVideoById(videoId);
        return;
      }

      const newPlayer = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          enablejsapi: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            setYouTubePlayer(newPlayer);
            ready = true;
            const { muted: isMuted, volume: currentVolume } = usePlayerStore.getState();
            youtubeControls.setVolume(isMuted ? 0 : currentVolume);
            if (pendingVideoId) newPlayer.loadVideoById(pendingVideoId);
          },
          onStateChange: ({ data }) => {
            const { setTime, setDuration } = usePlayerStore.getState();
            const states = window.YT?.PlayerState;
            if (!states) return;

            if (data === states.PLAYING) {
              usePlayerStore.setState({ isPlaying: true, error: null });
              window.clearInterval(progressTimer);
              progressTimer = window.setInterval(() => {
                setTime(newPlayer.getCurrentTime() || 0);
                setDuration(newPlayer.getDuration() || 0);
              }, 500);
            } else if (data === states.PAUSED) {
              usePlayerStore.setState({ isPlaying: false });
              window.clearInterval(progressTimer);
            } else if (data === states.ENDED) {
              window.clearInterval(progressTimer);
              usePlayerStore.getState().setEnded();
            } else if (data === states.BUFFERING) {
              usePlayerStore.setState({ error: null });
            }
          },
          onError: () => {
            usePlayerStore.setState({
              isPlaying: false,
              error: 'تعذر تشغيل فيديو يوتيوب. قد يكون الفيديو خاصًا أو لا يسمح بالتضمين.',
            });
          },
        },
      });
      player = newPlayer;
      setYouTubePlayer(newPlayer);
    }).catch(() => {
      usePlayerStore.setState({ isPlaying: false, error: 'تعذر تحميل مشغل يوتيوب' });
    });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  useEffect(() => {
    if (!player || !ready || !videoId) return;
    youtubeControls.setVolume(muted ? 0 : volume);
  }, [muted, volume, videoId]);

  return (
    <div
      className={showInline && !slotVisible
        ? 'fixed z-[44] bottom-20 right-4 aspect-video w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl bg-black shadow-2xl'
        : showInline
        ? 'fixed z-[44] overflow-hidden rounded-xl bg-black'
        : !videoId
        ? 'fixed -left-[10000px] top-0 w-px h-px overflow-hidden'
        : showFullPlayer
        ? 'fixed z-[55] top-[12%] left-1/2 -translate-x-1/2 w-[min(92vw,640px)] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl'
        : 'fixed z-[44] bottom-20 right-3 w-[min(42vw,260px)] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl'}
      style={showInline && slotVisible ? {
        left: inlineBounds?.left ?? 0,
        top: inlineBounds?.top ?? 0,
        width: inlineBounds?.width ?? 0,
        height: inlineBounds?.height ?? 0,
        visibility: inlineBounds ? 'visible' : 'hidden',
      } : undefined}
      aria-label={videoId ? 'مشغل فيديو يوتيوب' : undefined}
    >
      <div ref={hostRef} className="w-full h-full" />
      {showInline && !slotVisible && (
        <button
          type="button"
          onClick={() => document.getElementById('youtube-inline-player-slot')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="absolute left-2 top-2 z-10 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
        >
          العودة للفيديو
        </button>
      )}
    </div>
  );
}
