import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from '../db/database.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { toPublicUser, type User, type AuthRequest } from '../types.js';

const router = Router();

function isLocalUsernameLoginEnabled(req: AuthRequest): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const address = req.socket.remoteAddress;
  return address === '::1' || address === '127.0.0.1' || address === '::ffff:127.0.0.1';
}

router.get('/login-options', (req: AuthRequest, res) => {
  res.json({ usernameOnly: isLocalUsernameLoginEnabled(req) });
});

router.post('/login/username', (req: AuthRequest, res) => {
  if (!isLocalUsernameLoginEnabled(req)) {
    return res.status(404).json({ error: 'الخيار غير متاح' });
  }

  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  if (!username || username.length > 30 || /[\u0000-\u001f\u007f]/.test(username)) {
    return res.status(400).json({ error: 'أدخل اسم مستخدم صالحًا (حتى 30 حرفًا)' });
  }

  let user = db.read((d) => d.users.find((u) => u.username.toLowerCase() === username.toLowerCase()));
  if (!user) {
    user = {
      id: nanoid(),
      username,
      email: `${nanoid()}@local.invalid`,
      password: bcrypt.hashSync(nanoid(32), 10),
      avatar: null,
      bio: null,
      createdAt: new Date().toISOString(),
    };
    db.write((d) => {
      d.users.push(user!);
    });
  }

  const token = generateToken(user.id, user.username);
  return res.json({ token, user: toPublicUser(user) });
});

// Register
router.post('/register', (req: AuthRequest, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
  }

  const existing = db.read((d) =>
    d.users.find((u) => u.username === username || u.email === email)
  );
  if (existing) {
    return res.status(409).json({ error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
  }

  const newUser: User = {
    id: nanoid(),
    username,
    email,
    password: bcrypt.hashSync(password, 10),
    avatar: null,
    bio: null,
    createdAt: new Date().toISOString(),
  };

  db.write((d) => {
    d.users.push(newUser);
  });

  const token = generateToken(newUser.id, newUser.username);
  res.status(201).json({ token, user: toPublicUser(newUser) });
});

// Login
router.post('/login', (req: AuthRequest, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
  }

  const user = db.read((d) => d.users.find((u) => u.email === email));
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }

  const token = generateToken(user.id, user.username);
  res.json({ token, user: toPublicUser(user) });
});

// Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.read((d) => d.users.find((u) => u.id === req.user!.id));
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  res.json({ user: toPublicUser(user) });
});

// Update profile
router.put('/profile', authMiddleware, (req: AuthRequest, res) => {
  const { username, avatar, bio } = req.body;

  const existing = db.read((d) =>
    d.users.find((u) => u.username === username && u.id !== req.user!.id)
  );

  if (existing) {
    return res.status(409).json({ error: 'اسم المستخدم مستخدم بالفعل' });
  }

  db.write((d) => {
    const user = d.users.find((u) => u.id === req.user!.id);
    if (user) {
      if (username) user.username = username;
      if (avatar !== undefined) user.avatar = avatar;
      if (bio !== undefined) user.bio = bio;
    }
  });

  const user = db.read((d) => d.users.find((u) => u.id === req.user!.id))!;
  res.json({ user: toPublicUser(user) });
});

export default router;
