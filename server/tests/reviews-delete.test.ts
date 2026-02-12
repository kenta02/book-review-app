import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// modules under test
import reviewRouter from '../src/routes/reviews';
import Review from '../src/models/Review';
import Comment from '../src/models/Comment';
import { sequelize } from '../src/sequelize';

// Helper to mount router with optional auth middleware
function makeApp(setUserId?: number | null) {
  const app = express();
  app.use(express.json());
  // simple middleware to set req.userId when needed
  app.use((req: any, _res, next) => {
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
  it('returns 400 for invalid id (non-integer)', async () => {
    const spyFind = vi.spyOn(Review, 'findByPk');
    const res = await request(app).delete('/api/reviews/1.5');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REVIEW_ID');
    expect(spyFind).not.toHaveBeenCalled();
  });

  it('returns 401 when unauthenticated', async () => {
    const unauthApp = makeApp(undefined); // do not set userId
    const res = await request(unauthApp).delete('/api/reviews/1');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns 404 when review not found', async () => {
    vi.spyOn(Review, 'findByPk').mockResolvedValue(null as any);
    const res = await request(app).delete('/api/reviews/999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('REVIEW_NOT_FOUND');
  });

  it('returns 403 when not owner', async () => {
    const fakeReview = {
      get: (k: string) => (k === 'userId' ? 99 : null),
    } as any;
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview);

    const res = await request(app).delete('/api/reviews/5');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 409 when related comments exist', async () => {
    const fakeReview = { get: (k: string) => (k === 'userId' ? 2 : null) } as any;
    const fakeTransaction = { commit: vi.fn(), rollback: vi.fn() } as any;

    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview);
    vi.spyOn(sequelize, 'transaction').mockResolvedValue(fakeTransaction);
    vi.spyOn(Comment, 'findOne').mockResolvedValue({ id: 1 } as any);

    const res = await request(app).delete('/api/reviews/7');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('RELATED_DATA_EXISTS');
    expect(fakeTransaction.rollback).toHaveBeenCalled();
  });

  it('returns 204 and deletes review when ok', async () => {
    const fakeReview = { get: (k: string) => (k === 'userId' ? 2 : null), destroy: vi.fn().mockResolvedValue(undefined) } as any;
    const fakeTransaction = { commit: vi.fn(), rollback: vi.fn() } as any;

    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview);
    vi.spyOn(sequelize, 'transaction').mockResolvedValue(fakeTransaction);
    vi.spyOn(Comment, 'findOne').mockResolvedValue(null as any);

    const res = await request(app).delete('/api/reviews/8');
    expect(res.status).toBe(204);
    expect(fakeReview.destroy).toHaveBeenCalledWith({ transaction: fakeTransaction });
    expect(fakeTransaction.commit).toHaveBeenCalled();
  });

  it('returns 500 when transaction creation fails', async () => {
    const fakeReview = { get: (k: string) => (k === 'userId' ? 2 : null) } as any;
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview);
    vi.spyOn(sequelize, 'transaction').mockRejectedValue(new Error('DB down'));

    const res = await request(app).delete('/api/reviews/10');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
