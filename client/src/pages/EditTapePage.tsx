import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, GripVertical, Trash2, Link as LinkIcon,
  AlertCircle, Loader2, Save, Eye, EyeOff, ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { CATEGORIES } from '../types';
import type { TapeWithDetails, Track } from '../types';
import { useAuthStore } from '../stores/authStore';

function SortableTrackItem({
  track, index, onRemove, onNoteChange, onNoteSave,
}: {
  track: Track;
  index: number;
  onRemove: () => void;
  onNoteChange: (note: string) => void;
  onNoteSave: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="rounded-xl border border-yt-border bg-yt-hover p-3 transition-colors hover:border-yt-line"
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab p-1 text-yt-muted hover:text-yt-text active:cursor-grabbing">
          <GripVertical size={20} />
        </button>
        <span className="w-6 shrink-0 text-center text-sm font-bold text-yt-muted">{index + 1}</span>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yt-card text-yt-muted">
          <LinkIcon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-yt-text">{track.title}</p>
          <p className="truncate text-xs text-yt-muted" dir="ltr">{track.url}</p>
        </div>
        <button onClick={onRemove} className="shrink-0 p-1.5 text-yt-muted transition-colors hover:text-yt-red">
          <Trash2 size={18} />
        </button>
      </div>
      <label className="mt-3 block pr-10 text-xs text-yt-sub">
        حكاية هذا المقطع (اختياري)
        <input
          value={track.curatorNote || ''}
          maxLength={300}
          onChange={(event) => onNoteChange(event.target.value)}
          onBlur={onNoteSave}
          placeholder="ما الذي يجعل هذا المقطع مميزًا في الشريط؟"
          className="input-yt mt-1.5 py-2 text-xs"
        />
      </label>
    </div>
  );
}

