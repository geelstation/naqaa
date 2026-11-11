export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return 'غير معروف';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs} س ${mins} د`;
  }
  if (mins > 0) {
    return `${mins} د ${secs > 0 ? `${secs} ث` : ''}`;
  }
  return `${secs} ث`;
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatPlayCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  if (days < 365) return `قبل ${Math.floor(days / 30)} أشهر`;
  return `قبل ${Math.floor(days / 365)} سنوات`;
}

export function formatTotalDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs} ساعة ${mins > 0 ? `${mins} دقيقة` : ''}`;
  if (mins > 0) return `${mins} دقيقة`;
  return `${Math.floor(seconds)} ثانية`;
}
