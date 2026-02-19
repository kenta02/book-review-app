import express, { Request, Response } from 'express';

import Book from '../models/Book';
import { BookParams } from '../types/route-params';
import Review from '../models/Review';
import Favorite from '../models/Favorite';
import { ERROR_MESSAGES } from '../constants/error-messages';
import * as reviewService from '../services/review.service';

const router = express.Router();

/**
 * GET /api/books - 書籍一覧取得
 *
 * ページネーション対応（N+1 クエリ回避）
 *
 * Query parameters:
 *   page?: number (default 1)
 *   limit?: number (default 20)
 * Responses:
 * 200 OK: books list with pagination
 * 500 Internal Server Error
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // findAndCountAll で総件数と該当行を同時取得（N+1 クエリ回避）
    const { count, rows } = await Book.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    console.info(`Fetching books - page: ${page}, limit: ${limit}, offset: ${offset}`);
    console.info(`Found ${count} books in total`);

    res.json({
      success: true,
      data: {
        books: rows,
        pagination: {
          currentPage: page,
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

/**
 * GET /api/books/:id - 書籍詳細取得
 *
 * Path parameters:
 *   id: number (required, must be positive integer)
 * Responses:
 * 200 OK: book details
 * 400 Bad Request: invalid id
 * 404 Not Found: book not found
 * 500 Internal Server Error
 */
