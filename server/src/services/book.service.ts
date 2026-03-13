import { ForeignKeyConstraintError, UniqueConstraintError, ValidationErrorItem } from 'sequelize';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import * as bookRepository from '../repositories/book.repository';
import { sequelize } from '../sequelize';
import * as reviewService from './review.service';
import { CreateBookDto, ListBooksQueryDto, UpdateBookDto } from '../modules/book/dto/book.dto';
import { logger } from '../utils/logger';

type ListBookReviewsInput = {
  bookId: number;
  page: number;
  limit: number;
};

function isIsbnUniqueConstraintError(error: unknown): boolean {
  const hasDuplicateFields = (paths: string[]) => {
    const hasIsbn = paths.includes('ISBN');
    const hasTitleAuthor = paths.includes('title') && paths.includes('author');
    return hasIsbn || hasTitleAuthor;
  };

  if (error instanceof UniqueConstraintError) {
    const paths = error.errors.map((item: ValidationErrorItem) => item.path || '').filter(Boolean);
    return hasDuplicateFields(paths);
  }

  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as {
    name?: string;
    errors?: Array<{ path?: string }>;
  };

  if (candidate.name !== 'SequelizeUniqueConstraintError') {
    return false;
  }

  const paths = (candidate.errors || []).map((item) => item.path || '').filter(Boolean);
  return hasDuplicateFields(paths);
}

/**
 * 書籍一覧をページング付きで返します。
 *
 * @param queryDto - 一覧取得クエリ
 * @returns 書籍一覧とページング情報
 */
export async function listBooks(queryDto: ListBooksQueryDto) {
  const { page, limit } = queryDto;
  const { count, rows } = await bookRepository.findBooksWithPagination(page, limit);

  logger.info('[BOOKS SERVICE] books fetched', {
    page,
    limit,
    totalItems: count,
  });

  return {
    books: rows,
    pagination: {
      currentPage: page,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      itemsPerPage: limit,
    },
  };
}

/**
 * 書籍詳細を取得します。
 *
 * @param bookId - 書籍 ID
 * @returns 取得した書籍
 * @throws ApiError 書籍が存在しない場合
 */
export async function getBookDetail(bookId: number) {
  const book = await bookRepository.findBookById(bookId);

  if (!book) {
    throw new ApiError(404, 'BOOK_NOT_FOUND', ERROR_MESSAGES.BOOK_NOT_FOUND);
  }

  return book;
}

/**
 * 書籍を新規作成します。
 *
 * 一意制約違反（ISBN 重複）は DB 例外を 409 へ変換します。
 *
 * @param input - 作成入力
 * @returns 作成済み書籍
 * @throws ApiError ISBN が重複している場合
 */
export async function createBook(input: CreateBookDto) {
  try {
    return await bookRepository.createBook(input);
  } catch (error) {
    if (isIsbnUniqueConstraintError(error)) {
      throw new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_ISBN);
    }
    throw error;
  }
}

/**
 * 書籍を部分更新します。
 *
 * 更新対象の存在確認を行い、一意制約違反（ISBN 重複）は 409 へ変換します。
 *
 * @param bookId - 書籍 ID
 * @param input - 更新対象フィールド
 * @returns 更新後の書籍
 * @throws ApiError 書籍が存在しない、または ISBN が重複している場合
 */
export async function updateBook(bookId: number, input: UpdateBookDto) {
  const book = await bookRepository.findBookById(bookId);

  if (!book) {
    throw new ApiError(404, 'BOOK_NOT_FOUND', ERROR_MESSAGES.BOOK_NOT_FOUND);
  }

  try {
    return await bookRepository.updateBook(book, input);
  } catch (error) {
    if (isIsbnUniqueConstraintError(error)) {
      throw new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_ISBN);
    }
    throw error;
  }
}

/**
 * 指定書籍のレビュー一覧を取得します。
 *
 * この service は books API と reviews API の橋渡し役で、
 * まず書籍の存在確認を行ってから reviewService に処理を委譲します。
 *
 * @param input - 書籍 ID とページング条件
 * @returns レビュー一覧とページング情報
 * @throws ApiError 書籍が存在しない場合
 */
export async function listBookReviews(input: ListBookReviewsInput) {
  const book = await bookRepository.findBookById(input.bookId);

  if (!book) {
    throw new ApiError(404, 'BOOK_NOT_FOUND', ERROR_MESSAGES.BOOK_NOT_FOUND);
  }

  return reviewService.listReviews(input);
}

/**
 * 書籍を削除します。
 *
 * 削除前にレビュー件数とお気に入り件数を確認し、
 * 関連データがある場合は削除を拒否します。
 *
 * @param bookId - 書籍 ID
 * @throws ApiError 書籍が存在しない、または関連データが残っている場合
 */
export async function deleteBook(bookId: number) {
  await sequelize.transaction(async (transaction) => {
    const book = await bookRepository.findBookById(bookId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!book) {
      throw new ApiError(404, 'BOOK_NOT_FOUND', ERROR_MESSAGES.BOOK_NOT_FOUND);
    }

    const [reviewCount, favoriteCount] = await Promise.all([
      bookRepository.countBookReviews(bookId, { transaction }),
      bookRepository.countBookFavorites(bookId, { transaction }),
    ]);

    // 既存仕様では、レビューやお気に入りが 1 件でもあれば削除不可。
    if (reviewCount > 0 || favoriteCount > 0) {
      throw new ApiError(409, 'RELATED_DATA_EXISTS', ERROR_MESSAGES.RELATED_DATA_EXISTS);
    }

    try {
      await bookRepository.deleteBook(book, { transaction });
    } catch (error) {
      if (
        error instanceof ForeignKeyConstraintError ||
        (typeof error === 'object' &&
          error !== null &&
          (error as { name?: string }).name === 'SequelizeForeignKeyConstraintError')
      ) {
        throw new ApiError(409, 'RELATED_DATA_EXISTS', ERROR_MESSAGES.RELATED_DATA_EXISTS);
      }
      throw error;
    }
  });
}
