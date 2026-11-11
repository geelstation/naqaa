import {
  Play, Pause, SkipForward, SkipBack, ChevronDown,
  Volume2, VolumeX, Repeat, Repeat1, Shuffle, ListMusic, Share2, X,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { formatTime, formatTotalDuration } from '../../utils/format';
import WaveformVisualizer from './WaveformVisualizer';

type RepeatMode = 'off' | 'all' | 'one';

export default function FullPlayer() {
  const location = useLocation();
  const {
    currentTape, currentTrack, currentTrackIndex, isPlaying,
    currentTime, duration, volume, muted, repeatMode, shuffle,
    showFullPlayer, showQueue,
    toggle, next, prev, seek, setVolume, toggleMute,
    toggleRepeat, toggleShuffle, selectTrack,
    setShowFullPlayer, setShowQueue, error, closePlayer,
  } = usePlayerStore();

  const [copied, setCopied] = useState(false);

  if (location.pathname.startsWith('/tape/') || !showFullPlayer || !currentTape || !currentTrack) return null;

  const cover = currentTrack.coverImage || currentTape.coverImage;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tape/${currentTape.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-yt-bg/95 backdrop-blur-xl animate-fade-in flex flex-col">
      {/* Blurred background */}
      {cover && (
        <div
          className="absolute inset-0 opacity-10 blur-3xl scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button onClick={() => setShowFullPlayer(false)} className="btn-yt-icon">
          <ChevronDown size={24} />
        </button>
        <div className="text-center">
          <p className="text-yt-muted text-xs">قيد التشغيل من</p>
          <p className="text-yt-text text-sm font-medium truncate max-w-[200px]">{currentTape.title}</p>
        </div>
        <button onClick={closePlayer} className="btn-yt-icon">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="relative flex-1 flex flex-col lg:flex-row gap-6 px-4 sm:px-8 overflow-hidden">
        {/* Left: cover + info */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden bg-yt-hover shadow-2xl mb-6 shrink-0">
            {cover
              ? <img src={cover} alt={currentTape.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-20 h-20 text-yt-sub" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" /></svg>
                </div>
            }
          </div>

          <h2 className="text-yt-text text-xl font-bold mb-1 max-w-xs truncate">{currentTrack.title}</h2>
          <p className="text-yt-sub text-sm">{currentTape.creator?.username || 'مجهول'}</p>

          <div className="w-64 h-12 mt-6">
            <WaveformVisualizer isPlaying={isPlaying} bars={36} />
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-4 bg-red-500/10 px-4 py-2 rounded-lg max-w-xs">{error}</p>
          )}
        </div>

        {/* Right: queue or info */}
        <div className="flex-1 flex flex-col min-h-0 lg:max-w-xs">
          {showQueue && currentTape.tracks ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-yt-text font-bold flex items-center gap-2"><ListMusic size={20} />قائمة المقاطع</h3>
                <button onClick={() => setShowQueue(false)} className="text-yt-sub hover:text-yt-text text-sm">إخفاء</button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                {currentTape.tracks.map((track, i) => (
                  <button
                    key={track.id}
                    onClick={() => selectTrack(i)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-right transition-colors ${
                      i === currentTrackIndex ? 'bg-yt-hover text-yt-text' : 'text-yt-sub hover:bg-yt-hover hover:text-yt-text'
                    }`}
                  >
                    <div className="w-7 shrink-0 flex items-center justify-center">
                      {i === currentTrackIndex && isPlaying
                        ? <WaveformVisualizer isPlaying bars={3} className="h-4" />
                        : <span className="text-sm">{i + 1}</span>
                      }
                    </div>
                    <p className="flex-1 text-sm truncate">{track.title}</p>
                    {track.duration && <span className="text-xs text-yt-muted shrink-0">{formatTime(track.duration)}</span>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-yt-hover rounded-2xl p-4">
                <h3 className="text-yt-text font-bold mb-1">{currentTape.title}</h3>
                {currentTape.description && <p className="text-yt-sub text-sm leading-relaxed mb-2">{currentTape.description}</p>}
                <div className="flex items-center gap-3 text-xs text-yt-muted">
                  <span>{currentTape.trackCount || currentTape.tracks?.length || 0} مقاطع</span>
                  {currentTape.totalDuration ? <span>{formatTotalDuration(currentTape.totalDuration)}</span> : null}
                </div>
              </div>
              <button onClick={() => setShowQueue(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-yt-hover text-yt-text hover:bg-yt-line transition-colors">
                <ListMusic size={20} />عرض قائمة المقاطع
              </button>
              <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-yt-hover text-yt-text hover:bg-yt-line transition-colors">
                <Share2 size={20} />
                {copied ? 'تم النسخ!' : 'مشاركة الشريط'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative shrink-0 px-4 sm:px-8 pb-6 pt-2">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-yt-muted text-xs tabular-nums w-10 text-left">{formatTime(currentTime)}</span>
          <div
            className="flex-1 h-1.5 bg-yt-border rounded-full cursor-pointer group relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - rect.left) / rect.width) * duration);
            }}
          >
            <div className="h-full bg-yt-text rounded-full transition-none" style={{ width: `${progress}%` }}>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-yt-muted text-xs tabular-nums w-10">{formatTime(duration)}</span>
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-center gap-2 sm:gap-5">
          <button onClick={toggleShuffle} className={`btn-yt-icon ${shuffle ? 'text-naqaa-400' : 'text-yt-muted'}`}>
            <Shuffle size={20} />
          </button>
          <button onClick={prev} className="btn-yt-icon text-yt-text">
            <SkipBack size={26} fill="currentColor" />
          </button>
          <button
            onClick={toggle}
            className="w-14 h-14 rounded-full bg-yt-text text-yt-bg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="mr-0.5" />}
          </button>
          <button onClick={next} className="btn-yt-icon text-yt-text">
            <SkipForward size={26} fill="currentColor" />
          </button>
          <button onClick={toggleRepeat} className={`btn-yt-icon ${repeatMode !== 'off' ? 'text-naqaa-400' : 'text-yt-muted'}`}>
            {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </button>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center justify-center gap-3 mt-4">
          <button onClick={toggleMute} className="text-yt-muted hover:text-yt-text transition-colors">
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div
            className="w-28 h-1.5 bg-yt-border rounded-full cursor-pointer"
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setVolume((e.clientX - r.left) / r.width); }}
          >
            <div className="h-full bg-yt-text/60 rounded-full" style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
