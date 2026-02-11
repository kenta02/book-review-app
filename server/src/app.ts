import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import bookRouter from './routes/books';
import authRouter from './routes/auth';
import commentRouter from './routes/comments';
import { authenticateToken } from './middleware/auth';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

// ルートのインポート
app.use('/api/books', bookRouter);

// 認証ルートのインポート
app.use('/api/auth', authRouter);

// コメントルートのインポート
// app.use('/api/comments', require('./routes/comments'));

// Temporary debug middleware: log Authorization header for incoming /api requests
app.use('/api', (req: Request, _res: Response, next) => {
  console.info('[AUTH-DEBUG] path=', req.path, 'authorization=', req.headers.authorization);
  next();
});

app.use('/api', authenticateToken, commentRouter);
export default app;
