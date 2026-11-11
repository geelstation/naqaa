import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import tapeRoutes from './routes/tapes.js';
import userRoutes from './routes/users.js';
import socialRoutes from './routes/social.js';

initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;
const uploadsDirectory = join(dirname(fileURLToPath(import.meta.url)), '../uploads');

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(uploadsDirectory, { fallthrough: false }));

// Root endpoint for clearer local debugging
app.get('/', (_req, res) => {
  res.json({
    name: 'naqaa',
    status: 'ok',
    message: 'This is the API server. Use /api/health or the frontend at http://localhost:5173',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tapes', tapeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/social', socialRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'naqaa' });
});

app.use((error: Error & { status?: number; type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'حجم الملف أكبر من الحد المسموح (100 ميغابايت)' });
  }
  console.error('Request failed:', error);
  return res.status(error.status || 500).json({ error: 'تعذر إكمال الطلب' });
});

app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════╗`);
  console.log(`  ║  نقاء — الخادم يعمل على المنفذ ${PORT}  ║`);
  console.log(`  ╚══════════════════════════════════╝\n`);
});
