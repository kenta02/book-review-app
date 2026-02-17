import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// モジュールをモックしてから app を import
vi.mock('../src/services/comment.service', () => {
  class ApiError extends Error {
    constructor(
      public statusCode: number,
      public code: string,
      message: string,
      public details?: any
    ) {
      super(message);
    }
  }

  return {
    ApiError,
    listComments: vi.fn(),
    createComment: vi.fn(),
  };
});

// モック認証ミドルウェア（テスト時は req.userId を直接セットする）
vi.mock('../src/middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.userId = 2;
    next();
  },
}));

import app from '../src/app';
import * as commentService from '../src/services/comment.service';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Comments routes', () => {
  it('GET /api/reviews/:reviewId/comments - returns comments from service', async () => {
    const fake = [
      {
        id: 1,
        content: 'parent',
        parentId: null,
        reviewId: 10,
        userId: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
      },
    ];

    (commentService.listComments as any).mockResolvedValue(fake);

    const res = await request(app).get('/api/reviews/10/comments');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.comments)).toBe(true);
    expect(res.body.data.comments[0]).toMatchObject({ id: 1, content: 'parent' });
  });

  it('GET /api/reviews/:reviewId/comments - invalid reviewId returns 400', async () => {
    const res = await request(app).get('/api/reviews/abc/comments');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REVIEW_ID');
  });

  it('POST /api/reviews/:reviewId/comments - creates comment when authenticated', async () => {
    const created = {
      id: 100,
      content: 'ok',
      parentId: null,
      reviewId: 10,
      userId: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (commentService.createComment as any).mockResolvedValue(created);

    const res = await request(app).post('/api/reviews/10/comments').send({ content: 'ok' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ id: 100, content: 'ok' });
    expect((commentService.createComment as any).mock.calls.length).toBe(1);
  });

  it('POST /api/reviews/:reviewId/comments - validation error from parser returns 400', async () => {
    const res = await request(app).post('/api/reviews/10/comments').send({ content: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('POST /api/reviews/:reviewId/comments - service validation error (parent not found) is forwarded', async () => {
    const ApiErrorClass = (commentService as any).ApiError as any;
    (commentService.createComment as any).mockRejectedValue(
      new ApiErrorClass(400, 'VALIDATION_ERROR', 'Validation failed', [
        { field: 'parentId', message: '指定された親コメントが存在しません。' },
      ])
    );

    const res = await request(app)
      .post('/api/reviews/10/comments')
      .send({ content: 'ok', parentId: 999 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('parentId');
  });
});
