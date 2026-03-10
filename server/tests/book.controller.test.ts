import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ERROR_MESSAGES } from '../src/constants/error-messages';
import {
  createBook,
  deleteBook,
  getBook,
  listBookReviews,
  listBooks,
  updateBook,
} from '../src/controllers/book.controller';
import { ApiError } from '../src/errors/ApiError';
import * as bookService from '../src/services/book.service';

// controller 単体テストでは service だけを差し替え、HTTP 変換責務に集中する。
vi.mock('../src/services/book.service', () => ({
  listBooks: vi.fn(),
  getBookById: vi.fn(),
  createBook: vi.fn(),
  updateBook: vi.fn(),
  listBookReviews: vi.fn(),
  deleteBook: vi.fn(),
}));

type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  sendStatus: ReturnType<typeof vi.fn>;
};

/**
 * controller テスト用に最小構成の Request オブジェクトを作る。
 *
 * @param input - params, query, body の任意セット
 * @returns Request 互換オブジェクト
 */
function makeRequest({
  params = {},
  query = {},
  body = {},
}: {
  params?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
} = {}): Request {
  return {
    params,
    query,
    body,
  } as unknown as Request;
}

/**
 * controller テスト用に chain 可能な Response モックを作る。
 *
 * @returns status/json/sendStatus を持つ Response モック
 */
function makeResponse(): MockResponse {
  // Express Response のうち今回使うメソッドだけを最小構成で用意する。
  const res = {} as MockResponse;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  return res;
}

