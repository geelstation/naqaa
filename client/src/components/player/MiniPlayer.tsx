import { Play, Pause, SkipForward, SkipBack, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { formatTime } from '../../utils/format';
import { getYouTubeVideoId } from '../../utils/youtube';

export default function MiniPlayer() {
  const location = useLocation();
  const [watchPlayerVisible, setWatchPlayerVisible] = useState(true);
  const {
    currentTape, currentTrack, isPlaying, currentTime, duration,
    volume, muted, toggle, next, prev, seek, setVolume, toggleMute, setShowFullPlayer,
  } = usePlayerStore();

  const isTapePage = location.pathname.startsWith('/tape/');
  const isYouTubeTrack = currentTrack ? Boolean(getYouTubeVideoId(currentTrack.url)) : false;

  useEffect(() => {
    if (!isTapePage) {
      setWatchPlayerVisible(true);
      return;
    }

    const slot = document.getElementById('youtube-inline-player-slot');
    if (!slot) {
      setWatchPlayerVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setWatchPlayerVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(slot);
    return () => observer.disconnect();
  }, [isTapePage, currentTape?.id]);

  if (
    !currentTape ||
    !currentTrack ||
    (isTapePage && (watchPlayerVisible || isYouTubeTrack))
  ) return null;

  const cover = currentTrack.coverImage || currentTape.coverImage;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mini-player-shell fixed bottom-0 left-0 right-0 z-[45]">
      {/* Thin progress line */}
      <div
        className="h-1 bg-yt-border cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - rect.left) / rect.width) * duration);
        }}
      >
        <div className="h-full bg-naqaa-500 transition-none" style={{ width: `${progress}%` }} />
      </div>

      <div className="bg-yt-card border-t border-yt-border flex items-center h-16 px-3 sm:px-4 gap-3">
        {/* Track info */}
        <button
          onClick={() => setShowFullPlayer(true)}
          className="flex items-center gap-3 flex-1 min-w-0 text-right hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-yt-hover shrink-0">
            {cover
              ? <img src={cover} alt={currentTrack.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-yt-sub">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" /></svg>
                </div>
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-yt-text truncate">{currentTrack.title}</p>
            <p className="text-xs text-yt-muted truncate">{currentTape.title}</p>
          </div>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={prev} className="btn-yt-icon hidden sm:flex"><SkipBack size={18} /></button>
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-full bg-yt-text text-yt-bg flex items-center justify-center hover:bg-white transition-colors"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="mr-0.5" />}
          </button>
          <button onClick={next} className="btn-yt-icon hidden sm:flex"><SkipForward size={18} /></button>
        </div>

        {/* Right: volume + time + expand */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <span className="text-xs text-yt-muted tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="btn-yt-icon">
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div
              className="w-20 h-1.5 bg-yt-border rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setVolume((e.clientX - rect.left) / rect.width);
              }}
            >
              <div className="h-full bg-yt-text rounded-full" style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
            </div>
          </div>
        </div>

        <button onClick={() => setShowFullPlayer(true)} className="btn-yt-icon shrink-0">
          <ChevronUp size={18} />
        </button>
      </div>
    </div>
  );
}
