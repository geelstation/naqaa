import express, { Router } from 'express';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import db from '../db/database.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { validateAudioUrl } from '../utils/urlValidator.js';
import { toPublicUser, type AuthRequest, type TapeWithDetails, type User, type Tape, type Track } from '../types.js';

const router = Router();
const uploadsDirectory = join(dirname(fileURLToPath(import.meta.url)), '../../uploads');
const audioExtensions = new Set(['aac', 'flac', 'm4a', 'mp3', 'oga', 'ogg', 'wav', 'webm']);

function hasAudioSignature(extension: string, data: Buffer): boolean {
  switch (extension) {
    case 'mp3':
      return data.subarray(0, 3).toString() === 'ID3' ||
        (data.length > 1 && data[0] === 0xff && (data[1] & 0xe0) === 0xe0);
    case 'wav':
      return data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WAVE';
    case 'ogg':
    case 'oga':
      return data.subarray(0, 4).toString() === 'OggS';
    case 'flac':
      return data.subarray(0, 4).toString() === 'fLaC';
    case 'm4a':
      return data.subarray(4, 8).toString() === 'ftyp';
    case 'aac':
      return data.length > 1 && data[0] === 0xff && (data[1] & 0xf6) === 0xf0;
    case 'webm':
      return data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    default:
      return false;
  }
}

function getTapeWithDetails(tape: Tape, includeTracks = true, currentUserId?: string): TapeWithDetails {
  const creator = db.read((d) => d.users.find((u) => u.id === tape.creatorId));

  let tracks: Track[] = [];
  let trackCount = 0;
  let totalDuration = 0;

  if (includeTracks) {
    tracks = db.read((d) =>
      d.tracks
        .filter((t) => t.tapeId === tape.id)
        .sort((a, b) => a.position - b.position)
    );
    trackCount = tracks.length;
    totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  } else {
    const tapeTracks = db.read((d) => d.tracks.filter((t) => t.tapeId === tape.id));
    trackCount = tapeTracks.length;
    totalDuration = tapeTracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  }

  // Social counts
  const likes = db.read((d) => d.likes.filter((l) => l.tapeId === tape.id));
  const comments = db.read((d) => d.comments.filter((c) => c.tapeId === tape.id));
  const isFollowing = currentUserId
    ? db.read((d) => d.follows.some((f) => f.followerId === currentUserId && f.followingId === tape.creatorId))
    : false;

  return {
    ...tape,
    creator: creator ? toPublicUser(creator) : undefined,
    tracks: includeTracks ? tracks : undefined,
    trackCount,
    totalDuration,
    likeCount: likes.length,
    commentCount: comments.length,
    isLiked: currentUserId ? likes.some((l) => l.userId === currentUserId) : false,
    isFollowingCreator: isFollowing,
  };
}

// List public tapes
router.get('/', optionalAuth, (req: AuthRequest, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const category = req.query.category as string;

  let tapes = db.read((d) => d.tapes.filter((t) => t.isPublic));

  if (category && category !== 'all') {
    tapes = tapes.filter((t) => t.category === category);
  }

  tapes = tapes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(offset, offset + limit);

  res.json({ tapes: tapes.map((t) => getTapeWithDetails(t, false, req.user?.id)) });
});

// Trending tapes
router.get('/trending', optionalAuth, (req: AuthRequest, res) => {
  const tapes = db.read((d) =>
    d.tapes
      .filter((t) => t.isPublic)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 12)
  );
  res.json({ tapes: tapes.map((t) => getTapeWithDetails(t, false, req.user?.id)) });
});

// Recent tapes
router.get('/recent', optionalAuth, (req: AuthRequest, res) => {
  const tapes = db.read((d) =>
    d.tapes
      .filter((t) => t.isPublic)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12)
  );
  res.json({ tapes: tapes.map((t) => getTapeWithDetails(t, false, req.user?.id)) });
});

// Search tapes
router.get('/search', optionalAuth, (req: AuthRequest, res) => {
  const q = (req.query.q as string || '').trim().toLowerCase();
  const category = req.query.category as string;

  let tapes = db.read((d) => {
    let results = d.tapes.filter((t) => t.isPublic);

    if (q) {
      results = results.filter((t) => {
        const creator = d.users.find((u) => u.id === t.creatorId);
        return (
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (creator?.username || '').toLowerCase().includes(q)
        );
      });
    }

    if (category && category !== 'all') {
      results = results.filter((t) => t.category === category);
    }

    return results.sort((a, b) => b.playCount - a.playCount);
  });

  res.json({ tapes: tapes.map((t) => getTapeWithDetails(t, false, req.user?.id)) });
});