describe('book.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // テスト出力を静かにしつつ、呼び出し自体は壊していないことを保つ。
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  describe('listBooks', () => {
    it('returns 200 with paginated books on success', async () => {
      // validator 通過後に service の戻り値をそのまま JSON 化する。
      const req = makeRequest({ query: { page: '2', limit: '3' } });
      const res = makeResponse();
      const data = {
        books: [{ id: 10 }],
        pagination: { currentPage: 2, totalItems: 5, totalPages: 2, itemsPerPage: 3 },
      };

      vi.mocked(bookService.listBooks).mockResolvedValue(data);

      await listBooks(req, res);

      expect(bookService.listBooks).toHaveBeenCalledWith({ page: 2, limit: 3 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('returns 500 when service throws a normal Error', async () => {
      // 想定外エラーは共通の INTERNAL_SERVER_ERROR へ畳み込む。
      const req = makeRequest();
      const res = makeResponse();

      vi.mocked(bookService.listBooks).mockRejectedValue(new Error('boom'));

      await listBooks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
          code: 'INTERNAL_SERVER_ERROR',
        },
      });
    });

    it('returns 400 when pagination validation fails', async () => {
      const req = makeRequest({ query: { page: '0' } });
      const res = makeResponse();

      await listBooks(req, res);

      expect(bookService.listBooks).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.VALIDATION_FAILED,
          code: 'VALIDATION_ERROR',
          details: [{ field: 'page', message: 'pageは1以上の整数で指定してください。' }],
        },
      });
    });
  });

  describe('getBook', () => {
    it('returns 400 for an invalid id', async () => {
      // validator で落ちた場合は service を呼ばない。
      const req = makeRequest({ params: { id: '0' } });
      const res = makeResponse();

      await getBook(req, res);

      expect(bookService.getBookById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: 'INVALID_BOOK_ID',
          details: [
            {
              field: 'id',
              message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
              code: 'INVALID_BOOK_ID',
            },
          ],
        },
      });
    });

    it('returns 404 when service throws BOOK_NOT_FOUND', async () => {
      // ApiError は status/code を保ったままレスポンスへ変換する。
      const req = makeRequest({ params: { id: '8' } });
      const res = makeResponse();

      vi.mocked(bookService.getBookById).mockRejectedValue(
        new ApiError(404, 'BOOK_NOT_FOUND', ERROR_MESSAGES.BOOK_NOT_FOUND)
      );

      await getBook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.BOOK_NOT_FOUND,
          code: 'BOOK_NOT_FOUND',
        },
      });
    });

    it('returns 200 with book data on success', async () => {
      const req = makeRequest({ params: { id: '8' } });
      const res = makeResponse();
      const book = { id: 8, title: 'Refactoring' };

      vi.mocked(bookService.getBookById).mockResolvedValue(book);

      await getBook(req, res);

      expect(bookService.getBookById).toHaveBeenCalledWith(8);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: book });
    });
  });

  describe('createBook', () => {
    it('returns 400 when validation fails', async () => {
      // create の必須項目エラーが VALIDATION_ERROR へ変換されることを確認する。
      const req = makeRequest({ body: { title: '', author: '' } });
      const res = makeResponse();

      await createBook(req, res);

      expect(bookService.createBook).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.VALIDATION_FAILED,
          code: 'VALIDATION_ERROR',
          details: [
            { field: 'title', message: ERROR_MESSAGES.REQUIRED_TITLE },
            { field: 'author', message: ERROR_MESSAGES.REQUIRED_AUTHOR },
          ],
        },
      });
    });

    it('returns 409 when service throws DUPLICATE_RESOURCE', async () => {
      const req = makeRequest({ body: { title: 't', author: 'a', ISBN: 'dup' } });
      const res = makeResponse();

      vi.mocked(bookService.createBook).mockRejectedValue(
        new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_ISBN)
      );

      await createBook(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.DUPLICATE_ISBN,
          code: 'DUPLICATE_RESOURCE',
        },
      });
    });

    it('returns 201 when creation succeeds', async () => {
      // validator が補完した payload を service へ渡すことも一緒に確認する。
      const req = makeRequest({ body: { title: 't', author: 'a' } });
      const res = makeResponse();
      const createdBook = { id: 1, title: 't', author: 'a' };

      vi.mocked(bookService.createBook).mockResolvedValue(createdBook);

      await createBook(req, res);

      expect(bookService.createBook).toHaveBeenCalledWith({
        title: 't',
        author: 'a',
        publicationYear: undefined,
        ISBN: undefined,
        summary: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: createdBook });
    });
  });

  describe('updateBook', () => {
    it('returns 400 when id is invalid', async () => {
      // id エラー時は INVALID_BOOK_ID を優先して返す。
      const req = makeRequest({ params: { id: '0' }, body: { title: 'updated' } });
      const res = makeResponse();

      await updateBook(req, res);

      expect(bookService.updateBook).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: 'INVALID_BOOK_ID',
          details: [
            {
              field: 'id',
              message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
              code: 'INVALID_BOOK_ID',
            },
          ],
        },
      });
    });

    it('returns 400 when title or author validation fails', async () => {
      // payload エラー時は VALIDATION_ERROR になることを確認する。
      const req = makeRequest({ params: { id: '1' }, body: { title: '' } });
      const res = makeResponse();

      await updateBook(req, res);

      expect(bookService.updateBook).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.VALIDATION_FAILED,
          code: 'VALIDATION_ERROR',
          details: [{ field: 'title', message: ERROR_MESSAGES.REQUIRED_TITLE }],
        },
      });
    });

    it('returns 404 when service throws BOOK_NOT_FOUND', async () => {
      const req = makeRequest({ params: { id: '1' }, body: { title: 'updated' } });
      const res = makeResponse();

      vi.mocked(bookService.updateBook).mockRejectedValue(
        new ApiError(404, 'BOOK_NOT_FOUND', ERROR_MESSAGES.BOOK_NOT_FOUND)
      );

      await updateBook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.BOOK_NOT_FOUND,
          code: 'BOOK_NOT_FOUND',
        },
      });
    });

    it('returns 409 when service throws DUPLICATE_RESOURCE', async () => {
      const req = makeRequest({ params: { id: '1' }, body: { ISBN: 'dup' } });
      const res = makeResponse();

      vi.mocked(bookService.updateBook).mockRejectedValue(
        new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_ISBN)
      );

      await updateBook(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.DUPLICATE_ISBN,
          code: 'DUPLICATE_RESOURCE',
        },
      });
    });

    it('returns 200 when update succeeds', async () => {
      // 部分更新 payload が service に期待通り渡ることを確認する。
      const req = makeRequest({ params: { id: '1' }, body: { summary: 'new summary' } });
      const res = makeResponse();
      const updatedBook = { id: 1, summary: 'new summary' };

      vi.mocked(bookService.updateBook).mockResolvedValue(updatedBook);

      await updateBook(req, res);

      expect(bookService.updateBook).toHaveBeenCalledWith({
        bookId: 1,
        title: undefined,
        author: undefined,
        publicationYear: undefined,
        ISBN: undefined,
        summary: 'new summary',
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedBook });
    });
  });

  describe('listBookReviews', () => {
    it('returns 400 for an invalid bookId', async () => {
      // reviews 配下でも books 用 id バリデーションを共有する。
      const req = makeRequest({ params: { bookId: '0' } });
      const res = makeResponse();

      await listBookReviews(req, res);

      expect(bookService.listBookReviews).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: 'INVALID_BOOK_ID',
          details: [
            {
              field: 'bookId',
              message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
              code: 'INVALID_BOOK_ID',
            },
          ],
        },
      });
    });

    it('returns 404 when service throws BOOK_NOT_FOUND', async () => {
      const req = makeRequest({ params: { bookId: '1' } });
      const res = makeResponse();

      vi.mocked(bookService.listBookReviews).mockRejectedValue(
        new ApiError(404, 'BOOK_NOT_FOUND', ERROR_MESSAGES.BOOK_NOT_FOUND)
      );

      await listBookReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.BOOK_NOT_FOUND,
          code: 'BOOK_NOT_FOUND',
        },
      });
    });

    it('returns 400 when pagination validation fails', async () => {
      const req = makeRequest({ params: { bookId: '1' }, query: { limit: '0' } });
      const res = makeResponse();

      await listBookReviews(req, res);

      expect(bookService.listBookReviews).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.VALIDATION_FAILED,
          code: 'VALIDATION_ERROR',
          details: [{ field: 'limit', message: 'limitは1以上の整数で指定してください。' }],
        },
      });
    });

    it('returns 200 with reviews data on success', async () => {
      // bookId と pagination が正規化された値で service に渡ることを確認する。
      const req = makeRequest({ params: { bookId: '1' }, query: { page: '2', limit: '4' } });
      const res = makeResponse();
      const data = {
        reviews: [{ id: 100 }],
        pagination: { currentPage: 2, totalItems: 1, totalPages: 1, itemsPerPage: 4 },
      };

      vi.mocked(bookService.listBookReviews).mockResolvedValue(data);

      await listBookReviews(req, res);

      expect(bookService.listBookReviews).toHaveBeenCalledWith({
        bookId: 1,
        page: 2,
        limit: 4,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('deleteBook', () => {
    it('returns 400 for an invalid id', async () => {
      // delete も不正 id の時点で service を呼ばない。
      const req = makeRequest({ params: { id: '0' } });
      const res = makeResponse();

      await deleteBook(req, res);

      expect(bookService.deleteBook).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: 'INVALID_BOOK_ID',
          details: [
            {
              field: 'id',
              message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
              code: 'INVALID_BOOK_ID',
            },
          ],
        },
      });
    });

    it('returns 409 when service throws RELATED_DATA_EXISTS', async () => {
      const req = makeRequest({ params: { id: '1' } });
      const res = makeResponse();

      vi.mocked(bookService.deleteBook).mockRejectedValue(
        new ApiError(409, 'RELATED_DATA_EXISTS', ERROR_MESSAGES.RELATED_DATA_EXISTS)
      );

      await deleteBook(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: ERROR_MESSAGES.RELATED_DATA_EXISTS,
          code: 'RELATED_DATA_EXISTS',
        },
      });
    });

    it('returns 204 via sendStatus when deletion succeeds', async () => {
      // delete 成功時は body を返さず sendStatus(204) を使う責務を固定する。
      const req = makeRequest({ params: { id: '1' } });
      const res = makeResponse();

      vi.mocked(bookService.deleteBook).mockResolvedValue(undefined);

      await deleteBook(req, res);

      expect(bookService.deleteBook).toHaveBeenCalledWith(1);
      expect(res.sendStatus).toHaveBeenCalledWith(204);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
