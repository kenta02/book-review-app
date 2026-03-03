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

// セキュリティ: 共通のHTTPヘッダーを設定
app.use(helmet());

// CORS: CORS_ORIGINS（カンマ区切り）でオリジンをホワイトリスト
// - Originなしのリクエストを許可（サーバー間通信／テスト用）
// 高速な検索のためにSetに変換し、チェック時には has() を使用
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    return callback(null, allowedOrigins.has(origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// 大きなペイロード攻撃を軽減するためにJSONボディサイズを制限
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

// ルートのインポート
app.use('/api/books', bookRouter);

// ユーザールートのインポート
app.use('/api/users', usersRouter);

// 認証ルートのインポート
app.use('/api/auth', authRouter);

// 一時的デバッグミドルウェア: /apiへのリクエストパスのみをログ
// 認証ヘッダー（ユーザー制御/機密）はログに記録しない
app.use('/api', (req: Request, _res: Response, next) => {
  logger.info('[AUTH-DEBUG] path=', req.path);
  next();
});

// Reviews router (公開エンドポイントを含むため authenticateToken を適用しない)
app.use('/api', reviewRouter);

// グローバルな認証なしでコメントルートをマウント; 必要な個々のルートで認証を強制
app.use('/api', commentRouter);
export default app;
