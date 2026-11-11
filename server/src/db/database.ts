import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../../naqaa-data.json');

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar: string | null;
  bio: string | null;
  createdAt: string;
}

export interface Tape {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  category: string;
  isPublic: boolean;
  creatorId: string;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Track {
  id: string;
  tapeId: string;
  title: string;
  curatorNote?: string | null;
  sourceAttribution?: string | null;
  sourceUrl?: string | null;
  licenseName?: string | null;
  licenseUrl?: string | null;
  url: string;
  coverImage: string | null;
  duration: number | null;
  position: number;
  createdAt: string;
}

export interface LibraryEntry {
  userId: string;
  tapeId: string;
  savedAt: string;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  tapeId: string;
  listenedAt: string;
}

export interface Comment {
  id: string;
  tapeId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Like {
  userId: string;
  tapeId: string;
  createdAt: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'comment' | 'like' | 'follow' | 'new_tape';
  actorId: string;
  tapeId: string | null;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  tapes: Tape[];
  tracks: Track[];
  library: LibraryEntry[];
  listenHistory: HistoryEntry[];
  comments: Comment[];
  likes: Like[];
  follows: Follow[];
  notifications: Notification[];
}

const defaultData: DatabaseSchema = {
  users: [],
  tapes: [],
  tracks: [],
  library: [],
  listenHistory: [],
  comments: [],
  likes: [],
  follows: [],
  notifications: [],
};

class Database {
  private data: DatabaseSchema = { ...defaultData };

  constructor() {
    this.load();
  }

  load() {
    if (existsSync(dbPath)) {
      try {
        this.data = JSON.parse(readFileSync(dbPath, 'utf-8'));
        // Ensure all keys exist
        this.data = { ...defaultData, ...this.data };
      } catch {
        this.data = { ...defaultData };
      }
    } else {
      this.data = { ...defaultData };
      this.save();
    }
  }

  save() {
    const dir = dirname(dbPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(dbPath, JSON.stringify(this.data, null, 2));
  }

  get db(): DatabaseSchema {
    return this.data;
  }

  write<T>(fn: (data: DatabaseSchema) => T): T {
    const result = fn(this.data);
    this.save();
    return result;
  }

  read<T>(fn: (data: DatabaseSchema) => T): T {
    return fn(this.data);
  }
}

const db = new Database();

export function initDatabase() {
  db.load();
  console.log('✓ Database initialized');
  return db;
}

export default db;