router.get('/:id', async (req: Request<BookParams>, res: Response) => {
  try {
    const bookId = Number(req.params.id);
    const errors = [];

    // idの数値チェック
    if (!Number.isInteger(bookId) || bookId <= 0) {
      errors.push({
        field: 'id',
        message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
      });
    }
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: 'INVALID_BOOK_ID',
          details: errors,
        },
      });
    }

    // 成功時
    const bookInfo = await Book.findByPk(bookId);

    if (bookInfo) {
      return res.json({ success: true, data: bookInfo });
    } else {
      // 書籍がない場合
      return res.status(404).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.BOOK_NOT_FOUND,
          code: 'BOOK_NOT_FOUND',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching book:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

/**
 * POST /api/books - 新規書籍登録
 *
 * Request body: {
 *   title: string (required, non-empty)
 *   author: string (required, non-empty)
 *   publicationYear?: number
 *   ISBN?: string (must be unique if provided)
 *   summary?: string
 * }
 * Responses:
 * 201 Created: book created
 * 400 Bad Request: validation error
 * 409 Conflict: ISBN already exists
 * 500 Internal Server Error
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, author, publicationYear, ISBN, summary } = req.body;
    console.debug('Received new book data:', req.body);
    const errors = [];

    if (!title || title.trim() === '') {
      errors.push({ field: 'title', message: ERROR_MESSAGES.REQUIRED_TITLE });
    }
    if (!author || author.trim() === '') {
      errors.push({ field: 'author', message: ERROR_MESSAGES.REQUIRED_AUTHOR });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.VALIDATION_FAILED,
          code: 'VALIDATION_ERROR',
          details: errors,
        },
      });
    }

    // ISBN 重複チェック: 一意の識別子として機能
    if (ISBN) {
      const existingBook = await Book.findOne({ where: { ISBN } });
      if (existingBook) {
        return res.status(409).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.DUPLICATE_ISBN,
            code: 'DUPLICATE_RESOURCE',
          },
        });
      }
    }

    const newBook = await Book.create({
      title,
      author,
      publicationYear,
      ISBN,
      summary,
    });

    res.status(201).json({
      success: true,
      data: newBook,
    });
  } catch (error) {
    console.error('Error creating new book:', error);
    res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

/**
 * PUT /api/books/:id - 書籍情報更新
 *
 * 部分更新対応（送られたフィールドのみを更新）
 *
 * Path parameters:
 *   id: number (required, must be positive integer)
 * Request body: {
 *   title?: string (non-empty if provided)
 *   author?: string (non-empty if provided)
 *   publicationYear?: number
 *   ISBN?: string (must be unique across other books if provided)
 *   summary?: string
 * }
 * Responses:
 * 200 OK: book updated
 * 400 Bad Request: invalid id or validation error
 * 404 Not Found: book not found
 * 409 Conflict: ISBN already exists
 * 500 Internal Server Error
 */
router.put('/:id', async (req: Request<BookParams>, res: Response) => {
  try {
    const bookId = Number(req.params.id);
    const { title, author, publicationYear, ISBN, summary } = req.body;
    console.debug('Received update data for bookId:', bookId, req.body);
    const errors = [];

    if (!Number.isInteger(bookId) || bookId <= 0) {
      // idの数値チェック
      errors.push({
        field: 'id',
        message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT,
      });
    }
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: 'INVALID_BOOK_ID',
          details: errors,
        },
      });
    }

    // 書籍の存在チェック
    const bookInfo = await Book.findByPk(bookId);

    if (!bookInfo) {
      return res.status(404).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.BOOK_NOT_FOUND,
          code: 'BOOK_NOT_FOUND',
        },
      });
    }

    // title, author のバリデーション（送られた場合のみチェック）
    if (title !== undefined && (!title || title.trim() === '')) {
      errors.push({ field: 'title', message: ERROR_MESSAGES.REQUIRED_TITLE });
    }
    if (author !== undefined && (!author || author.trim() === '')) {
      errors.push({ field: 'author', message: ERROR_MESSAGES.REQUIRED_AUTHOR });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.VALIDATION_FAILED,
          code: 'VALIDATION_ERROR',
          details: errors,
        },
      });
    }

    // ISBN 重複チェック（送られた場合のみ）
    if (ISBN !== undefined) {
      const isISBN = await Book.findOne({ where: { ISBN } });
      if (isISBN && isISBN.get('id') !== bookId) {
        return res.status(409).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.DUPLICATE_ISBN,
            code: 'DUPLICATE_RESOURCE',
          },
        });
      }
    }

    // 部分更新：送られたフィールドのみを更新
    const updateData: Partial<{
      title: string;
      author: string;
      publicationYear: number;
      ISBN: string;
      summary: string;
    }> = {};

    if (title !== undefined) updateData.title = title;
    if (author !== undefined) updateData.author = author;
    if (publicationYear !== undefined) updateData.publicationYear = publicationYear;
    if (ISBN !== undefined) updateData.ISBN = ISBN;
    if (summary !== undefined) updateData.summary = summary;

    await bookInfo.update(updateData);

    res.json({
      success: true,
      data: bookInfo,
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

/**
 * GET /api/books/:bookId/reviews - 特定書籍のレビュー一覧取得
 *
 * パスパラメータで指定された書籍 ID のレビュー一覧を取得
 * reviewService.listReviews を再利用するthin wrapper
 *
 * Path parameters:
 *   bookId: number (required, must be positive integer)
 * Query parameters:
 *   page?: number (default 1)
 *   limit?: number (default 20)
 * Responses:
 * 200 OK: reviews list with pagination
 * 400 Bad Request: invalid bookId or query parameters
 * 404 Not Found: book not found
 * 500 Internal Server Error
 */
router.get('/:bookId/reviews', async (req: Request<{ bookId: string }>, res: Response) => {
  try {
    const bookId = Number(req.params.bookId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // bookId の数値チェック
    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: 'INVALID_BOOK_ID',
          details: [{ field: 'bookId', message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT }],
        },
      });
    }

    // 書籍の存在確認
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.BOOK_NOT_FOUND,
          code: 'BOOK_NOT_FOUND',
        },
      });
    }

    // reviewService.listReviews を呼び出し（既存ロジック再利用）
    const result = await reviewService.listReviews({
      page,
      limit,
      bookId,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching reviews for book:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

/**
 * DELETE /api/books/:id - 書籍削除
 *
 * 関連するレビューやお気に入りが存在する場合は削除できません
 *
 * Path parameters:
 *   id: number (required, must be positive integer)
 * Responses:
 * 204 No Content: book deleted
 * 400 Bad Request: invalid id
 * 404 Not Found: book not found
 * 409 Conflict: related reviews or favorites exist
 * 500 Internal Server Error
 */
router.delete('/:id', async (req: Request<BookParams>, res: Response) => {
  try {
    // パスパラメータ id の形式チェック（整数かつ 1 以上）
    const bookId = Number(req.params.id);
    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_BOOK_ID,
          code: 'INVALID_BOOK_ID',
          details: [{ field: 'id', message: ERROR_MESSAGES.ID_MUST_BE_POSITIVE_INT }],
        },
      });
    }

    // 書籍の存在チェック
    const bookInfo = await Book.findByPk(bookId);

    if (!bookInfo) {
      return res.status(404).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.BOOK_NOT_FOUND,
          code: 'BOOK_NOT_FOUND',
        },
      });
    }

    // .count() を使ってReviewとFavoriteの関連データの件数を取得
    const results = await Promise.all([
      Review.count({ where: { bookId } }),
      Favorite.count({ where: { bookId } }),
    ]);

    const reviewCount = results[0];
    const favoriteCount = results[1];

    // 関連データが存在する場合は削除しない
    if (reviewCount > 0 || favoriteCount > 0) {
      return res.status(409).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.RELATED_DATA_EXISTS,
          code: 'RELATED_DATA_EXISTS',
        },
      });
    } else {
      // 関連データがなければ書籍を削除
      await bookInfo.destroy();
      // 成功時は204 No Contentを返す
      return res.sendStatus(204);
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
});

export default router;
