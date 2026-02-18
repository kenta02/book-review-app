import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SpyInstance } from 'vitest';

import { ApiError } from '../src/errors/ApiError';
import { ERROR_MESSAGES } from '../src/constants/error-messages';

// テスト概要：コメント機能のルートを検証します。
// - GET/POST の正常系とバリデーション、サービス層の例外伝播を確認

// モジュールをモックしてから app を import
vi.mock('../src/services/comment.service', () => {
  return {
    ApiError,
    listComments: vi.fn(),
    createComment: vi.fn(),
  };
});

// モック認証ミドルウェア（テスト時は req.userId を直接セットする）
vi.mock('../src/middleware/auth', () => ({
  authenticateToken: (req: { userId?: number }, _res: unknown, next: () => void) => {
    req.userId = 2;
    next();
  },
}));

import app from '../src/app';
import * as commentService from '../src/services/comment.service';

beforeEach(() => {
  vi.restoreAllMocks();
});

// コメント一覧取得と投稿の振る舞いを確認
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

    const listCommentsMock = commentService.listComments as unknown as SpyInstance<
      [number],
      Promise<typeof fake>
    >;
    listCommentsMock.mockResolvedValue(fake);

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

    const createCommentMock = commentService.createComment as unknown as SpyInstance<
      [unknown],
      Promise<typeof created>
    >;
    createCommentMock.mockResolvedValue(created);

    const res = await request(app).post('/api/reviews/10/comments').send({ content: 'ok' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ id: 100, content: 'ok' });
    expect(createCommentMock.mock.calls.length).toBe(1);
  });

  it('POST /api/reviews/:reviewId/comments - validation error from parser returns 400', async () => {
    const res = await request(app).post('/api/reviews/10/comments').send({ content: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('POST /api/reviews/:reviewId/comments - service validation error (parent not found) is forwarded', async () => {
    // ApiError は services モジュールのエクスポートではないため、
    // テスト内では errors モジュールから直接参照する（型エラー回避）
    const ApiErrorClass = ApiError;
    const createCommentMock = commentService.createComment as unknown as SpyInstance<
      [unknown],
      Promise<unknown>
    >;
    createCommentMock.mockRejectedValue(
      new ApiErrorClass(400, 'VALIDATION_ERROR', ERROR_MESSAGES.VALIDATION_FAILED, [
        { field: 'parentId', message: ERROR_MESSAGES.PARENT_COMMENT_NOT_FOUND },
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
