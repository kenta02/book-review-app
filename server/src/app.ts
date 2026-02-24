import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import bookRouter from './routes/books';
import authRouter from './routes/auth';
import commentRouter from './routes/comments';
import reviewRouter from './routes/reviews';
import usersRouter from './routes/users';
import { logger } from './utils/logger';

const app = express();

// security: set common HTTP headers
app.use(helmet());

// CORS: whitelist origins via CORS_ORIGINS (comma-separated).
// - Allow requests without Origin (server-to-server / tests)
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    return callback(null, allowedOrigins.includes(origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// limit JSON body size to mitigate large payload attacks
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

// ルートのインポート
app.use('/api/books', bookRouter);

// ユーザールートのインポート
app.use('/api/users', usersRouter);

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
