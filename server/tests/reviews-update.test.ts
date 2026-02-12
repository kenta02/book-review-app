import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import reviewRouter from '../src/routes/reviews';
import Review from '../src/models/Review';

// Type aliases for cleaner code
type ReviewInstance = InstanceType<typeof Review>;

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
  app = makeApp(2); // authenticated as userId = 2 by default
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PUT /api/reviews/:reviewId', () => {
  // 無効なレビューID（整数以外）のテスト
  it('returns 400 for invalid id (non-integer)', async () => {
    const spyFind = vi.spyOn(Review, 'findByPk');
    const res = await request(app).put('/api/reviews/1.5').send({ content: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REVIEW_ID');
    expect(spyFind).not.toHaveBeenCalled();
  });

  // 未認証のリクエストのテスト
  it('returns 401 when unauthenticated', async () => {
    const unauthApp = makeApp(); // do not set userId
    const res = await request(unauthApp).put('/api/reviews/1').send({ content: 'ok' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  // レビューが見つからない場合のテスト
  it('returns 404 when review not found', async () => {
    vi.spyOn(Review, 'findByPk').mockResolvedValue(null);
    const res = await request(app).put('/api/reviews/999').send({ content: 'ok' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('REVIEW_NOT_FOUND');
  });

  // 禁止されたアクセス（所有者でない）のテスト
  it('returns 403 when not owner', async () => {
    type FakeReview = { get: (key: string) => number | null };
    const fakeReview: FakeReview = { get: (k: string) => (k === 'userId' ? 99 : null) };
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview as unknown as ReviewInstance);

    const res = await request(app).put('/api/reviews/5').send({ content: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // コンテンツのバリデーションエラーのテスト
  it('returns 400 when content is missing or invalid', async () => {
    type FakeReview = { get: (key: string) => number | null };
    const fakeReview: FakeReview = { get: (k: string) => (k === 'userId' ? 2 : null) };
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview as unknown as ReviewInstance);

    // 空のコンテンツ
    const res1 = await request(app).put('/api/reviews/3').send({ content: '' });
    expect(res1.status).toBe(400);
    expect(res1.body.error.code).toBe('VALIDATION_ERROR');
    expect(res1.body.error.details[0].field).toBe('content');

    // 長すぎるコンテンツ
    const long = 'a'.repeat(2000);
    const res2 = await request(app).put('/api/reviews/3').send({ content: long });
    expect(res2.status).toBe(400);
    expect(res2.body.error.code).toBe('VALIDATION_ERROR');
  });

  // 正常な更新のテスト
  it('returns 200 and updated review when ok', async () => {
    type FakeReviewWithUpdate = {
      get: (key: string) => number | null;
      update: ReturnType<typeof vi.fn>;
    };
    const fakeReview: FakeReviewWithUpdate = {
      get: (k: string) => (k === 'userId' ? 2 : null),
      update: vi.fn().mockResolvedValue({ id: 7, content: 'updated', userId: 2 }),
    };
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview as unknown as ReviewInstance);

    const res = await request(app).put('/api/reviews/7').send({ content: 'updated' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
    expect(fakeReview.update).toHaveBeenCalledWith({ content: 'updated' });
  });

  // 更新失敗時の内部サーバーエラーのテスト
  it('returns 500 when update fails', async () => {
    type FakeReviewWithUpdate = {
      get: (key: string) => number | null;
      update: ReturnType<typeof vi.fn>;
    };
    const fakeReview: FakeReviewWithUpdate = {
      get: (k: string) => (k === 'userId' ? 2 : null),
      update: vi.fn().mockRejectedValue(new Error('DB fail')),
    };
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview as unknown as ReviewInstance);

    const res = await request(app).put('/api/reviews/9').send({ content: 'ok' });
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
