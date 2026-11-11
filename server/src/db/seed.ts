import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from './database.js';
import type { User, Tape, Track } from './database.js';

function seed() {
  // Check if already seeded
  const tapeCount = db.read((d) => d.tapes.length);
  if (tapeCount > 0) {
    console.log('Database already has data, skipping seed.');
    return;
  }

  const now = new Date().toISOString();

  // Create demo user
  const userId = nanoid();
  const demoUser: User = {
    id: userId,
    username: 'أحمد_القارئ',
    email: 'demo@naqaa.app',
    password: bcrypt.hashSync('demo123456', 10),
    avatar: null,
    bio: 'قارئ ومستمع للقرآن الكريم والأذكار',
    createdAt: now,
  };

  const sampleTracks = {
    quran: [
      { title: 'سورة الفاتحة', url: 'https://server8.mp3quran.net/afs/001.mp3' },
      { title: 'سورة البقرة', url: 'https://server8.mp3quran.net/afs/002.mp3' },
      { title: 'سورة آل عمران', url: 'https://server8.mp3quran.net/afs/003.mp3' },
    ],
    adhkar: [
      { title: 'أذكار الصباح', url: 'https://server8.mp3quran.net/afs/093.mp3' },
      { title: 'أذكار المساء', url: 'https://server8.mp3quran.net/afs/094.mp3' },
    ],
    lectures: [
      { title: 'محاضرة: الأخلاق في الإسلام', url: 'https://server8.mp3quran.net/afs/055.mp3' },
      { title: 'محاضرة: الصبر وحسن الظن', url: 'https://server8.mp3quran.net/afs/056.mp3' },
    ],
    nasheed: [
      { title: 'نشيد: طلع البدر', url: 'https://server8.mp3quran.net/afs/108.mp3' },
      { title: 'نشيد: يا طيبة', url: 'https://server8.mp3quran.net/afs/110.mp3' },
    ],
  };

  const tapeDefs = [
    {
      title: 'تلاوات هادئة من القرآن الكريم',
      description: 'مجموعة من أجمل التلاوات بصوت القارئ المشهور، مرتبة بشكل مريح للاستماع.',
      cover: '/covers/quran.svg',
      category: 'quran',
      playCount: 1240,
      tracks: sampleTracks.quran,
    },
    {
      title: 'أذكار الصباح والمساء',
      description: 'أذكار يومية مريحة للبداية والنهاية، بصوت هادئ ومطمئن.',
      cover: '/covers/adhkar.svg',
      category: 'adhkar',
      playCount: 856,
      tracks: sampleTracks.adhkar,
    },
    {
      title: 'محاضرات في الأخلاق والمعاملة',
      description: 'سلسلة محاضرات قيمة حول الأخلاق الإسلامية وكيفية تطبيقها في حياتنا اليومية.',
      cover: '/covers/lectures.svg',
      category: 'lectures',
      playCount: 432,
      tracks: sampleTracks.lectures,
    },
    {
      title: 'أناشيد مؤثرة',
      description: 'مجموعة أناشيد صوتية هادئة ومؤثرة.',
      cover: '/covers/nasheed.svg',
      category: 'nasheed',
      playCount: 321,
      tracks: sampleTracks.nasheed,
    },
  ];

  const tapes: Tape[] = [];
  const tracks: Track[] = [];

  for (const def of tapeDefs) {
    const tapeId = nanoid(12);
    tapes.push({
      id: tapeId,
      title: def.title,
      description: def.description,
      coverImage: def.cover,
      category: def.category,
      isPublic: true,
      creatorId: userId,
      playCount: def.playCount,
      createdAt: now,
      updatedAt: now,
    });

    for (let i = 0; i < def.tracks.length; i++) {
      const track = def.tracks[i];
      tracks.push({
        id: nanoid(12),
        tapeId,
        title: track.title,
        url: track.url,
        coverImage: null,
        duration: null,
        position: i,
        createdAt: now,
      });
    }
  }

  db.write((d) => {
    d.users.push(demoUser);
    d.tapes.push(...tapes);
    d.tracks.push(...tracks);
  });

  console.log(`✓ Seeded ${tapes.length} tapes with ${tracks.length} tracks`);
  console.log('  Demo user: demo@naqaa.app / demo123456');
}

seed();