export default function EditTapePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [tape, setTape] = useState<TapeWithDetails | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('misc');
  const [isPublic, setIsPublic] = useState(false);

  const [trackUrl, setTrackUrl] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [trackNote, setTrackNote] = useState('');
  const [adding, setAdding] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (!id) return;
    api.getTape(id).then((res) => {
      if (res.tape.creatorId !== user?.id) { navigate(`/tape/${id}`); return; }
      setTape(res.tape);
      setTitle(res.tape.title);
      setDescription(res.tape.description || '');
      setCoverImage(res.tape.coverImage || '');
      setCategory(res.tape.category);
      setIsPublic(res.tape.isPublic);
      setTracks(res.tape.tracks || []);
    }).catch(() => setError('تعذر تحميل الشريط')).finally(() => setLoading(false));
  }, [id, user, navigate]);

  const handleAddTrack = async () => {
    if (!trackUrl.trim() || !id) return;
    setAdding(true);
    setError('');
    try {
      const { track } = await api.addTrack(id, {
        title: trackTitle.trim() || undefined,
        url: trackUrl.trim(),
        curatorNote: trackNote.trim(),
      });
      setTracks((prev) => [...prev, track]);
      setTrackUrl('');
      setTrackTitle('');
      setTrackNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إضافة المقطع');
    }
    setAdding(false);
  };

  const handleTrackNoteChange = (trackId: string, curatorNote: string) => {
    setTracks((current) => current.map((track) => track.id === trackId ? { ...track, curatorNote } : track));
  };

  const saveTrackNote = async (track: Track) => {
    if (!id) return;
    setError('');
    try {
      await api.updateTrack(id, track.id, { curatorNote: track.curatorNote || '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ حكاية المقطع');
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!id) return;
    const removed = tracks.find((t) => t.id === trackId);
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    try { await api.deleteTrack(id, trackId); }
    catch { if (removed) setTracks((prev) => [...prev, removed]); }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setTracks((prev) => {
        const oi = prev.findIndex((t) => t.id === active.id);
        const ni = prev.findIndex((t) => t.id === over.id);
        const reordered = arrayMove(prev, oi, ni);
        if (id) api.reorderTracks(id, reordered.map((t) => t.id)).catch(() => {});
        return reordered;
      });
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      await api.updateTape(id, { title, description, coverImage, category, isPublic });
      navigate(`/tape/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-naqaa-400" />
    </div>
  );

  if (!tape) return (
    <div className="text-center py-20">
      <p className="text-yt-sub">{error || 'الشريط غير موجود'}</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
      <button onClick={() => navigate(`/tape/${id}`)} className="btn-yt-ghost mb-5 gap-2">
        <ArrowRight size={18} />
        العودة للشريط
      </button>

      <h1 className="text-yt-text text-2xl font-bold mb-6">تعديل الشريط</h1>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-red-500/10 text-red-400 text-sm">
          <AlertCircle size={16} />{error}
        </div>
      )}

      <div className="bg-yt-card border border-yt-border rounded-2xl p-6 space-y-5 mb-5">
        <div>
          <label className="block text-sm text-yt-sub mb-2">اسم الشريط</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-yt" />
        </div>
        <div>
          <label className="block text-sm text-yt-sub mb-2">حكاية الشريط ووصفه</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={4} className="input-yt resize-y" placeholder="ما فكرة هذا الشريط؟ ولماذا جمعت هذه المقاطع بهذا الترتيب؟" />
          <p className="mt-1 text-xs text-yt-muted">الحكاية والسياق هما ما يحوّل الروابط إلى تجربة استماع لها معنى.</p>
        </div>
        <div className="rounded-xl border border-yt-border bg-yt-bg p-4">
          <p className="text-sm font-semibold text-yt-sub">غلاف الشريط</p>
          {coverImage ? (
            <div className="mt-3 flex items-center gap-3">
              <img src={coverImage} alt="" className="h-16 w-24 rounded-lg object-cover" />
              <div>
                <p className="text-xs text-yt-sub">الغلاف الحالي</p>
                <button type="button" onClick={() => setCoverImage('')} className="mt-1 text-xs font-semibold text-[#805536] underline underline-offset-2">
                  استخدم غلاف الكاسيت التلقائي
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-xs text-yt-muted">غلاف كاسيت بطابع قديم جاهز تلقائيًا — لا تحتاج لإضافة صورة أو رابط.</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-yt-sub mb-2">التصنيف</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-yt">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <button onClick={() => setIsPublic(!isPublic)} className="flex items-center gap-4 w-full p-4 rounded-xl bg-yt-bg border border-yt-border hover:border-yt-line transition-colors text-right">
          <div className={`w-11 h-6 rounded-full flex items-center transition-colors shrink-0 ${isPublic ? 'bg-naqaa-600' : 'bg-yt-line'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-yt-text flex items-center gap-2">
              {isPublic ? <Eye size={15} /> : <EyeOff size={15} />}
              {isPublic ? 'عام' : 'خاص'}
            </p>
          </div>
        </button>
      </div>

      <div className="bg-yt-card border border-yt-border rounded-2xl p-6 mb-5">
        <h2 className="text-yt-text font-semibold mb-4">إضافة مقطع أو فيديو يوتيوب</h2>
        <div className="space-y-3">
          <input type="url" value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !adding && handleAddTrack()}
            placeholder="الصق رابط يوتيوب أو رابط صوت مباشر" className="input-yt" dir="ltr" />
          <input type="text" value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)}
            placeholder="عنوان المقطع (اختياري)" className="input-yt" />
          <label className="block text-sm text-yt-sub">
            لماذا اخترت هذا المقطع؟ <span className="text-yt-muted">(اختياري)</span>
            <input type="text" value={trackNote} maxLength={300} onChange={(e) => setTrackNote(e.target.value)}
              placeholder="سياق المقطع أو سبب اختياره..." className="input-yt mt-1.5" />
          </label>
          <button onClick={handleAddTrack} disabled={adding || !trackUrl.trim()} className="btn-yt-secondary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-40">
            {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            إضافة المقطع
          </button>
          <p className="text-xs text-yt-muted text-center">أضف مصادر تملك حق استخدامها أو تضمينها، واكتب سياق كل مقطع ليعرف المستمع قصته.</p>
        </div>
      </div>

      {tracks.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-yt-text font-semibold">المقاطع ({tracks.length})</h2>
            <span className="text-xs text-yt-muted">اسحب للترتيب</span>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {tracks.map((track, i) => (
                  <SortableTrackItem
                    key={track.id}
                    track={track}
                    index={i}
                    onRemove={() => handleRemoveTrack(track.id)}
                    onNoteChange={(note) => handleTrackNoteChange(track.id, note)}
                    onNoteSave={() => saveTrackNote(track)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="w-full bg-naqaa-700 hover:bg-naqaa-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
      </button>
    </div>
  );
}
