import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, GripVertical, Trash2, Link as LinkIcon,
  AlertCircle, CheckCircle, Loader2, Eye, EyeOff, ArrowLeft, ArrowRight, Sparkles, Library,
} from 'lucide-react';
import { api } from '../services/api';
import { CATEGORIES } from '../types';
import { AUDIO_LIBRARY, type AudioLibraryItem } from '../data/audioLibrary';
import { useAuthStore } from '../stores/authStore';

interface DraftTrack {
  id: string;
  title: string;
  url: string;
  curatorNote: string;
  coverImage: string | null;
  duration: number | null;
  validating: boolean;
  valid: boolean | null;
  message: string;
}

function SortableTrack({
  track, index, onRemove, onNoteChange,
}: { track: DraftTrack; index: number; onRemove: () => void; onNoteChange: (note: string) => void }) {
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
          <Library size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-yt-text">{track.title}</p>
          <p className="text-xs text-yt-muted">مقطع من مكتبة نقاء</p>
        </div>
        {track.validating && <Loader2 size={16} className="shrink-0 animate-spin text-yt-sub" />}
        {track.valid === true && <CheckCircle size={18} className="shrink-0 text-naqaa-400" />}
        {track.valid === false && <AlertCircle size={18} className="shrink-0 text-red-400" />}
        <button onClick={onRemove} className="shrink-0 p-1.5 text-yt-muted transition-colors hover:text-yt-red">
          <Trash2 size={18} />
        </button>
      </div>
      <label className="mt-3 block pr-10 text-xs text-yt-sub">
        حكاية هذا المقطع (اختياري)
        <input
          value={track.curatorNote}
          maxLength={300}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="ما الذي يجعل هذا المقطع مميزًا في الشريط؟"
          className="input-yt mt-1.5 py-2 text-xs"
        />
        <span className="mt-1 block text-left text-[10px] text-yt-muted">{track.curatorNote.length}/300</span>
      </label>
    </div>
  );
}

