import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { toPublicUser, type AuthRequest, type Tape, type User } from '../types.js';

const router = Router();

function getTapeSummary(tape: Tape, currentUserId?: string) {
  const tapeTracks = db.read((d) => d.tracks.filter((t) => t.tapeId === tape.id));
  const totalDuration = tapeTracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const creator = db.read((d) => d.users.find((u) => u.id === tape.creatorId));
  const likes = db.read((d) => d.likes.filter((l) => l.tapeId === tape.id));
  const comments = db.read((d) => d.comments.filter((c) => c.tapeId === tape.id));
  return {
    ...tape,
    creator: creator ? toPublicUser(creator) : undefined,
    trackCount: tapeTracks.length,
    totalDuration,
    likeCount: likes.length,
    commentCount: comments.length,
    isLiked: currentUserId ? likes.some((l) => l.userId === currentUserId) : false,
  };
}

// Get current user's tapes
router.get('/my-tapes', authMiddleware, (req: AuthRequest, res) => {
  const tapes = db.read((d) =>
    d.tapes
      .filter((t) => t.creatorId === req.user!.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  );
  res.json({ tapes: tapes.map((t) => getTapeSummary(t, req.user!.id)) });
});

router.get('/studio', authMiddleware, (req: AuthRequest, res) => {
  const data = db.read((d) => {
    const tapes = d.tapes
      .filter((t) => t.creatorId === req.user!.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const tapeIds = new Set(tapes.map((t) => t.id));
    const saves = d.library.filter((entry) => tapeIds.has(entry.tapeId));
    const listens = d.listenHistory.filter((entry) => tapeIds.has(entry.tapeId));
    const comments = d.comments.filter((entry) => tapeIds.has(entry.tapeId));
    const followersCount = d.follows.filter((entry) => entry.followingId === req.user!.id).length;
    const today = new Date();
    const activity = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - (6 - index));
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = listens.filter((entry) => {
        const listenedAt = new Date(entry.listenedAt).getTime();
        return listenedAt >= day.getTime() && listenedAt < nextDay.getTime();
      }).length;
      return {
        date: day.toISOString().slice(0, 10),
        label: new Intl.DateTimeFormat('ar', { weekday: 'short' }).format(day),
        count,
      };
    });

    return {
      tapes: tapes.map((tape) => ({
        ...getTapeSummary(tape, req.user!.id),
        saveCount: saves.filter((entry) => entry.tapeId === tape.id).length,
        listenCount: listens.filter((entry) => entry.tapeId === tape.id).length,
        listenerCount: new Set(listens.filter((entry) => entry.tapeId === tape.id).map((entry) => entry.userId)).size,
      })),
      stats: {
        tapeCount: tapes.length,
        publicTapeCount: tapes.filter((tape) => tape.isPublic).length,
        playCount: tapes.reduce((sum, tape) => sum + tape.playCount, 0),
        saveCount: saves.length,
        listenCount: listens.length,
        listenerCount: new Set(listens.map((entry) => entry.userId)).size,
        commentCount: comments.length,
        followersCount,
      },
      activity,
    };
  });

  res.json(data);
});

// Get saved/library tapes
router.get('/library', authMiddleware, (req: AuthRequest, res) => {
  const savedIds = db.read((d) =>
    d.library
      .filter((l) => l.userId === req.user!.id)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      .map((l) => l.tapeId)
  );

  const tapes = db.read((d) => d.tapes.filter((t) => savedIds.includes(t.id)));
  const sorted = savedIds
    .map((id) => tapes.find((t) => t.id === id))
    .filter(Boolean) as Tape[];

  res.json({ tapes: sorted.map((t) => getTapeSummary(t, req.user!.id)) });
});

// Get listen history
router.get('/history', authMiddleware, (req: AuthRequest, res) => {
  const historyTapeIds = db.read((d) =>
    d.listenHistory
      .filter((h) => h.userId === req.user!.id)
      .sort((a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime())
      .map((h) => h.tapeId)
  );

  const uniqueIds = [...new Set(historyTapeIds)].slice(0, 20);
  const tapes = db.read((d) => d.tapes.filter((t) => uniqueIds.includes(t.id)));
  const sorted = uniqueIds
    .map((id) => tapes.find((t) => t.id === id))
    .filter(Boolean) as Tape[];

  res.json({ tapes: sorted.map((t) => getTapeSummary(t, req.user!.id)) });
});

// Get public profile with follow stats
router.get('/profile/:username', optionalAuth, (req: AuthRequest, res) => {
  const user = db.read((d) => d.users.find((u) => u.username === req.params.username));
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  const tapes = db.read((d) =>
    d.tapes
      .filter((t) => t.creatorId === user.id && t.isPublic)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );

  const followers = db.read((d) => d.follows.filter((f) => f.followingId === user.id));
  const following = db.read((d) => d.follows.filter((f) => f.followerId === user.id));
  const isFollowing = req.user
    ? followers.some((f) => f.followerId === req.user!.id)
    : false;

  res.json({
    user: toPublicUser(user),
    tapes: tapes.map((t) => getTapeSummary(t, req.user?.id)),
    followersCount: followers.length,
    followingCount: following.length,
    isFollowing,
  });
});

export default router;
