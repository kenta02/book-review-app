import express, { Request, Response } from 'express';
import cors from 'cors';

import bookRouter from './routes/books';
import authRouter from './routes/auth';
import commentRouter from './routes/comments';
import reviewRouter from './routes/reviews';
import Review from './models/Review';
import { logger } from './utils/logger';

const app = express();
app.use(cors());
app.use(express.json());

// debug: list registered routes/middleware
app.get('/debug/routes', (_req: Request, res: Response) => {
  // Express の内部型（_router.stack の各 element）を限定的に定義して扱う
  interface RouteLayer {
    route?: { path: string; methods: Record<string, boolean> };
    name?: string;
    regexp?: { source?: string } | RegExp;
  }

  const stack = (app as unknown as { _router?: { stack?: RouteLayer[] } })._router?.stack ?? [];

  const result = stack
    .filter(
      (s): s is RouteLayer => typeof s === 'object' && s !== null && ('route' in s || 'name' in s)
    )
    .map((s) => {
      if (s.route) return { route: s.route.path, methods: s.route.methods };
      if (s.name === 'router') {
        let routerSource: string | undefined;
        if (s.regexp instanceof RegExp) {
          routerSource = s.regexp.source;
        } else if (s.regexp && typeof s.regexp === 'object' && 'source' in s.regexp) {
          routerSource = (s.regexp as { source?: string }).source;
        }
        return { router: routerSource };
      }
      return {};
    });

  res.json(result);
});

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

// --- lightweight public handler for GET /api/reviews (quick fix for Swagger)
app.get('/api/reviews-quick', (_req: Request, res: Response) => {
  logger.info('[ROUTE] /api/reviews-quick called');
  return res.json({ success: true, data: { ok: true } });
});
app.get('/api/reviews', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (req.query.bookId) (where as Record<string, unknown>).bookId = Number(req.query.bookId);
    if (req.query.userId) (where as Record<string, unknown>).userId = Number(req.query.userId);

    const { rows, count } = await Review.findAndCountAll({
      where,
      attributes: ['id', 'bookId', 'userId', 'content', 'rating', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return res.json({
      success: true,
      data: {
        reviews: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit,
        },
      },
    });
  } catch (err) {
    logger.error('Quick /api/reviews handler error', err instanceof Error ? err.stack : err);
    return res.status(500).json({ success: false, error: { message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' } });
  }
});

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