export default function CreateTapePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('misc');
  const [isPublic, setIsPublic] = useState(false);
  const [step, setStep] = useState(0);

  const [tracks, setTracks] = useState<DraftTrack[]>([]);
  const tracksRef = useRef<DraftTrack[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const updateTracks = (update: (current: DraftTrack[]) => DraftTrack[]) => {
    const nextTracks = update(tracksRef.current);
    tracksRef.current = nextTracks;
    setTracks(nextTracks);
  };

  const handleAddLibraryItem = (item: AudioLibraryItem) => {
    if (tracksRef.current.some((track) => track.url === item.audioUrl)) return;
    const track: DraftTrack = {
      id: crypto.randomUUID(),
      title: item.title,
      url: item.audioUrl,
      curatorNote: item.description,
      coverImage: null,
      duration: null,
      validating: false,
      valid: true,
      message: 'مصدر مفتوح مع بيانات الترخيص',
    };
    updateTracks((current) => [...current, track]);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      updateTracks((prev) => {
        const oi = prev.findIndex((t) => t.id === active.id);
        const ni = prev.findIndex((t) => t.id === over.id);
        return arrayMove(prev, oi, ni);
      });
    }
  };

  const handleSave = async () => {
    const currentTracks = tracksRef.current;
    if (!title.trim()) { setSaveError('يرجى إدخال اسم الشريط'); return; }
    if (currentTracks.length === 0) {
      setSaveError('اختار مقطعًا واحدًا على الأقل من المكتبة قبل حفظ الشريط.');
      return;
    }
    const validTracks = currentTracks.filter((track) => track.valid !== false);
    if (validTracks.length === 0) {
      setSaveError('تعذر إضافة المقطع. أعد اختياره من المكتبة.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const { tape } = await api.createTape({
        title, description,
        category, isPublic,
        tracks: validTracks.map((t) => ({
          title: t.title, url: t.url,
          curatorNote: t.curatorNote,
          ...(() => {
            const libraryItem = AUDIO_LIBRARY.find((item) => item.audioUrl === t.url);
            return libraryItem ? {
              sourceAttribution: libraryItem.creator,
              sourceUrl: libraryItem.sourceUrl,
              licenseName: libraryItem.licenseName,
              licenseUrl: libraryItem.licenseUrl,
            } : {};
          })(),
          coverImage: t.coverImage || undefined, duration: t.duration || undefined,
        })),
      });
      navigate(`/tape/${tape.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'حدث خطأ');
    }
    setSaving(false);
  };

  const handleContinue = () => {
    setSaveError('');
    if (step === 0 && !title.trim()) {
      setSaveError('ابدأ باسم يعبّر عن حكاية الشريط.');
      return;
    }
    if (step === 1) {
      if (tracksRef.current.length === 0) {
        setSaveError('أضف مقطعًا واحدًا على الأقل عشان نبني رحلة الاستماع.');
        return;
      }
      if (tracksRef.current.some((track) => track.validating)) {
        setSaveError('استنى لحد ما نتحقق من روابط المقاطع.');
        return;
      }
      if (tracksRef.current.every((track) => track.valid === false)) {
        setSaveError('كل الروابط غير صالحة. راجعها أو احذفها قبل ما تكمل.');
        return;
      }
    }
    setStep((current) => Math.min(current + 1, 2));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="text-yt-sub mb-4">سجّل الدخول لإنشاء شريط</p>
        <button onClick={() => navigate('/login')} className="btn-yt-primary px-6 py-2.5">تسجيل الدخول</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-[#805536]">مختبر الأشرطة · إصدارك يبدأ من هنا</p>
        <h1 className="mt-1 text-2xl font-bold text-yt-text sm:text-3xl">ركّب شريطًا له حكاية</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-yt-sub">
          مش مجرد روابط: اختار الفكرة، رتّب رحلة السماع، واحكِ للمستمع لماذا تستحق هذه الأصوات أن تُجمع.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-2" aria-label="خطوات إنشاء الشريط">
        {[
          { title: 'الفكرة', hint: 'ابدأ بالحكاية' },
          { title: 'الرحلة', hint: 'رتّب الأصوات' },
          { title: 'الغلاف والنشر', hint: 'قدّمه للعالم' },
        ].map((item, index) => (
          <button
            key={item.title}
            type="button"
            disabled={index > step}
            onClick={() => { setStep(index); setSaveError(''); }}
            className={`rounded-xl border p-3 text-right transition-colors sm:flex sm:items-center sm:gap-3 ${
              index === step ? 'border-[#a76e45] bg-[#fffaf0] shadow-sm' :
              index < step ? 'border-yt-border bg-yt-card text-yt-text' : 'border-yt-border bg-yt-hover text-yt-muted'
            }`}
          >
            <span className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:mb-0 ${
              index === step ? 'bg-[#805536] text-white' : index < step ? 'bg-naqaa-100 text-naqaa-800' : 'bg-white/70'
            }`}>{index + 1}</span>
            <span>
              <span className="block text-xs font-bold sm:text-sm">{item.title}</span>
              <span className="hidden text-[11px] text-yt-muted sm:block">{item.hint}</span>
            </span>
          </button>
        ))}
      </div>

      {saveError && (
        <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} /> {saveError}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          {step === 0 && (
            <section className="space-y-5 rounded-2xl border border-yt-border bg-yt-card p-5 sm:p-7">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#805536]">١ · الشرارة</span>
                <h2 className="mt-2 text-xl font-bold text-yt-text">إيه الحكاية اللي عايز تحكيها؟</h2>
                <p className="mt-1 text-sm text-yt-sub">ابدأ بإحساس أو لحظة، مش باسم تصنيف.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-yt-sub">اسم الشريط *</label>
                <input autoFocus type="text" maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)}
                  placeholder="مثال: صوت آخر الليل" className="input-yt text-lg" />
                <p className="mt-1 text-left text-xs text-yt-muted">{title.length}/80</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-yt-sub">حكاية الشريط</label>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={5}
                  placeholder="احكي للمستمع: من أين تبدأ الرحلة؟ ما الرابط بين المقاطع؟ وبأي إحساس تحب أن تنتهي؟"
                  className="input-yt resize-y leading-relaxed" />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-yt-muted">مش لازم تكون طويلة؛ جملتين صادقتين كفاية.</span>
                  <span className="text-xs text-yt-muted">{description.length}/1000</span>
                </div>
              </div>
              <div className="rounded-xl border border-[#e5d4b8] bg-[#fbf4e8] p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold text-[#805536]"><Sparkles size={15} /> أسئلة تساعدك تبدأ</p>
                <div className="flex flex-wrap gap-2">
                  {['إمتى تسمع الشريط ده؟', 'إيه الخيط اللي بيربط المقاطع؟', 'عايز المستمع يحس بإيه في النهاية؟'].map((prompt) => (
                    <span key={prompt} className="rounded-full bg-white/80 px-3 py-1.5 text-xs text-[#684d31]">{prompt}</span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end border-t border-yt-border pt-4">
                <button type="button" onClick={handleContinue} className="btn-yt-primary px-5 py-2.5">
                  نبدأ اختيار المقاطع <ArrowLeft size={17} />
                </button>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-5 rounded-2xl border border-yt-border bg-yt-card p-5 sm:p-7">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#805536]">٢ · ترتيب الرحلة</span>
                <h2 className="mt-2 text-xl font-bold text-yt-text">كل مقطع له مكان وسبب</h2>
                <p className="mt-1 text-sm text-yt-sub">رتّب المقاطع كأنك ترتّب مشاهد: بداية تشد، وسط يكتشف، ونهاية تفضل في الذاكرة.</p>
              </div>
              <div className="rounded-xl border border-yt-border bg-[#fffdf8] p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-yt-text">
                      <Library size={17} className="text-[#805536]" /> مكتبة نقاء الصوتية
                    </h3>
                    <p className="mt-1 text-xs text-yt-sub">تسجيلات عربية مفتوحة مع المصدر والترخيص محفوظين تلقائيًا.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#f2e7d4] px-2.5 py-1 text-[10px] font-semibold text-[#684d31]">
                    {AUDIO_LIBRARY.length} مواد
                  </span>
                </div>
                <div className="space-y-3">
                  {AUDIO_LIBRARY.map((item) => (
                    <article key={item.id} className="rounded-xl border border-yt-border bg-white p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-semibold text-[#805536]">{item.collection}</span>
                          <h4 className="mt-0.5 font-semibold text-yt-text">{item.title}</h4>
                          <p className="mt-1 text-xs leading-relaxed text-yt-sub">{item.description}</p>
                          <p className="mt-1 text-[10px] text-yt-muted">التسجيل: {item.creator}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddLibraryItem(item)}
                          disabled={tracks.some((track) => track.url === item.audioUrl)}
                          className="btn-yt-secondary shrink-0 px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          {tracks.some((track) => track.url === item.audioUrl) ? <CheckCircle size={14} /> : <Plus size={14} />}
                          {tracks.some((track) => track.url === item.audioUrl) ? 'أُضيف' : 'أضف للشريط'}
                        </button>
                      </div>
                      <audio controls preload="none" src={item.audioUrl} className="mt-3 w-full" style={{ display: 'block', height: 34 }}>
                        المتصفح لا يدعم معاينة الصوت.
                      </audio>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-[#805536] underline underline-offset-2">
                          صفحة المصدر على Commons
                        </a>
                        <a href={item.licenseUrl} target="_blank" rel="noreferrer" className="text-yt-sub underline underline-offset-2">
                          {item.licenseName}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
                  رفّ تجريبي من مقالات صوتية تاريخية، وليس مكتبة تلاوات أو أناشيد. راجع صفحة كل مادة وشروط النسب قبل إعادة الاستخدام؛ ترخيص المصدر ليس ضمانًا قانونيًا من نقاء.
                </p>
              </div>

              <div className="rounded-xl border border-yt-border bg-[#fffdf8] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-yt-text">مقاطع شريطك</h3>
                  {tracks.length > 0 && <span className="rounded-full bg-yt-hover px-2.5 py-1 text-xs text-yt-sub">{tracks.length} مقاطع</span>}
                </div>
                <p className="text-xs leading-relaxed text-yt-sub">
                  اختار مقطعًا من المكتبة بالأعلى، اسمعه قبل الإضافة، وبعدها رتّب المقاطع واكتب حكاية كل مقطع لو تحب.
                </p>
              </div>

              {tracks.length > 0 ? (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-yt-text">ترتيب الاستماع</h3>
                    <span className="text-xs text-yt-muted">اسحب المقبض لتغيير الترتيب</span>
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={tracks.map((track) => track.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {tracks.map((track, index) => (
                          <SortableTrack
                            key={track.id}
                            track={track}
                            index={index}
                            onRemove={() => updateTracks((current) => current.filter((item) => item.id !== track.id))}
                            onNoteChange={(curatorNote) => updateTracks((current) => current.map((item) => item.id === track.id ? { ...item, curatorNote } : item))}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-yt-line px-5 py-8 text-center">
                  <LinkIcon size={24} className="mx-auto text-yt-muted" />
                  <p className="mt-2 text-sm font-semibold text-yt-text">الشريط لسه فاضي</p>
                  <p className="mt-1 text-xs text-yt-sub">جرّب معاينة مقطع من المكتبة واضغط «أضف للشريط».</p>
                </div>
              )}
              <div className="flex justify-between border-t border-yt-border pt-4">
                <button type="button" onClick={() => { setStep(0); setSaveError(''); }} className="btn-yt-secondary px-4 py-2.5">
                  <ArrowRight size={17} /> رجوع للفكرة
                </button>
                <button type="button" onClick={handleContinue} className="btn-yt-primary px-5 py-2.5">
                  جهّز الغلاف <ArrowLeft size={17} />
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5 rounded-2xl border border-yt-border bg-yt-card p-5 sm:p-7">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#805536]">٣ · الإصدار</span>
                <h2 className="mt-2 text-xl font-bold text-yt-text">خلّي للشريط وجه وصوت</h2>
                <p className="mt-1 text-sm text-yt-sub">اختار الغلاف والتصنيف، وراجع كيف هيظهر قبل النشر.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-yt-sub">غلاف كاسيت بطابع قديم</p>
                <p className="mt-1 text-xs text-yt-muted">جهزناه لك تلقائيًا — ركّز على حكاية الشريط ومقاطعه.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-yt-sub">التصنيف</label>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="input-yt">
                  {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => setIsPublic((value) => !value)}
                className="flex w-full items-center gap-4 rounded-xl border border-yt-border bg-yt-bg p-4 text-right transition-colors hover:border-yt-line">
                <span className={`flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isPublic ? 'bg-naqaa-600' : 'bg-yt-line'}`}>
                  <span className={`mx-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-5' : ''}`} />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-yt-text">
                    {isPublic ? <Eye size={15} /> : <EyeOff size={15} />}
                    {isPublic ? 'انشر الشريط للجميع' : 'احتفظ به خاصًا'}
                  </span>
                  <span className="mt-1 block text-xs text-yt-sub">{isPublic ? 'سيظهر للناس في صفحة اكتشاف الأشرطة.' : 'تقدر تراجعه وتعدّله قبل ما تخليه عامًا.'}</span>
                </span>
              </button>
              <div className="rounded-xl border border-[#e5d4b8] bg-[#fbf4e8] p-4">
                <p className="mb-2 text-sm font-bold text-[#684d31]">مراجعة الإصدار</p>
                <ul className="space-y-1.5 text-xs text-[#684d31]">
                  <li>{title.trim() ? '✓' : '○'} اسم الشريط</li>
                  <li>{tracks.length} مقاطع مرتبة {tracks.some((track) => track.curatorNote.trim()) ? 'مع حكايات لبعض المقاطع' : '— أضف حكاية لمقطع لو تحب'}</li>
                  <li>{description.trim() ? '✓ حكاية الشريط مكتوبة' : '○ لم تضف حكاية الشريط بعد'}</li>
                  <li>{isPublic ? 'سيُنشر الشريط للعامة' : 'سيُحفظ الشريط كخاص'}</li>
                </ul>
              </div>
              <div className="flex justify-between border-t border-yt-border pt-4">
                <button type="button" onClick={() => { setStep(1); setSaveError(''); }} className="btn-yt-secondary px-4 py-2.5">
                  <ArrowRight size={17} /> رجوع للمقاطع
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="btn-yt-primary px-5 py-2.5 disabled:opacity-50">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={17} />}
                  {saving ? 'جارٍ تجهيز الشريط...' : isPublic ? 'انشر حكايتي' : 'احفظ كمسودة خاصة'}
                </button>
              </div>
            </section>
          )}
        </main>

        <aside className="sticky top-20 hidden space-y-4 lg:block">
          <section className="overflow-hidden rounded-2xl border border-yt-border bg-[#fffaf0] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-[#805536]">معاينة الشريط</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isPublic ? 'bg-green-100 text-green-800' : 'bg-yt-hover text-yt-sub'}`}>
                {isPublic ? 'عام' : 'خاص'}
              </span>
            </div>
            <div className="relative aspect-[1.55] overflow-hidden rounded-xl border-[5px] border-[#d1b992] bg-[#e8d5b3] p-3 shadow-inner">
              <div className="absolute inset-x-2 top-2 h-1/3 rounded bg-[#b46e4c]" />
              <div className="absolute inset-x-3 bottom-3 top-[44%] rounded bg-[#544437]">
                <div className="flex h-full items-center justify-around">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-[5px] border-[#ddc69f] bg-[#806a4d]">
                    <span className="h-3 w-3 rounded-full bg-[#ddc69f]" />
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-[5px] border-[#ddc69f] bg-[#806a4d]">
                    <span className="h-3 w-3 rounded-full bg-[#ddc69f]" />
                  </span>
                </div>
              </div>
              <span className="absolute inset-x-4 top-[18%] z-10 truncate text-center text-[10px] font-bold text-white drop-shadow sm:text-xs">
                {title || 'اسم حكايتك هنا'}
              </span>
            </div>
            <h3 className="mt-3 truncate font-bold text-yt-text">{title || 'شريط جديد بلا عنوان'}</h3>
            <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-relaxed text-yt-sub">{description || 'اكتب حكاية الشريط عشان المستمع يعرف الرحلة اللي مستنياه.'}</p>
            <div className="mt-3 flex items-center justify-between border-t border-yt-border pt-3 text-xs text-yt-sub">
              <span>{CATEGORIES.find((item) => item.value === category)?.label}</span>
              <span>{tracks.length} مقاطع</span>
            </div>
          </section>
          <div className="rounded-xl border border-yt-border bg-yt-card p-4 text-xs leading-relaxed text-yt-sub">
            <p className="font-bold text-yt-text">فكرة نقاء</p>
            <p className="mt-1">الروابط متاحة في كل مكان. اختيارك، ترتيبك، وحكايتك هي اللي بتخلي الشريط بتاعك مختلف.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
