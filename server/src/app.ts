import express, { Request, Response } from 'express';
import cors from 'cors';

import bookRouter from './routes/books';
import authRouter from './routes/auth';
import commentRouter from './routes/comments';
import reviewRouter from './routes/reviews';
import { logger } from './utils/logger';

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
  logger.info('[AUTH-DEBUG] path=', req.path, 'authorization=', req.headers.authorization);
  next();
});

// Reviews router (公開エンドポイントを含むため authenticateToken を適用しない)
app.use('/api', reviewRouter);

// mount comment routes without global auth; individual routes enforce authentication where required
app.use('/api', commentRouter);
export default app;
