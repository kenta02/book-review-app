import { ForeignKeyConstraintError, UniqueConstraintError, ValidationErrorItem } from 'sequelize';

import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import * as bookRepository from '../repositories/book.repository';
import type { BookInstance } from '../repositories/book.repository';
import { sequelize } from '../sequelize';
import * as reviewService from './review.service';
import { CreateBookDto, ListBooksQueryDto, UpdateBookDto } from '../modules/book/dto/book.dto';
import { logger } from '../utils/logger';

type ListBookReviewsInput = {
  bookId: number;
  page: number;
  limit: number;
};

type BookListRow = {
  toJSON?: () => Record<string, unknown>;
  get?: (key: string) => unknown;
};

/**
 * 集計列に混在しうる値を有限数へ寄せます。
 *
 * @param value - DB / Sequelize から返る生値
 * @returns 有限数なら number、そうでなければ null
 */
function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

/**
 * 書籍一覧クエリの 1 行を API レスポンス形式へ正規化します。
 *
 * Sequelize の一覧結果は、モデルインスタンス経由で集計列を持つ場合と
 * plain object に近い shape で扱う場合があるため、ここで吸収します。
 * 集計列は API 契約に合わせて `averageRating` は `number | null`、
 * `reviewCount` は未評価時でも `0` へ揃えます。
 *
 * @param row - repository から返された書籍一覧の 1 行
 * @returns API レスポンスへ載せる正規化済み書籍データ
 */
function normalizeListBook(row: BookListRow) {
  const raw = typeof row.toJSON === 'function' ? row.toJSON() : (row as Record<string, unknown>);
  const averageRatingValue =
    raw.averageRating ?? (typeof row.get === 'function' ? row.get('averageRating') : undefined);
  const reviewCountValue =
    raw.reviewCount ?? (typeof row.get === 'function' ? row.get('reviewCount') : undefined);
  const averageRating = toFiniteNumber(averageRatingValue);
  const reviewCount = toFiniteNumber(reviewCountValue);

  return {
    ...raw,
    averageRating,
    reviewCount: reviewCount ?? 0,
  };
}

/**
 * Sequelize の一意制約違反が「ISBN 重複」または「title + author 重複」に該当するか判定します。
 *
 * `UniqueConstraintError` は DB 方言やモック方法によって shape が少しぶれるため、
 * service 層で吸収して API 向けの 409 エラーへ寄せています。
 *
 * @param error - repository 層から送出された例外
 * @returns 重複エラーとして扱うべき場合は true
 */
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
export async function listBooks(queryDto: ListBooksQueryDto): Promise<{
  books: ReturnType<typeof normalizeListBook>[];
  pagination: {
    currentPage: number;
    totalItems: number;
    totalPages: number;
    itemsPerPage: number;
  };
}> {
  try {
    const { page, limit } = queryDto;

    const { count: rawCount, rows } = await bookRepository.findBooksWithPagination(queryDto);
    // `findAndCountAll` は group なしでは number、group ありでは配列を返すため、
    // pagination 用の総件数へここで正規化します。
    const totalItems = Array.isArray(rawCount) ? rawCount.length : rawCount;

    logger.info('[BOOKS SERVICE] books fetched', {
      page,
      limit,
      totalItems: totalItems,
    });

    return {
      books: rows.map((row) => normalizeListBook(row)),
      pagination: {
        currentPage: page,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('[BOOKS SERVICE] failed to fetch books', error);
    throw new ApiError(500, 'INTERNAL_SERVER_ERROR', ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
}

/**
 * 書籍詳細を取得します。
 *
 * @param bookId - 書籍 ID
 * @returns 取得した書籍
 * @throws ApiError 書籍が存在しない場合
 */
export async function getBookDetail(bookId: number): Promise<BookInstance> {
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
export async function createBook(input: CreateBookDto): Promise<BookInstance> {
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
export async function updateBook(bookId: number, input: UpdateBookDto): Promise<BookInstance> {
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
export async function listBookReviews(
  input: ListBookReviewsInput
): Promise<Awaited<ReturnType<typeof reviewService.listReviews>>> {
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
export async function deleteBook(bookId: number): Promise<void> {
  await sequelize.transaction(async (transaction) => {
    // 削除可否判定と実削除を同一トランザクションに載せ、競合時の不整合を避けます。
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