// Get tapes by user
router.get('/user/:username', optionalAuth, (req: AuthRequest, res) => {
  const user = db.read((d) => d.users.find((u) => u.username === req.params.username));
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  const tapes = db.read((d) =>
    d.tapes
      .filter((t) => t.creatorId === user.id && t.isPublic)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );

  res.json({
    user: toPublicUser(user),
    tapes: tapes.map((t) => getTapeWithDetails(t, false, req.user?.id)),
  });
});

// Get single tape
router.get('/:id', optionalAuth, (req: AuthRequest, res) => {
  const tape = db.read((d) => d.tapes.find((t) => t.id === req.params.id));
  if (!tape) {
    return res.status(404).json({ error: 'الشريط غير موجود' });
  }

  if (!tape.isPublic && tape.creatorId !== req.user?.id) {
    return res.status(403).json({ error: 'هذا الشريط خاص' });
  }

  res.json({ tape: getTapeWithDetails(tape, true, req.user?.id) });
});

// Create tape
router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { title, description, coverImage, category, isPublic, tracks } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال اسم الشريط' });
  }

  const now = new Date().toISOString();
  const tapeId = nanoid(12);

  const newTape: Tape = {
    id: tapeId,
    title: title.trim(),
    description: description?.trim() || null,
    coverImage: coverImage || null,
    category: category || 'misc',
    isPublic: Boolean(isPublic),
    creatorId: req.user!.id,
    playCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  db.write((d) => {
    d.tapes.push(newTape);

    if (Array.isArray(tracks)) {
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const newTrack: Track = {
          id: nanoid(12),
          tapeId: tapeId,
          title: track.title || 'مقطع صوتي',
          curatorNote: typeof track.curatorNote === 'string' ? track.curatorNote.trim().slice(0, 300) || null : null,
          sourceAttribution: typeof track.sourceAttribution === 'string' ? track.sourceAttribution.trim().slice(0, 500) || null : null,
          sourceUrl: typeof track.sourceUrl === 'string' ? track.sourceUrl.trim().slice(0, 2000) || null : null,
          licenseName: typeof track.licenseName === 'string' ? track.licenseName.trim().slice(0, 100) || null : null,
          licenseUrl: typeof track.licenseUrl === 'string' ? track.licenseUrl.trim().slice(0, 2000) || null : null,
          url: track.url,
          coverImage: track.coverImage || null,
          duration: track.duration || null,
          position: i,
          createdAt: now,
        };
        d.tracks.push(newTrack);
      }
    }
  });

  res.status(201).json({ tape: getTapeWithDetails(newTape, true) });
});

// Update tape
router.put('/:id', authMiddleware, (req: AuthRequest, res) => {
  const tape = db.read((d) => d.tapes.find((t) => t.id === req.params.id));
  if (!tape) {
    return res.status(404).json({ error: 'الشريط غير موجود' });
  }
  if (tape.creatorId !== req.user!.id) {
    return res.status(403).json({ error: 'لا تملك صلاحية تعديل هذا الشريط' });
  }

  const { title, description, coverImage, category, isPublic } = req.body;

  db.write((d) => {
    const t = d.tapes.find((t) => t.id === req.params.id)!;
    if (title !== undefined) t.title = title.trim();
    if (description !== undefined) t.description = description.trim() || null;
    if (coverImage !== undefined) t.coverImage = coverImage;
    if (category !== undefined) t.category = category;
    if (isPublic !== undefined) t.isPublic = Boolean(isPublic);
    t.updatedAt = new Date().toISOString();
  });

  const updated = db.read((d) => d.tapes.find((t) => t.id === req.params.id))!;
  res.json({ tape: getTapeWithDetails(updated, true) });
});

