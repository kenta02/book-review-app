import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { SpyInstance } from 'vitest';

import bookRouter from '../src/routes/books';
import Book from '../src/models/Book';
import Review from '../src/models/Review';
import * as reviewService from '../src/services/review.service';

// 目的：GET /api/books/:bookId/reviews エンドポイントをテスト
// - 特定書籍のレビュー一覧取得の正常系／異常系を検証
// - reviewService.listReviews をモックして DB 依存を排除

type BookInstance = InstanceType<typeof Book>;
type ReviewInstance = InstanceType<typeof Review>;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/books', bookRouter);
  return app;
}

let app: express.Express;

beforeEach(() => {
  app = makeApp();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/books/:bookId/reviews', () => {
  it('特定書籍のレビュー一覧をページネーション付きで取得できる', async () => {
    const testBookId = 1;
    const mockReviews = [
      { id: 1, bookId: testBookId, userId: 1, content: 'Great!', rating: 5 } as unknown as ReviewInstance,
      { id: 2, bookId: testBookId, userId: 1, content: 'Good', rating: 4 } as unknown as ReviewInstance,
    ];

    // Book.findByPk をモック
    const bookSpy = vi.spyOn(Book, 'findByPk');
    bookSpy.mockResolvedValue({ id: testBookId } as unknown as BookInstance);

    // reviewService.listReviews をモック
    const reviewServiceSpy = vi.spyOn(reviewService, 'listReviews') as unknown as SpyInstance;
    reviewServiceSpy.mockResolvedValue({
      reviews: mockReviews,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 2,
        itemsPerPage: 20,
      },
    });

    const res = await request(app)
      .get(`/api/books/${testBookId}/reviews`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.reviews).toHaveLength(2);
    expect(res.body.data.pagination.currentPage).toBe(1);
  });

  it('ページネーションパラメータを受け付ける', async () => {
    const testBookId = 1;
    const bookSpy = vi.spyOn(Book, 'findByPk');
    bookSpy.mockResolvedValue({ id: testBookId } as unknown as BookInstance);

    const reviewServiceSpy = vi.spyOn(reviewService, 'listReviews') as unknown as SpyInstance;
    reviewServiceSpy.mockResolvedValue({
      reviews: [],
      pagination: {
        currentPage: 2,
        totalPages: 3,
        totalItems: 50,
        itemsPerPage: 10,
      },
    });

    const res = await request(app)
      .get(`/api/books/${testBookId}/reviews`)
      .query({ page: 2, limit: 10 })
      .expect(200);

    expect(res.body.data.pagination.currentPage).toBe(2);
    expect(res.body.data.pagination.itemsPerPage).toBe(10);
    // reviewService.listReviews が { page: 2, limit: 10, bookId: 1 } で呼ばれたことを確認
    expect(reviewServiceSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 10,
        bookId: testBookId,
      })
    );
  });

  it('無効な書籍 ID（非整数）を返す場合 400 エラー', async () => {
    const res = await request(app)
      .get('/api/books/invalid/reviews')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_BOOK_ID');
  });

  it('存在しない書籍 ID を返す場合 404 エラー', async () => {
    const bookSpy = vi.spyOn(Book, 'findByPk');
    bookSpy.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/books/99999/reviews')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BOOK_NOT_FOUND');
  });

  it('負の書籍 ID を返す場合 400 エラー', async () => {
    const res = await request(app)
      .get('/api/books/-1/reviews')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_BOOK_ID');
  });

  it('0 の書籍 ID を返す場合 400 エラー', async () => {
    const res = await request(app)
      .get('/api/books/0/reviews')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_BOOK_ID');
  });

  it('レビューが存在しない場合、空配列を返す', async () => {
    const testBookId = 2;
    const bookSpy = vi.spyOn(Book, 'findByPk');
    bookSpy.mockResolvedValue({ id: testBookId } as unknown as BookInstance);

    const reviewServiceSpy = vi.spyOn(reviewService, 'listReviews') as unknown as SpyInstance;
    reviewServiceSpy.mockResolvedValue({
      reviews: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 20,
      },
    });

    const res = await request(app)
      .get(`/api/books/${testBookId}/reviews`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.reviews).toEqual([]);
    expect(res.body.data.pagination.totalItems).toBe(0);
  });

  it('デフォルトページペーションパラメータ（page=1, limit=20）が設定される', async () => {
    const testBookId = 1;
    const bookSpy = vi.spyOn(Book, 'findByPk');
    bookSpy.mockResolvedValue({ id: testBookId } as unknown as BookInstance);

    const reviewServiceSpy = vi.spyOn(reviewService, 'listReviews') as unknown as SpyInstance;
    reviewServiceSpy.mockResolvedValue({
      reviews: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
      },
    });

    await request(app)
      .get(`/api/books/${testBookId}/reviews`)
      .expect(200);

    // デフォルト値で呼ばれたことを確認
    expect(reviewServiceSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 20,
        bookId: testBookId,
      })
    );
  });
});
