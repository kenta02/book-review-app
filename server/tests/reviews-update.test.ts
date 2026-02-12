import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import reviewRouter from '../src/routes/reviews';
import Review from '../src/models/Review';

function makeApp(setUserId?: number | null) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
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
  it('returns 400 for invalid id (non-integer)', async () => {
    const spyFind = vi.spyOn(Review, 'findByPk');
    const res = await request(app).put('/api/reviews/1.5').send({ content: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REVIEW_ID');
    expect(spyFind).not.toHaveBeenCalled();
  });

  it('returns 401 when unauthenticated', async () => {
    const unauthApp = makeApp(undefined);
    const res = await request(unauthApp).put('/api/reviews/1').send({ content: 'ok' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns 404 when review not found', async () => {
    vi.spyOn(Review, 'findByPk').mockResolvedValue(null as any);
    const res = await request(app).put('/api/reviews/999').send({ content: 'ok' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('REVIEW_NOT_FOUND');
  });

  it('returns 403 when not owner', async () => {
    const fakeReview = { get: (k: string) => (k === 'userId' ? 99 : null) } as any;
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview);

    const res = await request(app).put('/api/reviews/5').send({ content: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 400 when content is missing or invalid', async () => {
    const fakeReview = { get: (k: string) => (k === 'userId' ? 2 : null) } as any;
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview);

    const res1 = await request(app).put('/api/reviews/3').send({ content: '' });
    expect(res1.status).toBe(400);
    expect(res1.body.error.code).toBe('VALIDATION_ERROR');
    expect(res1.body.error.details[0].field).toBe('content');

    const long = 'a'.repeat(2000);
    const res2 = await request(app).put('/api/reviews/3').send({ content: long });
    expect(res2.status).toBe(400);
    expect(res2.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 200 and updated review when ok', async () => {
    const fakeReview = {
      get: (k: string) => (k === 'userId' ? 2 : null),
      update: vi.fn().mockResolvedValue({ id: 7, content: 'updated', userId: 2 }),
    } as any;
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview);

    const res = await request(app).put('/api/reviews/7').send({ content: 'updated' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
    expect(fakeReview.update).toHaveBeenCalledWith({ content: 'updated' });
  });

  it('returns 500 when update fails', async () => {
    const fakeReview = {
      get: (k: string) => (k === 'userId' ? 2 : null),
      update: vi.fn().mockRejectedValue(new Error('DB fail')),
    } as any;
    vi.spyOn(Review, 'findByPk').mockResolvedValue(fakeReview);

    const res = await request(app).put('/api/reviews/9').send({ content: 'ok' });
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
