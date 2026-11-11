import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/database.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { toPublicUser, type AuthRequest, type CommentWithUser, type Tape, type TapeWithDetails } from '../types.js';
import type { Comment, Like, Follow, Notification, User } from '../db/database.js';

const router = Router();

// Helper: get tape summary with social counts
function getTapeWithSocial(tape: Tape, currentUserId?: string): TapeWithDetails {
  const creator = db.read((d) => d.users.find((u) => u.id === tape.creatorId));
  const tracks = db.read((d) => d.tracks.filter((t) => t.tapeId === tape.id));
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const likes = db.read((d) => d.likes.filter((l) => l.tapeId === tape.id));
  const comments = db.read((d) => d.comments.filter((c) => c.tapeId === tape.id));
  const isFollowing = currentUserId
    ? db.read((d) => d.follows.some((f) => f.followerId === currentUserId && f.followingId === tape.creatorId))
    : false;

  return {
    ...tape,
    creator: creator ? toPublicUser(creator) : undefined,
    trackCount: tracks.length,
    totalDuration,
    likeCount: likes.length,
    commentCount: comments.length,
    isLiked: currentUserId ? likes.some((l) => l.userId === currentUserId) : false,
    isFollowingCreator: isFollowing,
  };
}

function createNotification(userId: string, type: Notification['type'], actorId: string, tapeId: string | null, content: string) {
  // Don't notify yourself
  if (userId === actorId) return;

  db.write((d) => {
    d.notifications.push({
      id: nanoid(12),
      userId,
      type,
      actorId,
      tapeId,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    });
  });
}

// ===== COMMENTS =====

// Get comments for a tape
router.get('/tapes/:id/comments', optionalAuth, (req: AuthRequest, res) => {
  const comments = db.read((d) =>
    d.comments
      .filter((c) => c.tapeId === req.params.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );

  const commentsWithUsers: CommentWithUser[] = comments.map((c) => {
    const user = db.read((d) => d.users.find((u) => u.id === c.userId));
    return {
      id: c.id,
      tapeId: c.tapeId,
      content: c.content,
      createdAt: c.createdAt,
      user: user ? toPublicUser(user) : { id: '', username: 'مستخدم محذوف', avatar: null, bio: null },
    };
  });

  res.json({ comments: commentsWithUsers });
});

// Add comment
router.post('/tapes/:id/comments', authMiddleware, (req: AuthRequest, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'التعليق فارغ' });
  }

  const tape = db.read((d) => d.tapes.find((t) => t.id === req.params.id));
  if (!tape) {
    return res.status(404).json({ error: 'الشريط غير موجود' });
  }

  const comment: Comment = {
    id: nanoid(12),
    tapeId: req.params.id,
    userId: req.user!.id,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  db.write((d) => {
    d.comments.push(comment);
  });

  // Notify tape creator
  createNotification(tape.creatorId, 'comment', req.user!.id, tape.id, 'علّق على شريطك');

  const user = db.read((d) => d.users.find((u) => u.id === req.user!.id))!;
  res.status(201).json({
    comment: {
      ...comment,
      user: toPublicUser(user),
    } as CommentWithUser,
  });
});

// Delete comment
router.delete('/tapes/:id/comments/:commentId', authMiddleware, (req: AuthRequest, res) => {
  const comment = db.read((d) => d.comments.find((c) => c.id === req.params.commentId));
  if (!comment) {
    return res.status(404).json({ error: 'التعليق غير موجود' });
  }

  // Only comment author or tape owner can delete
  const tape = db.read((d) => d.tapes.find((t) => t.id === req.params.id));
  if (comment.userId !== req.user!.id && tape?.creatorId !== req.user!.id) {
    return res.status(403).json({ error: 'لا تملك صلاحية حذف هذا التعليق' });
  }

  db.write((d) => {
    d.comments = d.comments.filter((c) => c.id !== req.params.commentId);
  });

  res.json({ success: true });
});

// ===== LIKES =====

// Toggle like
router.post('/tapes/:id/like', authMiddleware, (req: AuthRequest, res) => {
  const tape = db.read((d) => d.tapes.find((t) => t.id === req.params.id));
  if (!tape) {
    return res.status(404).json({ error: 'الشريط غير موجود' });
  }

  const existing = db.read((d) =>
    d.likes.find((l) => l.userId === req.user!.id && l.tapeId === req.params.id)
  );

  if (existing) {
    // Unlike
    db.write((d) => {
      d.likes = d.likes.filter((l) => !(l.userId === req.user!.id && l.tapeId === req.params.id));
    });
    res.json({ liked: false });
  } else {
    // Like
    db.write((d) => {
      d.likes.push({
        userId: req.user!.id,
        tapeId: req.params.id,
        createdAt: new Date().toISOString(),
      });
    });
    // Notify tape creator
    createNotification(tape.creatorId, 'like', req.user!.id, tape.id, 'أعجب بشريطك');
    res.json({ liked: true });
  }
});

