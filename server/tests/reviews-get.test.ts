import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SpyInstance } from 'vitest';
import type { FindAndCountOptions } from 'sequelize';

import app from '../src/app';
import Review from '../src/models/Review';

// テスト目的：app 経由の統合テストでレビュー一覧のフィルタ／ページングを検証
// - ルーター実装が期待するレスポンス形状を返すことを確認する

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/reviews (integration via app.ts)', () => {
  it('returns paginated reviews and uses the router implementation (not quick handler)', async () => {
    const fakeRows = [
      {
        id: 11,
        bookId: 5,
        userId: 2,
        content: 'nice book',
        rating: 4,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ];

    const spy = vi.spyOn(Review, 'findAndCountAll') as unknown as SpyInstance<
      [FindAndCountOptions?],
      { rows: typeof fakeRows; count: number }
    >;
    spy.mockResolvedValue({ rows: fakeRows, count: 1 });

    const res = await request(app).get('/api/reviews?bookId=5&page=1&limit=20');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // ルーターが reviews + pagination を返していることを検証
    expect(Array.isArray(res.body.data.reviews)).toBe(true);
    expect(res.body.data.reviews).toHaveLength(1);
    expect(res.body.data.pagination).toBeTruthy();
    expect(res.body.data.ok).toBeUndefined();

    const r = res.body.data.reviews[0];
    expect(r).toMatchObject({ id: 11, bookId: 5, content: 'nice book', rating: 4 });

    // DB 呼び出しがパース済みクエリを受け取っていることを検証
    expect(spy).toHaveBeenCalled();
    const calledArg = spy.mock.calls[0][0] as Record<string, unknown>;
    expect((calledArg.where as Record<string, number>).bookId).toBe(5);
    expect(calledArg.limit as number).toBe(20);
  });

  it('applies userId filter when provided', async () => {
    const spy = vi.spyOn(Review, 'findAndCountAll') as unknown as SpyInstance<
      [FindAndCountOptions?],
      { rows: unknown[]; count: number }
    >;
    spy.mockResolvedValue({ rows: [], count: 0 });
    const res = await request(app).get('/api/reviews?userId=3');
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalled();
    const calledArg = spy.mock.calls[0][0] as Record<string, unknown>;
    expect((calledArg.where as Record<string, number>).userId).toBe(3);
  });
});
