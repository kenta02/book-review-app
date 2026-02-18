import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
// modules under test
import { Transaction } from 'sequelize';

import reviewRouter from '../src/routes/reviews';
import Review from '../src/models/Review';
import Comment from '../src/models/Comment';
import { sequelize } from '../src/sequelize';

// このファイルの目的：DELETE /api/reviews/:reviewId の挙動を検証
// - トランザクション処理、関連コメントチェック、権限チェックを網羅

// Type aliases for cleaner code
type ReviewInstance = InstanceType<typeof Review>;
type CommentInstance = InstanceType<typeof Comment>;

// Helper to mount router with optional auth middleware
type TestRequest = express.Request & { userId?: number };
function makeApp(setUserId?: number) {
  const app = express();
  app.use(express.json());
  // テスト用ミドルウェア：req.userId を設定して認証状態を模擬
  app.use((req: TestRequest, _res: express.Response, next: express.NextFunction) => {
    if (setUserId !== undefined) req.userId = setUserId;
    next();
  });
  app.use('/api', reviewRouter);
  return app;
}

let app: express.Express;

beforeEach(() => {
  app = makeApp(2); // default: authenticated userId = 2
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('DELETE /api/reviews/:reviewId', () => {
  // 無効なレビューID（整数以外）のテスト
  it('returns 400 for invalid id (non-integer)', async () => {
    const spyFind = vi.spyOn(Review, 'findByPk');
    const res = await request(app).delete('/api/reviews/1.5');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REVIEW_ID');
    expect(spyFind).not.toHaveBeenCalled();
  });

  // 未認証のリクエストのテスト
  it('returns 401 when unauthenticated', async () => {
    const unauthApp = makeApp(); // do not set userId
    const res = await request(unauthApp).delete('/api/reviews/1');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  // レビューが見つからない場合のテスト
  it('returns 404 when review not found', async () => {
    vi.spyOn(Review, 'findByPk').mockResolvedValue(null);
    const res = await request(app).delete('/api/reviews/999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('REVIEW_NOT_FOUND');
  });

  // 禁止されたアクセス（所有者でない）のテスト
  it('returns 403 when not owner', async () => {
    type FakeReview = { get: (key: string) => number | null };
    const fakeReview: FakeReview = { get: (k: string) => (k === 'userId' ? 99 : null) };
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview as unknown as ReviewInstance);

    const res = await request(app).delete('/api/reviews/5');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // 関連コメントが存在する場合の競合のテスト
  it('returns 409 when related comments exist', async () => {
    type FakeReview = { get: (key: string) => number | null };
    const fakeReview: FakeReview = { get: (k: string) => (k === 'userId' ? 2 : null) };

    const fakeTransaction = { commit: vi.fn(), rollback: vi.fn() };

    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview as unknown as ReviewInstance);
    vi.spyOn(sequelize, 'transaction').mockResolvedValue(fakeTransaction as unknown as Transaction);
    vi.spyOn(Comment, 'findOne').mockResolvedValue({ id: 1 } as unknown as CommentInstance);

    const res = await request(app).delete('/api/reviews/7');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('RELATED_DATA_EXISTS');
    expect(fakeTransaction.rollback).toHaveBeenCalled();
  });

  // 正常な削除のテスト
  it('returns 204 and deletes review when ok', async () => {
    type FakeReviewWithDestroy = {
      get: (key: string) => number | null;
      destroy: ReturnType<typeof vi.fn>;
    };
    const fakeReview: FakeReviewWithDestroy = {
      get: (k: string) => (k === 'userId' ? 2 : null),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    const fakeTransaction = { commit: vi.fn(), rollback: vi.fn() };

    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview as unknown as ReviewInstance);
    vi.spyOn(sequelize, 'transaction').mockResolvedValue(fakeTransaction as unknown as Transaction);
    vi.spyOn(Comment, 'findOne').mockResolvedValue(null);

    const res = await request(app).delete('/api/reviews/8');
    expect(res.status).toBe(204);
    expect(fakeReview.destroy).toHaveBeenCalledWith({ transaction: fakeTransaction });
    expect(fakeTransaction.commit).toHaveBeenCalled();
  });

  // トランザクション失敗時の内部サーバーエラーのテスト
  it('returns 500 when transaction creation fails', async () => {
    type FakeReview = { get: (key: string) => number | null };
    const fakeReview: FakeReview = { get: (k: string) => (k === 'userId' ? 2 : null) };
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview as unknown as ReviewInstance);
    vi.spyOn(sequelize, 'transaction').mockRejectedValue(new Error('DB down'));

    const res = await request(app).delete('/api/reviews/10');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
