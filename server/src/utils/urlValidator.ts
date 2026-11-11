// Validates audio URLs and extracts basic metadata
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm', '.opus'];

export interface ValidationResult {
  valid: boolean;
  type: 'direct-audio' | 'embeddable' | 'unknown';
  message: string;
  title?: string;
  coverImage?: string;
}

export function validateAudioUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, type: 'unknown', message: 'الرابط فارغ' };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { valid: false, type: 'unknown', message: 'الرابط غير صالح' };
  }

  const pathname = parsedUrl.pathname.toLowerCase();

  // Check for direct audio file
  const isDirectAudio = AUDIO_EXTENSIONS.some((ext) => pathname.endsWith(ext));

  if (isDirectAudio) {
    // Extract a title from the filename
    const filename = pathname.split('/').pop() || 'مقطع صوتي';
    const title = decodeURIComponent(filename.replace(/\.[^.]+$/, '')).replace(/[-_]/g, ' ');
    return {
      valid: true,
      type: 'direct-audio',
      message: 'ملف صوتي مباشر',
      title: title || 'مقطع صوتي',
    };
  }

  // Check for known embeddable sources
  const host = parsedUrl.hostname.replace('www.', '');

  if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)) {
    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    const videoId = host === 'youtu.be'
      ? segments[0]
      : parsedUrl.searchParams.get('v') ||
        (['embed', 'shorts', 'live', 'v'].includes(segments[0] || '') ? segments[1] : null);

    if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
      return { valid: false, type: 'unknown', message: 'رابط يوتيوب غير صالح أو لا يحتوي على فيديو' };
    }

    return {
      valid: true,
      type: 'embeddable',
      message: 'فيديو يوتيوب',
      title: 'فيديو يوتيوب',
    };
  }

  if (host === 'soundcloud.com' || host.endsWith('.soundcloud.com')) {
    return {
      valid: true,
      type: 'embeddable',
      message: 'رابط SoundCloud — يتطلب واجهة التضمين الرسمية',
    };
  }

  if (host === 'archive.org' || host.endsWith('.archive.org')) {
    // Archive.org often hosts direct audio
    return {
      valid: true,
      type: 'direct-audio',
      message: 'رابط من أرشيف الإنترنت',
    };
  }

  // For other URLs, we can't guarantee they're playable
  // but we allow the user to add them with a warning
  return {
    valid: true,
    type: 'unknown',
    message: 'لا يمكن التحقق من هذا المصدر تلقائيًا. تأكد من أنه رابط صوتي مباشر.',
  };
}

export function isPlayableUrl(url: string): boolean {
  const result = validateAudioUrl(url);
  return result.valid && (result.type === 'direct-audio' || result.type === 'embeddable');
}
