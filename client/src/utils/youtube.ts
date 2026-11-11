export function getYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (!['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      return null;
    }

    const segments = url.pathname.split('/').filter(Boolean);
    const id = url.searchParams.get('v') ||
      (['embed', 'shorts', 'live', 'v'].includes(segments[0] || '') ? segments[1] : null);
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
