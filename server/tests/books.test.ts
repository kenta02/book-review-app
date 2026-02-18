import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { SpyInstance } from 'vitest';
import type { FindAndCountOptions } from 'sequelize';

import bookRouter from '../src/routes/books';
import Book from '../src/models/Book';
import Review from '../src/models/Review';
import Favorite from '../src/models/Favorite';

// このファイルの目的：書籍 API の CRUD とページネーションを検証するテスト
// - findAndCountAll のモックを用いてページング動作を確認

type BookInstance = InstanceType<typeof Book>;

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

// GET /api/books のページネーション動作を確認
describe('GET /api/books', () => {
  it('returns paginated books', async () => {
    const book1 = { id: 1 } as unknown as BookInstance;
    const book2 = { id: 2 } as unknown as BookInstance;
    // Sequelize の findAndCountAll は overload によって
    // `count` の型が number | GroupedCountResultItem[] と変わるため
    // テスト上は any へダウンキャストしてモックします。
    const spy = vi.spyOn(Book, 'findAndCountAll') as unknown as SpyInstance<
      [FindAndCountOptions?],
      { rows: BookInstance[]; count: number }
    >;
    spy.mockResolvedValue({ rows: [book1, book2], count: 2 });

    const res = await request(app).get('/api/books?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.books).toHaveLength(2);
    expect(res.body.data.pagination.totalItems).toBe(2);
  });
});

// GET /api/books/:id の入力チェック・存在チェック
describe('GET /api/books/:id', () => {
  it('returns 400 for invalid id', async () => {
    const spyFind = vi.spyOn(Book, 'findByPk');
    const res = await request(app).get('/api/books/0');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_BOOK_ID');
    expect(spyFind).not.toHaveBeenCalled();
  });

  it('returns 404 when book not found', async () => {
    vi.spyOn(Book, 'findByPk').mockResolvedValue(null);
    const res = await request(app).get('/api/books/999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BOOK_NOT_FOUND');
  });

  it('returns 200 when book found', async () => {
    const book = { id: 1 } as unknown as BookInstance;
    vi.spyOn(Book, 'findByPk').mockResolvedValue(book);
    const res = await request(app).get('/api/books/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(1);
  });
});

// POST /api/books のバリデーションと重複チェック
describe('POST /api/books', () => {
  it('returns 400 when validation fails', async () => {
    const res = await request(app).post('/api/books').send({ title: '', author: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 when ISBN already exists', async () => {
    const book = { id: 1 } as unknown as BookInstance;
    vi.spyOn(Book, 'findOne').mockResolvedValue(book);
    const res = await request(app).post('/api/books').send({
      title: 't',
      author: 'a',
      ISBN: 'dup',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_RESOURCE');
  });

  it('returns 201 when created', async () => {
    vi.spyOn(Book, 'findOne').mockResolvedValue(null);
    const book = { id: 1 } as unknown as BookInstance;
    vi.spyOn(Book, 'create').mockResolvedValue(book);
    const res = await request(app).post('/api/books').send({
      title: 't',
      author: 'a',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

// PUT /api/books/:id の検証と更新動作
describe('PUT /api/books/:id', () => {
  it('returns 400 for invalid id', async () => {
    const res = await request(app).put('/api/books/0').send({ title: 't' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_BOOK_ID');
  });

  it('returns 404 when book not found', async () => {
    vi.spyOn(Book, 'findByPk').mockResolvedValue(null);
    const res = await request(app).put('/api/books/999').send({ title: 't' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BOOK_NOT_FOUND');
  });

  it('returns 400 when validation fails for provided fields', async () => {
    const book = { id: 1 } as unknown as BookInstance;
    vi.spyOn(Book, 'findByPk').mockResolvedValue(book);
    const res = await request(app).put('/api/books/1').send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 when ISBN duplicates another book', async () => {
    const book = { id: 1 } as unknown as BookInstance;
    vi.spyOn(Book, 'findByPk').mockResolvedValue(book);
    vi.spyOn(Book, 'findOne').mockResolvedValue({
      get: (key: string) => (key === 'id' ? 2 : null),
    } as unknown as BookInstance);

    const res = await request(app).put('/api/books/1').send({ ISBN: 'dup' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_RESOURCE');
  });

  it('returns 200 when updated', async () => {
    const fakeBook = { update: vi.fn().mockResolvedValue(undefined) };
    vi.spyOn(Book, 'findByPk').mockResolvedValue(fakeBook as unknown as BookInstance);
    const res = await request(app).put('/api/books/1').send({ title: 't' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(fakeBook.update).toHaveBeenCalled();
  });
});

// DELETE /api/books/:id の関連データチェック
describe('DELETE /api/books/:id', () => {
  it('returns 400 for invalid id', async () => {
    const res = await request(app).delete('/api/books/0');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_BOOK_ID');
  });

  it('returns 404 when book not found', async () => {
    vi.spyOn(Book, 'findByPk').mockResolvedValue(null);
    const res = await request(app).delete('/api/books/999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BOOK_NOT_FOUND');
  });

  it('returns 409 when related data exists', async () => {
    const book = { destroy: vi.fn() } as unknown as BookInstance;
    vi.spyOn(Book, 'findByPk').mockResolvedValue(book);
    vi.spyOn(Review, 'count').mockResolvedValue(1);
    vi.spyOn(Favorite, 'count').mockResolvedValue(0);

    const res = await request(app).delete('/api/books/1');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('RELATED_DATA_EXISTS');
  });

  it('returns 204 when deleted', async () => {
    const fakeBook = { destroy: vi.fn().mockResolvedValue(undefined) } as unknown as BookInstance;
    vi.spyOn(Book, 'findByPk').mockResolvedValue(fakeBook as unknown as BookInstance);
    vi.spyOn(Review, 'count').mockResolvedValue(0);
    vi.spyOn(Favorite, 'count').mockResolvedValue(0);

    const res = await request(app).delete('/api/books/1');
    expect(res.status).toBe(204);
    expect(fakeBook.destroy).toHaveBeenCalled();
  });
});