// Delete tape
router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  const tape = db.read((d) => d.tapes.find((t) => t.id === req.params.id));
  if (!tape) {
    return res.status(404).json({ error: 'الشريط غير موجود' });
  }
  if (tape.creatorId !== req.user!.id) {
    return res.status(403).json({ error: 'لا تملك صلاحية حذف هذا الشريط' });
  }

  db.write((d) => {
    d.tapes = d.tapes.filter((t) => t.id !== req.params.id);
    d.tracks = d.tracks.filter((t) => t.tapeId !== req.params.id);
    d.library = d.library.filter((l) => l.tapeId !== req.params.id);
    d.listenHistory = d.listenHistory.filter((h) => h.tapeId !== req.params.id);
  });

  res.json({ success: true });
});

// Add track to tape
router.post('/:id/tracks', authMiddleware, (req: AuthRequest, res) => {
  const tape = db.read((d) => d.tapes.find((t) => t.id === req.params.id));
  if (!tape) {
    return res.status(404).json({ error: 'الشريط غير موجود' });
  }
  if (tape.creatorId !== req.user!.id) {
    return res.status(403).json({ error: 'لا تملك صلاحية تعديل هذا الشريط' });
  }

  const { title, url, coverImage, duration, curatorNote, sourceAttribution, sourceUrl, licenseName, licenseUrl } = req.body;
  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال رابط المقطع' });
  }

  const uploadedFile = /^\/uploads\/[a-z0-9_-]+\.(aac|flac|m4a|mp3|oga|ogg|wav|webm)$/i.test(url.trim()) &&
    existsSync(join(uploadsDirectory, url.trim().split('/').pop()!));
  const validation = uploadedFile
    ? { valid: true, type: 'direct-audio' as const, message: '' }
    : validateAudioUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const maxPos = db.read((d) => {
    const tapeTracks = d.tracks.filter((t) => t.tapeId === req.params.id);
    return tapeTracks.length > 0 ? Math.max(...tapeTracks.map((t) => t.position)) + 1 : 0;
  });

  const newTrack: Track = {
    id: nanoid(12),
    tapeId: req.params.id,
    title: title?.trim() || validation.title || 'مقطع صوتي',
    curatorNote: typeof curatorNote === 'string' ? curatorNote.trim().slice(0, 300) || null : null,
    sourceAttribution: typeof sourceAttribution === 'string' ? sourceAttribution.trim().slice(0, 500) || null : null,
    sourceUrl: typeof sourceUrl === 'string' ? sourceUrl.trim().slice(0, 2000) || null : null,
    licenseName: typeof licenseName === 'string' ? licenseName.trim().slice(0, 100) || null : null,
    licenseUrl: typeof licenseUrl === 'string' ? licenseUrl.trim().slice(0, 2000) || null : null,
    url: url.trim(),
    coverImage: coverImage || null,
    duration: duration || null,
    position: maxPos,
    createdAt: new Date().toISOString(),
  };

  db.write((d) => {
    d.tracks.push(newTrack);
  });

  res.status(201).json({ track: newTrack });
});

// Update track
router.put('/:id/tracks/:trackId', authMiddleware, (req: AuthRequest, res) => {
  const tape = db.read((d) => d.tapes.find((t) => t.id === req.params.id));
  if (!tape || tape.creatorId !== req.user!.id) {
    return res.status(403).json({ error: 'لا تملك صلاحية التعديل' });
  }

  const { title, url, coverImage, duration, curatorNote, sourceAttribution, sourceUrl, licenseName, licenseUrl } = req.body;

  db.write((d) => {
    const track = d.tracks.find((t) => t.id === req.params.trackId);
    if (track) {
      if (title) track.title = title.trim();
      if (url) track.url = url.trim();
      if (coverImage !== undefined) track.coverImage = coverImage;
      if (duration !== undefined) track.duration = duration;
      if (curatorNote !== undefined) {
        track.curatorNote = typeof curatorNote === 'string' ? curatorNote.trim().slice(0, 300) || null : null;
      }
      if (sourceAttribution !== undefined) {
        track.sourceAttribution = typeof sourceAttribution === 'string' ? sourceAttribution.trim().slice(0, 500) || null : null;
      }
      if (sourceUrl !== undefined) {
        track.sourceUrl = typeof sourceUrl === 'string' ? sourceUrl.trim().slice(0, 2000) || null : null;
      }
      if (licenseName !== undefined) {
        track.licenseName = typeof licenseName === 'string' ? licenseName.trim().slice(0, 100) || null : null;
      }
      if (licenseUrl !== undefined) {
        track.licenseUrl = typeof licenseUrl === 'string' ? licenseUrl.trim().slice(0, 2000) || null : null;
      }
    }
  });

  const track = db.read((d) => d.tracks.find((t) => t.id === req.params.trackId))!;
  res.json({ track });
});

