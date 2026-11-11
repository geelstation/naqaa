import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreVertical, Play } from 'lucide-react';
import type { TapeWithDetails } from '../../types';
import { formatDate, formatTotalDuration, formatPlayCount } from '../../utils/format';
import { getCategoryLabel } from '../../types';

interface TapeCardProps {
  tape: TapeWithDetails;
  /** Layout: 'grid' (default) | 'row' (horizontal, like YouTube sidebar) */
  layout?: 'grid' | 'row';
}

export default function TapeCard({ tape, layout = 'grid' }: TapeCardProps) {
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/tape/${tape.id}`);
  };

  const Thumb = () => (
    <div className="tape-thumb relative aspect-video overflow-hidden rounded-lg bg-yt-hover">
      {tape.coverImage && !imgFailed ? (
        <img
          src={tape.coverImage}
          alt={tape.title}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          className="tape-cover w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yt-hover to-yt-card">
          <svg viewBox="0 0 100 100" className="w-14 h-14 text-yt-sub">
            <path d="M30 35 Q30 30 35 30 L65 30 Q70 30 70 35 L70 55 Q70 65 60 65 L40 65 Q30 65 30 55 Z"
              fill="none" stroke="currentColor" strokeWidth="4"/>
            <circle cx="50" cy="48" r="8" fill="none" stroke="currentColor" strokeWidth="4"/>
            <circle cx="50" cy="48" r="3" fill="currentColor"/>
            <path d="M25 72 Q50 80 75 72" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>
      )}
      <div className="cassette-window" aria-hidden="true">
        <span className="cassette-spool"><i /></span>
        <span className="cassette-ribbon" />
        <span className="cassette-spool"><i /></span>
      </div>
      <Link
        to={`/tape/${tape.id}`}
        aria-label={`عرض ${tape.title}`}
        className="absolute inset-0 z-0"
      />
      <span className="tape-side-label pointer-events-none absolute top-2 right-2 z-10">
        وجه أ
      </span>
      {/* Duration badge */}
      <span className="pointer-events-none absolute bottom-2 left-2 z-10 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
        {tape.totalDuration ? formatTotalDuration(tape.totalDuration) : `${tape.trackCount || 0} مقاطع`}
      </span>
      {/* Play button on hover */}
      <button
        onClick={handlePlay}
        aria-label="تشغيل"
        className="tape-card-play absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30"
      >
        <div className="tape-card-play-button w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
          <Play size={22} className="text-yt-bg mr-0.5" fill="currentColor" />
        </div>
      </button>
    </div>
  );

  const Meta = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex gap-3 min-w-0">
      {/* Avatar */}
      <Link
        to={`/user/${tape.creator?.username}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 w-9 h-9 rounded-full bg-naqaa-700 flex items-center justify-center text-white text-sm font-bold overflow-hidden"
      >
        {tape.creator?.avatar
          ? <img src={tape.creator.avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
          : tape.creator?.username?.charAt(0) || 'ن'
        }
      </Link>
      <div className="min-w-0 flex-1">
        {!compact && <span className="tape-category">{getCategoryLabel(tape.category)}</span>}
        <h3 className={`font-semibold text-yt-text leading-snug group-hover:text-naqaa-700 transition-colors ${compact ? 'text-sm line-clamp-2' : 'text-[15px] line-clamp-2'}`}>
          <Link to={`/tape/${tape.id}`}>{tape.title}</Link>
        </h3>
        <p className="text-sm text-yt-sub mt-0.5 truncate hover:text-yt-text">
          {tape.creator?.username || 'مجهول'}
        </p>
        <div className="text-xs text-yt-muted flex flex-wrap items-center gap-x-1 mt-0.5">
          <span>{formatPlayCount(tape.playCount)} استماع</span>
          <span>·</span>
          <span>{formatDate(tape.createdAt)}</span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); }}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-yt-sub hover:text-yt-text p-1 rounded-full hover:bg-yt-hover"
        aria-label="المزيد"
      >
        <MoreVertical size={18} />
      </button>
    </div>
  );

  if (layout === 'row') {
    return (
      <div className="group flex gap-3 items-start">
        <div className="w-40 shrink-0">
          <Thumb />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-sm font-semibold text-yt-text line-clamp-2 group-hover:text-white leading-snug">
            <Link to={`/tape/${tape.id}`}>{tape.title}</Link>
          </h3>
          <p className="text-xs text-yt-sub mt-1">{tape.creator?.username}</p>
          <div className="text-xs text-yt-muted mt-0.5 flex items-center gap-1">
            <span>{formatPlayCount(tape.playCount)} استماع</span>
            <span>·</span>
            <span>{formatDate(tape.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tape-card group flex flex-col gap-3 cursor-pointer">
      <Thumb />
      <Meta />
    </div>
  );
}
