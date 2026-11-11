import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Repeat1, Shuffle, ThumbsUp, ThumbsDown, Share2,
  Bookmark, BookmarkCheck, Pencil, Send, Trash2,
  UserPlus, UserCheck, ChevronDown, ChevronUp, AlertCircle,
  Settings, Maximize2, AudioLines, ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import type { TapeWithDetails, CommentWithUser, Track } from '../types';
import { getCategoryLabel } from '../types';
import { usePlayerStore } from '../stores/playerStore';
import { useAuthStore } from '../stores/authStore';
import { formatTime, formatTotalDuration, formatPlayCount, formatDate } from '../utils/format';
import { getYouTubeVideoId } from '../utils/youtube';
import TapeCard from '../components/tapes/TapeCard';
import WaveformVisualizer from '../components/player/WaveformVisualizer';

/* ─────────────────────────────────────────────
   Inline YouTube-style player — uses the global
   playerStore so MiniPlayer stays in sync
───────────────────────────────────────────── */
function InlinePlayer({ tape }: { tape: TapeWithDetails }) {
  const {
    currentTape, currentTrack, currentTrackIndex, isPlaying,
    currentTime, duration, volume, muted, repeatMode, shuffle,
    loadTape, toggle, next, prev, seek, setVolume, toggleMute,
    toggleRepeat, toggleShuffle, selectTrack, setShowFullPlayer, error,
  } = usePlayerStore();

  const isCurrent = currentTape?.id === tape.id;
  const track = isCurrent ? currentTrack : tape.tracks?.[0] ?? null;
  const trackIndex = isCurrent ? currentTrackIndex : 0;
  const playing = isCurrent && isPlaying;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Auto-start on mount
  useEffect(() => {
    if (tape.tracks && tape.tracks.length > 0 && currentTape?.id !== tape.id) {
      loadTape(tape, 0);
    }
    setShowFullPlayer(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tape.id]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (isCurrent) seek(pct * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pct);
  };

  const handleToggle = () => {
    if (!isCurrent) {
      loadTape(tape, 0);
    } else {
      toggle();
    }
  };

  const cover = track?.coverImage || tape.coverImage;
  const isYouTubeTrack = Boolean(track && getYouTubeVideoId(track.url));

  return (
    <div className="w-full overflow-hidden rounded-xl" style={{ background: '#000' }}>
      {/* ── Artwork / visual area ── */}
      <div
        id="youtube-inline-player-slot"
        className="relative w-full flex items-center justify-center"
        style={{
          aspectRatio: '16/9',
          background: 'radial-gradient(ellipse at 50% 45%, #292929 0%, #171717 54%, #0f0f0f 100%)',
        }}
      >
        {!isYouTubeTrack && (
          <div className="relative z-10 flex max-h-full flex-col items-center gap-3 px-5 py-4 text-center sm:gap-4">
            <div className="relative h-[min(34vw,220px)] w-[min(34vw,220px)] overflow-hidden rounded-2xl border border-white/10 bg-[#24211d] shadow-[0_18px_48px_rgba(0,0,0,0.4)] sm:h-[min(28vw,250px)] sm:w-[min(28vw,250px)]">
              {cover ? (
                <img src={cover} alt={track?.title || tape.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#55432e] via-[#30271e] to-[#17130f]">
                  <AudioLines size={52} strokeWidth={1.2} className="text-[#d7bd94]" />
                </div>
              )}
              <span className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold text-[#f4e3c4]">
                {trackIndex + 1} / {tape.tracks?.length ?? 1}
              </span>
            </div>
            <div className="max-w-[min(80vw,560px)]">
              <p className="truncate text-base font-bold text-white sm:text-lg">{track?.title || tape.title}</p>
              <p className="mt-1 truncate text-xs text-white/60 sm:text-sm">{tape.title} · {tape.creator?.username || 'نقاء'}</p>
            </div>
            <div className="h-7 w-[min(45vw,260px)]">
              <WaveformVisualizer isPlaying={playing} bars={32} />
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && isCurrent && !isYouTubeTrack && (
          <div
            className="absolute bottom-4 left-0 right-0 mx-4 text-center text-sm rounded-lg py-2 px-4"
            style={{ background: 'rgba(255,0,0,0.15)', color: '#f87171' }}
          >
            {error}
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      {!isYouTubeTrack && <><div
        ref={progressBarRef}
        className="relative h-1 cursor-pointer group"
        style={{ background: '#3d3d3d' }}
        onClick={handleSeek}
      >
        {/* Buffered (fake visual) */}
        <div className="absolute inset-y-0 left-0" style={{ width: `${Math.min(progress + 15, 100)}%`, background: '#555' }} />
        {/* Played */}
        <div
          className="absolute inset-y-0 left-0 transition-none"
          style={{ width: `${progress}%`, background: '#ff0000' }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* ── Controls bar ── */}
      <div
        className="flex items-center gap-1 px-3 py-2"
        style={{ background: '#0f0f0f' }}
      >
        {/* Play / Pause */}
        <button
          onClick={handleToggle}
          className="flex items-center justify-center rounded-full transition-colors"
          style={{ width: 40, height: 40, color: '#f1f1f1' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#272727'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          {playing
            ? <Pause size={22} fill="currentColor" />
            : <Play size={22} fill="currentColor" className="ml-0.5" />
          }
        </button>

        {/* Prev */}
        <button
          onClick={() => isCurrent && prev()}
          className="flex items-center justify-center rounded-full transition-colors"
          style={{ width: 36, height: 36, color: '#aaa' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f1f1f1'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#aaa'; }}
        >
          <SkipBack size={18} fill="currentColor" />
        </button>

        {/* Next */}
        <button
          onClick={() => isCurrent && next()}
          className="flex items-center justify-center rounded-full transition-colors"
          style={{ width: 36, height: 36, color: '#aaa' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f1f1f1'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#aaa'; }}
        >
          <SkipForward size={18} fill="currentColor" />
        </button>

        {/* Volume */}
        <div className="flex items-center gap-1.5 group/vol">
          <button
            onClick={toggleMute}
            style={{ color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f1f1f1'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#aaa'; }}
          >
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div
            className="w-20 h-1 rounded-full cursor-pointer hidden sm:block"
            style={{ background: '#3d3d3d' }}
            onClick={handleVolumeClick}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${(muted ? 0 : volume) * 100}%`, background: '#f1f1f1' }}
            />
          </div>
        </div>

        {/* Time */}
        <span className="text-xs tabular-nums hidden sm:block ml-1" style={{ color: '#aaa' }}>
          {formatTime(isCurrent ? currentTime : 0)}
          <span style={{ color: '#555' }}> / </span>
          {formatTime(isCurrent ? duration : 0)}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Shuffle */}
        <button
          onClick={toggleShuffle}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: shuffle ? '#54ab7d' : '#aaa' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f1f1f1'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = shuffle ? '#54ab7d' : '#aaa'; }}
          title="عشوائي"
        >
          <Shuffle size={17} />
        </button>

        {/* Repeat */}
        <button
          onClick={toggleRepeat}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: repeatMode !== 'off' ? '#54ab7d' : '#aaa' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f1f1f1'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = repeatMode !== 'off' ? '#54ab7d' : '#aaa'; }}
          title="تكرار"
        >
          {repeatMode === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
        </button>
      </div>
      </>}
    </div>
  );
}

function CassetteReel({ spinning }: { spinning: boolean }) {
  return (
    <div className={`cassette-reel ${spinning ? 'cassette-reel-spinning' : ''}`}>
      <span className="cassette-reel-ring">
        <i /><i /><i /><i /><i /><i />
      </span>
      <span className="cassette-reel-hub" />
    </div>
  );
}

function CassetteFace({
  face, faceIndex, tapeTitle, isCurrentTape, currentTrackIndex, isPlaying, onTrackClick,
}: {
  face: { label: string; hint: string; tracks: Track[]; startIndex: number };
  faceIndex: number;
  tapeTitle: string;
  isCurrentTape: boolean;
  currentTrackIndex: number;
  isPlaying: boolean;
  onTrackClick: (index: number) => void;
}) {
  const firstIndex = face.startIndex;
  const lastIndex = face.startIndex + face.tracks.length;
  const sideDuration = face.tracks.reduce((total, track) => total + (track.duration || 0), 0);
  const sideIsPlaying = isCurrentTape && isPlaying && currentTrackIndex >= firstIndex && currentTrackIndex < lastIndex;

  return (
    <section key={face.label} className="cassette-face-wrap cassette-flip-in">
      <div className="cassette-face-heading">
        <div>
          <p>محتويات الوجه {faceIndex === 0 ? 'أ' : 'ب'}</p>
          <h3>{face.hint}</h3>
        </div>
        <span>{face.tracks.length} {face.tracks.length === 1 ? 'مقطع' : 'مقاطع'}</span>
      </div>

      <div className="cassette-shell">
        <div className="cassette-label">
          <div className="cassette-label-heading">
            <div className="min-w-0">
              <p className="cassette-label-kicker">نقاء · شريط صوتي</p>
              <h4 className="cassette-label-title" title={tapeTitle}>{tapeTitle}</h4>
            </div>
            <span className="cassette-face-stamp">
              <span>الوجه</span>
              {faceIndex === 0 ? 'أ' : 'ب'}
            </span>
          </div>
        </div>

        <div className="cassette-window" aria-label={sideIsPlaying ? 'الشريط يدور أثناء التشغيل' : 'بكرتا شريط كاسيت'}>
          <span className="cassette-window-shine" />
          <span className="cassette-tape-run cassette-tape-run-top" />
          <span className="cassette-tape-run cassette-tape-run-bottom" />
          <CassetteReel spinning={sideIsPlaying && currentTrackIndex === firstIndex} />
          <span className="cassette-tape-bow cassette-tape-bow-left" />
          <span className="cassette-tape-bow cassette-tape-bow-right" />
          <CassetteReel spinning={sideIsPlaying && currentTrackIndex !== firstIndex} />
        </div>
      </div>

      <div className="cassette-track-list">
        {face.tracks.map((track, localIndex) => {
          const index = face.startIndex + localIndex;
          const active = isCurrentTape && currentTrackIndex === index;
          return (
            <article key={track.id} className={`cassette-cut ${active ? 'cassette-cut-active' : ''}`}>
              <button
                type="button"
                onClick={() => onTrackClick(index)}
                aria-label={`${active && isPlaying ? 'إيقاف' : 'تشغيل'} ${track.title}`}
                className="cassette-cut-play"
              >
                {active && isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
              </button>
              <span className="cassette-cut-number">{String(localIndex + 1).padStart(2, '0')}</span>
              <div className="cassette-cut-copy">
                <p>{track.title}</p>
                {track.curatorNote && <span>{track.curatorNote}</span>}
                {track.sourceAttribution && (
                  <span className="cassette-cut-source">
                    المصدر: {track.sourceUrl
                      ? <a href={track.sourceUrl} target="_blank" rel="noreferrer">{track.sourceAttribution}</a>
                      : track.sourceAttribution}
                    {track.licenseUrl && track.licenseName && <> · <a href={track.licenseUrl} target="_blank" rel="noreferrer">{track.licenseName}</a></>}
                  </span>
                )}
              </div>
              <span className="cassette-cut-duration" dir="ltr">
                {track.duration ? formatTime(track.duration) : '—:—'}
              </span>
            </article>
          );
        })}
      </div>
      <p className="cassette-side-total">
        زمن الوجه {sideDuration > 0 ? formatTime(sideDuration) : 'غير محدد'}
      </p>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function TapeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTape, currentTrackIndex, isPlaying, loadTape, selectTrack } = usePlayerStore();

  const [tape, setTape] = useState<TapeWithDetails | null>(null);
  const [related, setRelated] = useState<TapeWithDetails[]>([]);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    window.scrollTo(0, 0);

    Promise.all([api.getTape(id), api.getComments(id)])
      .then(([tapeRes, commentsRes]) => {
        setTape(tapeRes.tape);
        setLiked(tapeRes.tape.isLiked ?? false);
        setLikeCount(tapeRes.tape.likeCount ?? 0);
        setFollowing(tapeRes.tape.isFollowingCreator ?? false);
        setComments(commentsRes.comments);
        api.getTapes({ limit: 20 }).then((r) => setRelated(r.tapes.filter((t) => t.id !== id)));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'تعذر التحميل'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!tape?.creatorId) return;
    api.getFollowInfo(tape.creatorId)
      .then((r) => { setFollowing(r.isFollowing); setFollowersCount(r.followersCount); })
      .catch(() => {});
  }, [tape?.creatorId]);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    setLiked((l) => !l);
    setLikeCount((c) => liked ? c - 1 : c + 1);
    try { await api.toggleLike(id!); }
    catch { setLiked((l) => !l); setLikeCount((c) => liked ? c + 1 : c - 1); }
  };

  const handleSave = async () => {
    if (!user) { navigate('/login'); return; }
    if (saved) { await api.unsaveTape(id!); setSaved(false); }
    else { await api.saveTape(id!); setSaved(true); }
  };

  const handleFollow = async () => {
    if (!user || !tape?.creatorId) { navigate('/login'); return; }
    setFollowing((f) => !f);
    setFollowersCount((c) => following ? c - 1 : c + 1);
    try { await api.toggleFollow(tape.creatorId); }
    catch { setFollowing((f) => !f); setFollowersCount((c) => following ? c + 1 : c - 1); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.addComment(id!, comment);
      setComments((p) => [res.comment, ...p]);
      setComment('');
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleDeleteComment = async (cid: string) => {
    await api.deleteComment(id!, cid);
    setComments((p) => p.filter((c) => c.id !== cid));
  };

  const handleTrackClick = (index: number) => {
    if (!tape) return;
    if (currentTape?.id === tape.id) selectTrack(index);
    else loadTape(tape, index);
  };

  const isCurrent = currentTape?.id === id;
  const isOwner = user?.id === tape?.creatorId;
  const tapeTracks = tape?.tracks || [];
  const faceASplit = Math.ceil(tapeTracks.length / 2);
  const knownDuration = tapeTracks.reduce((total, item) => total + (item.duration || 0), 0);
  const tapeFaces = [
    { label: 'الوجه أ', hint: 'بداية الحكاية', tracks: tapeTracks.slice(0, faceASplit), startIndex: 0 },
    { label: 'الوجه ب', hint: 'تكملة الرحلة', tracks: tapeTracks.slice(faceASplit), startIndex: faceASplit },
  ].filter((face) => face.tracks.length > 0);
  const visibleFaceIndex = Math.min(selectedFaceIndex, Math.max(tapeFaces.length - 1, 0));
  const visibleFace = tapeFaces[visibleFaceIndex];

  useEffect(() => {
    setSelectedFaceIndex(0);
  }, [id]);

  useEffect(() => {
    if (!isCurrent || tapeFaces.length < 2) return;
    setSelectedFaceIndex(currentTrackIndex >= faceASplit ? 1 : 0);
  }, [isCurrent, currentTrackIndex, faceASplit, tapeFaces.length]);

  /* ── Loading skeleton ── */
  if (loading) return (
    <div
      className="max-w-[1600px] mx-auto px-4 py-4 flex gap-6 animate-pulse"
      style={{ color: '#f1f1f1' }}
    >
      <div className="flex-1 min-w-0 space-y-4">
        <div className="w-full rounded-xl" style={{ aspectRatio: '16/9', background: '#1a1a1a' }} />
        <div className="h-6 rounded w-3/4" style={{ background: '#272727' }} />
        <div className="h-4 rounded w-1/2" style={{ background: '#272727' }} />
      </div>
      <div className="hidden lg:block w-96 shrink-0 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-40 rounded-xl shrink-0" style={{ aspectRatio: '16/9', background: '#1a1a1a' }} />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 rounded w-full" style={{ background: '#272727' }} />
              <div className="h-3 rounded w-2/3" style={{ background: '#272727' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (error || !tape) return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <AlertCircle size={48} style={{ color: '#717171', marginBottom: 16 }} />
      <h1 style={{ color: '#f1f1f1', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>تعذر تحميل الشريط</h1>
      <p style={{ color: '#aaa', marginBottom: 24 }}>{error}</p>
      <button onClick={() => navigate(-1)} className="btn-yt-secondary">رجوع</button>
    </div>
  );

  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 pt-5 pb-12 flex flex-col lg:flex-row gap-7 items-stretch lg:items-start"
      style={{
        color: '#f1f1f1',
        background: '#0f0f0f',
      }}
    >
      {/* ════════════════ MAIN COLUMN ════════════════ */}
      <div className="w-full min-w-0 flex-1">

        {/* ── PLAYER ── */}
        <InlinePlayer tape={tape} />

        {/* ── Below player ── */}
        <div className="px-4 md:px-0 mt-4 space-y-4">

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight" style={{ color: '#f1f1f1' }}>
            {tape.title}
          </h1>

          {/* Channel row + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">

            {/* Channel */}
            <div className="flex items-center gap-3">
              <Link
                to={`/user/${tape.creator?.username}`}
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-bold shrink-0"
                style={{ background: '#1d5b40' }}
              >
                {tape.creator?.avatar
                  ? <img src={tape.creator.avatar} alt="" className="w-full h-full object-cover" />
                  : tape.creator?.username?.charAt(0) || 'ن'
                }
              </Link>
              <div>
                <Link
                  to={`/user/${tape.creator?.username}`}
                  className="font-semibold text-sm hover:text-white transition-colors"
                  style={{ color: '#f1f1f1' }}
                >
                  {tape.creator?.username || 'مجهول'}
                </Link>
                <p className="text-xs" style={{ color: '#aaa' }}>{followersCount} متابع</p>
              </div>
              {user && !isOwner && (
                <button
                  onClick={handleFollow}
                  className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
                  style={{
                    background: following ? '#272727' : '#f1f1f1',
                    color: following ? '#f1f1f1' : '#0f0f0f',
                  }}
                >
                  {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                  {following ? 'متابَع' : 'متابعة'}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Like / Dislike pill */}
              <div className="flex items-center overflow-hidden rounded-full" style={{ background: '#272727' }}>
                <button
                  onClick={handleLike}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:brightness-125"
                  style={{ color: liked ? '#54ab7d' : '#f1f1f1' }}
                >
                  <ThumbsUp size={17} fill={liked ? 'currentColor' : 'none'} />
                  {likeCount > 0 && <span>{formatPlayCount(likeCount)}</span>}
                </button>
                <div style={{ width: 1, height: 20, background: '#3d3d3d' }} />
                <button className="px-3 py-2 transition-colors hover:brightness-125" style={{ color: '#f1f1f1' }}>
                  <ThumbsDown size={17} />
                </button>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                style={{ background: '#272727', color: '#f1f1f1' }}
              >
                <Share2 size={17} />
                {copied ? 'تم!' : 'مشاركة'}
              </button>

              {user && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  style={{ background: '#272727', color: saved ? '#54ab7d' : '#f1f1f1' }}
                >
                  {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                  {saved ? 'محفوظ' : 'حفظ'}
                </button>
              )}

              {isOwner && (
                <Link
                  to={`/edit/${tape.id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  style={{ background: '#272727', color: '#f1f1f1' }}
                >
                  <Pencil size={17} />
                  تعديل
                </Link>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl p-4 sm:p-5 cursor-pointer" style={{ background: '#272727' }}
            onClick={() => tape.description && setDescExpanded((e) => !e)}
          >
            {tape.description && (
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: '#d7bd94' }}>
                <AudioLines size={16} /> حكاية الشريط
              </h2>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm mb-2" style={{ color: '#f1f1f1' }}>
              <span className="font-semibold">{formatPlayCount(tape.playCount)} مشاهدة</span>
              <span style={{ color: '#aaa' }}>{formatDate(tape.createdAt)}</span>
              <span
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: '#3d3d3d', color: '#f1f1f1' }}
              >
                {getCategoryLabel(tape.category)}
              </span>
              <span style={{ color: '#aaa' }}>{tape.trackCount} مقاطع</span>
            </div>
            {tape.description && (
              <>
                <p
                  className={`text-sm leading-relaxed ${!descExpanded ? 'line-clamp-2' : ''}`}
                  style={{ color: '#f1f1f1', whiteSpace: 'pre-line' }}
                >
                  {tape.description}
                </p>
                <button
                  className="text-sm font-bold mt-1 flex items-center gap-1"
                  style={{ color: '#f1f1f1' }}
                >
                  {descExpanded ? <><ChevronUp size={15} /> أقل</> : <><ChevronDown size={15} /> المزيد</>}
                </button>
              </>
            )}
          </div>

          {/* ── Track list ── */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#8b704b]/30 bg-gradient-to-br from-[#4c3b25] to-[#292117] text-[#e2c99e] shadow-inner">
                  <AudioLines size={20} />
                </span>
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold tracking-[0.18em] text-[#a88b60]">داخل الشريط</p>
                  <h2 className="text-lg font-bold text-[#f1ece2]">مكونات الشريط</h2>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#b8ad9c]">
                <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5">
                  {tapeTracks.length} {tapeTracks.length === 1 ? 'مقطع' : 'مقاطع'}
                </span>
                {knownDuration > 0 && (
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5">
                    المدة {formatTotalDuration(knownDuration)}
                  </span>
                )}
              </div>
            </div>
            <div className="cassette-side-controls" role="group" aria-label="اختر وجه الشريط">
              {tapeFaces.map((face, index) => (
                <button
                  type="button"
                  key={face.label}
                  onClick={() => setSelectedFaceIndex(index)}
                  aria-pressed={visibleFaceIndex === index}
                  className={`cassette-side-tab ${visibleFaceIndex === index ? 'cassette-side-tab-active' : ''}`}
                >
                  <span>{index === 0 ? 'أ' : 'ب'}</span>
                  {face.label}
                  <small>{face.tracks.length} {face.tracks.length === 1 ? 'مقطع' : 'مقاطع'}</small>
                </button>
              ))}
              {tapeFaces.length > 1 && (
                <button
                  type="button"
                  className="cassette-flip-button"
                  onClick={() => setSelectedFaceIndex((index) => (index + 1) % tapeFaces.length)}
                  aria-label="اقلب الشريط إلى الوجه الآخر"
                >
                  <span aria-hidden="true">↶</span>
                  اقلب الشريط
                </button>
              )}
            </div>
            {visibleFace && (
              <CassetteFace
                face={visibleFace}
                faceIndex={visibleFaceIndex}
                tapeTitle={tape.title}
                isCurrentTape={isCurrent}
                currentTrackIndex={currentTrackIndex}
                isPlaying={isPlaying}
                onTrackClick={handleTrackClick}
              />
            )}
            {tapeTracks.some((track) => track.sourceAttribution || (track.licenseUrl && track.licenseName)) && (
              <details className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                <summary className="cursor-pointer text-xs font-medium text-[#b8a58d] marker:text-[#d6b77c]">
                  مصادر التسجيلات والتراخيص
                </summary>
                <div className="mt-3 space-y-2">
                  {tapeTracks.map((track, index) => (
                    (track.sourceAttribution || (track.licenseUrl && track.licenseName)) && (
                      <div key={track.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                        <span className="text-[#e1d3bb]">{String(index + 1).padStart(2, '0')} · {track.title}</span>
                        {track.sourceAttribution && (track.sourceUrl
                          ? <a href={track.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#d7bd94] hover:text-[#f1d69d]">المصدر: {track.sourceAttribution}<ExternalLink size={10} /></a>
                          : <span className="text-[#b8a58d]">المصدر: {track.sourceAttribution}</span>)}
                        {track.licenseUrl && track.licenseName && (
                          <a href={track.licenseUrl} target="_blank" rel="noreferrer" className="text-[#a99c88] underline underline-offset-2 hover:text-[#e6d5b8]">{track.licenseName}</a>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </details>
            )}
          </div>

          {/* ── Comments ── */}
          <div className="mt-2">
            <h2 className="font-bold text-lg mb-4" style={{ color: '#f1f1f1' }}>
              {comments.length} تعليق
            </h2>

            {user ? (
              <form onSubmit={handleComment} className="flex items-start gap-3 mb-6">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden"
                  style={{ background: '#1d5b40' }}
                >
                  {user.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : user.username.charAt(0)
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="أضف تعليقًا..."
                    className="w-full bg-transparent py-1.5 text-sm outline-none"
                    style={{
                      borderBottom: '1px solid #303030',
                      color: '#f1f1f1',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#f1f1f1'; }}
                    onBlur={(e) => { e.currentTarget.style.borderBottomColor = '#303030'; }}
                  />
                  {comment && (
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setComment('')}
                        className="btn-yt-ghost text-sm"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-yt-secondary text-sm flex items-center gap-1.5"
                      >
                        <Send size={14} />
                        تعليق
                      </button>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-3 mb-6 text-sm transition-colors"
                style={{ color: '#aaa' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: '#272727' }}
                >
                  <UserPlus size={17} />
                </div>
                سجّل الدخول للتعليق
              </Link>
            )}

            <div className="space-y-5">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Link
                    to={`/user/${c.user.username}`}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden"
                    style={{ background: '#1d5b40' }}
                  >
                    {c.user.avatar
                      ? <img src={c.user.avatar} alt="" className="w-full h-full object-cover" />
                      : c.user.username.charAt(0)
                    }
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/user/${c.user.username}`}
                        className="text-sm font-semibold hover:text-white transition-colors"
                        style={{ color: '#f1f1f1' }}
                      >
                        {c.user.username}
                      </Link>
                      <span className="text-xs" style={{ color: '#717171' }}>
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#f1f1f1' }}>{c.content}</p>
                  </div>
                  {(user?.id === c.user.id || isOwner) && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ color: '#717171' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#717171'; }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════ SIDEBAR — related tapes ════════════════ */}
      <aside className="flex w-full shrink-0 flex-col gap-4 pt-1 lg:w-[360px] xl:w-[400px]">
        <p className="text-sm font-bold tracking-wide" style={{ color: '#f1f1f1' }}>الفيديوهات المقترحة</p>
        {related.length > 0 ? related.map((t) => (
          <TapeCard key={t.id} tape={t} layout="row" />
        )) : (
          <p className="rounded-xl border border-[#493a29] bg-[#211b15] p-4 text-sm text-[#b8a58d]">
            لا توجد أشرطة مقترحة الآن.
          </p>
        )}
      </aside>
    </div>
  );
}