// Delete track
router.delete('/:id/tracks/:trackId', authMiddleware, (req: AuthRequest, res) => {
  const tape = db.read((d) => d.tapes.find((t) => t.id === req.params.id));
  if (!tape || tape.creatorId !== req.user!.id) {
    return res.status(403).json({ error: 'لا تملك صلاحية الحذف' });
  }

  db.write((d) => {
    d.tracks = d.tracks.filter((t) => t.id !== req.params.trackId);
  });

  res.json({ success: true });
});

// Reorder tracks
router.put('/:id/reorder', authMiddleware, (req: AuthRequest, res) => {
  const tape = db.read((d) => d.tapes.find((t) => t.id === req.params.id));
  if (!tape || tape.creatorId !== req.user!.id) {
    return res.status(403).json({ error: 'لا تملك صلاحية التعديل' });
  }

  const { trackIds } = req.body as { trackIds: string[] };
  if (!Array.isArray(trackIds)) {
    return res.status(400).json({ error: 'قائمة غير صالحة' });
  }

  db.write((d) => {
    for (let i = 0; i < trackIds.length; i++) {
      const track = d.tracks.find((t) => t.id === trackIds[i]);
      if (track) track.position = i;
    }
  });

  const tracks = db.read((d) =>
    d.tracks
      .filter((t) => t.tapeId === req.params.id)
      .sort((a, b) => a.position - b.position)
  );
  res.json({ tracks });
});

// Increment play count
router.post('/:id/play', (req, res) => {
  db.write((d) => {
    const tape = d.tapes.find((t) => t.id === req.params.id);
    if (tape) tape.playCount++;
  });
  res.json({ success: true });
});

// Save to library
router.post('/:id/save', authMiddleware, (req: AuthRequest, res) => {
  const tape = db.read((d) => d.tapes.find((t) => t.id === req.params.id));
  if (!tape) {
    return res.status(404).json({ error: 'الشريط غير موجود' });
  }

  db.write((d) => {
    const exists = d.library.find((l) => l.userId === req.user!.id && l.tapeId === req.params.id);
    if (!exists) {
      d.library.push({
        userId: req.user!.id,
        tapeId: req.params.id,
        savedAt: new Date().toISOString(),
      });
    }
  });

  res.json({ success: true });
});

// Remove from library
router.delete('/:id/save', authMiddleware, (req: AuthRequest, res) => {
  db.write((d) => {
    d.library = d.library.filter(
      (l) => !(l.userId === req.user!.id && l.tapeId === req.params.id)
    );
  });
  res.json({ success: true });
});

// Record listen history
router.post('/:id/listen', authMiddleware, (req: AuthRequest, res) => {
  db.write((d) => {
    d.listenHistory.push({
      id: nanoid(12),
      userId: req.user!.id,
      tapeId: req.params.id,
      listenedAt: new Date().toISOString(),
    });
  });
  res.json({ success: true });
});

// Validate URL endpoint
router.post(
  '/upload-audio',
  authMiddleware,
  express.raw({ type: () => true, limit: '100mb' }),
  async (req: AuthRequest, res, next) => {
    const data = req.body;
    if (!Buffer.isBuffer(data) || data.length === 0) {
      return res.status(400).json({ error: 'اختر ملفًا صوتيًا أولًا' });
    }

    const extension = String(req.headers['x-audio-extension'] || '').toLowerCase();
    if (!audioExtensions.has(extension) || !hasAudioSignature(extension, data)) {
      return res.status(400).json({ error: 'صيغة الملف غير مدعومة أو أن الملف ليس صوتيًا' });
    }

    const filename = `${nanoid(16)}.${extension}`;
    try {
      await mkdir(uploadsDirectory, { recursive: true });
      await writeFile(join(uploadsDirectory, filename), data, { flag: 'wx' });
      return res.status(201).json({ url: `/uploads/${filename}` });
    } catch (error) {
      return next(error);
    }
  },
);

router.post('/validate-url', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'يرجى إدخال رابط' });
  }
  const result = validateAudioUrl(url);
  res.json(result);
});

export default router;