// Get likers (optional - for future use)
router.get('/tapes/:id/likes', (req, res) => {
  const likes = db.read((d) => d.likes.filter((l) => l.tapeId === req.params.id));
  const users = likes.map((l) => {
    const user = db.read((d) => d.users.find((u) => u.id === l.userId));
    return user ? toPublicUser(user) : null;
  }).filter(Boolean);

  res.json({ users, count: likes.length });
});

// ===== FOLLOWS =====

// Toggle follow
router.post('/users/:id/follow', authMiddleware, (req: AuthRequest, res) => {
  const targetUser = db.read((d) => d.users.find((u) => u.id === req.params.id));
  if (!targetUser) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  if (targetUser.id === req.user!.id) {
    return res.status(400).json({ error: 'لا يمكن متابعة نفسك' });
  }

  const existing = db.read((d) =>
    d.follows.find((f) => f.followerId === req.user!.id && f.followingId === req.params.id)
  );

  if (existing) {
    // Unfollow
    db.write((d) => {
      d.follows = d.follows.filter(
        (f) => !(f.followerId === req.user!.id && f.followingId === req.params.id)
      );
    });
    res.json({ following: false });
  } else {
    // Follow
    db.write((d) => {
      d.follows.push({
        followerId: req.user!.id,
        followingId: req.params.id,
        createdAt: new Date().toISOString(),
      });
    });
    // Notify the followed user
    createNotification(targetUser.id, 'follow', req.user!.id, null, 'بدأ بمتابعتك');
    res.json({ following: true });
  }
});

// Get follow status and counts
router.get('/users/:id/follow', optionalAuth, (req: AuthRequest, res) => {
  const userId = req.params.id;
  const followers = db.read((d) => d.follows.filter((f) => f.followingId === userId));
  const following = db.read((d) => d.follows.filter((f) => f.followerId === userId));
  const isFollowing = req.user
    ? followers.some((f) => f.followerId === req.user!.id)
    : false;

  res.json({
    isFollowing,
    followersCount: followers.length,
    followingCount: following.length,
  });
});

// ===== FEED =====

// Get feed of tapes from followed users
router.get('/feed', authMiddleware, (req: AuthRequest, res) => {
  const followingIds = db.read((d) =>
    d.follows
      .filter((f) => f.followerId === req.user!.id)
      .map((f) => f.followingId)
  );

  // Also include your own tapes
  followingIds.push(req.user!.id);

  const tapes = db.read((d) =>
    d.tapes
      .filter((t) => followingIds.includes(t.creatorId) && t.isPublic)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30)
  );

  res.json({ tapes: tapes.map((t) => getTapeWithSocial(t, req.user!.id)) });
});

// ===== NOTIFICATIONS =====

// Get notifications
router.get('/notifications', authMiddleware, (req: AuthRequest, res) => {
  const notifications = db.read((d) =>
    d.notifications
      .filter((n) => n.userId === req.user!.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30)
  );

  // Enrich with actor info
  const enriched = notifications.map((n) => {
    const actor = db.read((d) => d.users.find((u) => u.id === n.actorId));
    const tape = n.tapeId ? db.read((d) => d.tapes.find((t) => t.id === n.tapeId)) : null;
    return {
      ...n,
      actor: actor ? toPublicUser(actor) : null,
      tapeTitle: tape?.title || null,
    };
  });

  const unreadCount = db.read((d) =>
    d.notifications.filter((n) => n.userId === req.user!.id && !n.read).length
  );

  res.json({ notifications: enriched, unreadCount });
});

// Mark all as read
router.put('/notifications/read', authMiddleware, (req: AuthRequest, res) => {
  db.write((d) => {
    d.notifications.forEach((n) => {
      if (n.userId === req.user!.id) n.read = true;
    });
  });
  res.json({ success: true });
});

// Mark single notification as read
router.put('/notifications/:id/read', authMiddleware, (req: AuthRequest, res) => {
  db.write((d) => {
    const n = d.notifications.find((n) => n.id === req.params.id);
    if (n && n.userId === req.user!.id) n.read = true;
  });
  res.json({ success: true });
});

export default router;
