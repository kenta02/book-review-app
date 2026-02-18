import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import reviewRouter from '../src/routes/reviews';
import Review from '../src/models/Review';
import Book from '../src/models/Book';

// テスト目的：POST /api/reviews の認証・バリデーション・DB エラー処理を確認
// - req.userId をセットすることで認証済み状態を模擬

type ReviewInstance = InstanceType<typeof Review>;
type BookInstance = InstanceType<typeof Book>;

type TestRequest = express.Request & { userId?: number };
function makeApp(setUserId?: number) {
  const app = express();
  app.use(express.json());
  app.use((req: TestRequest, _res: express.Response, next: express.NextFunction) => {
    if (setUserId !== undefined) req.userId = setUserId;
    next();
  });
  app.use('/api', reviewRouter);
  return app;
}

let app: express.Express;

beforeEach(() => {
  app = makeApp(2);
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/reviews', () => {
  it('returns 401 when unauthenticated', async () => {
    const unauthApp = makeApp();
    const res = await request(unauthApp)
      .post('/api/reviews')
      .send({ bookId: 1, content: 'ok', rating: 5 });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns 400 when validation fails', async () => {
    // バリデーションエラー時は details に該当フィールドが含まれることを確認
    const res = await request(app)
      .post('/api/reviews')
      .send({ bookId: 0, content: '', rating: 7 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toContain('bookId');
    expect(fields).toContain('content');
    expect(fields).toContain('rating');
  });

  it('returns 404 when book not found', async () => {
    vi.spyOn(Book, 'findByPk').mockResolvedValue(null);
    const res = await request(app)
      .post('/api/reviews')
      .send({ bookId: 999, content: 'ok', rating: 4 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BOOK_NOT_FOUND');
  });

  it('returns 201 and created review when ok (rating optional)', async () => {
    // 正常系：Book 存在確認 -> Review.create の流れをモック
    vi.spyOn(Book, 'findByPk').mockResolvedValue({ id: 1 } as unknown as BookInstance);
    vi.spyOn(Review, 'create').mockResolvedValue({
      toJSON: () => ({
        id: 10,
        bookId: 1,
        userId: 2,
        content: 'great',
        createdAt: '2026-02-18T00:00:00Z',
        updatedAt: '2026-02-18T00:00:00Z',
      }),
    } as unknown as ReviewInstance);

    const res = await request(app)
      .post('/api/reviews')
      .send({ bookId: 1, content: 'great' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
    expect(res.body.data.bookId).toBe(1);
    expect(res.body.data.userId).toBe(2);
  });

  it('returns 500 when create fails', async () => {
    vi.spyOn(Book, 'findByPk').mockResolvedValue({ id: 1 } as unknown as BookInstance);
    vi.spyOn(Review, 'create').mockRejectedValue(new Error('DB fail'));

    const res = await request(app)
      .post('/api/reviews')
      .send({ bookId: 1, content: 'ok', rating: 3 });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
