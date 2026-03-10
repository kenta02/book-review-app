import { ERROR_MESSAGES } from '../constants/error-messages';
import { ApiError } from '../errors/ApiError';
import * as bookRepository from '../repositories/book.repository';
import * as reviewService from './review.service';

type ListBooksInput = {
  page: number;
  limit: number;
};

type CreateBookInput = {
  title: string;
  author: string;
  publicationYear?: number;
  ISBN?: string;
  summary?: string;
};

type UpdateBookInput = {
  bookId: number;
  title?: string;
  author?: string;
  publicationYear?: number;
  ISBN?: string;
  summary?: string;
};

type ListBookReviewsInput = {
  bookId: number;
  page: number;
  limit: number;
};

/**
 * 書籍一覧を取得し、API 返却用の pagination 形式へ整形する。
 *
 * @param input - page と limit
 * @returns 書籍一覧と pagination 情報
 */
export async function listBooks({ page, limit }: ListBooksInput) {
  // repository が返す count/rows を API 返却用の pagination 形式へ整える。
  const { count, rows } = await bookRepository.findBooksWithPagination(page, limit);

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
 * 指定 ID の書籍を取得し、存在しない場合は ApiError を送出する。
 *
 * @param bookId - 検索対象の書籍 ID
 * @returns 書籍モデル
 * @throws ApiError 書籍が存在しない場合
 */
export async function getBookById(bookId: number) {
  const book = await bookRepository.findBookById(bookId);

  if (!book) {
    // 存在確認は books 系 service の共通入口としてここに寄せる。
    throw new ApiError(404, 'BOOK_NOT_FOUND', ERROR_MESSAGES.BOOK_NOT_FOUND);
  }

  return book;
}

/**
 * ISBN 重複を確認したうえで書籍を新規作成する。
 *
 * @param data - 作成する書籍データ
 * @returns 作成された書籍
 * @throws ApiError ISBN が重複している場合
 */
export async function createBook(data: CreateBookInput) {
  if (data.ISBN) {
    // ISBN ありの場合だけ重複確認を行い、未指定ならそのまま作成する。
    const existingBook = await bookRepository.findBookByIsbn(data.ISBN);
    if (existingBook) {
      throw new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_ISBN);
    }
  }

  return bookRepository.createBook(data);
}

/**
 * 指定 ID の書籍を部分更新する。
 *
 * @param input - 書籍 ID と更新対象フィールド
 * @returns 更新後の書籍
 * @throws ApiError 書籍未存在または ISBN 重複の場合
 */
export async function updateBook({ bookId, ...input }: UpdateBookInput) {
  const book = await getBookById(bookId);

  if (input.ISBN !== undefined) {
    // ISBN 更新時は自分自身を除外して重複を判定する。
    const existingBook = await bookRepository.findBookByIsbn(input.ISBN);
    if (existingBook && Number(existingBook.get('id')) !== bookId) {
      throw new ApiError(409, 'DUPLICATE_RESOURCE', ERROR_MESSAGES.DUPLICATE_ISBN);
    }
  }

  const updateData: bookRepository.UpdateBookRepositoryInput = {};

  // undefined を除いて repository 用の更新 payload を組み立てる。
  if (input.title !== undefined) updateData.title = input.title;
  if (input.author !== undefined) updateData.author = input.author;
  if (input.publicationYear !== undefined) updateData.publicationYear = input.publicationYear;
  if (input.ISBN !== undefined) updateData.ISBN = input.ISBN;
  if (input.summary !== undefined) updateData.summary = input.summary;

  return bookRepository.updateBook(book, updateData);
}

/**
 * 指定書籍のレビュー一覧を取得する前に、対象書籍の存在を確認する。
 *
 * @param input - bookId と pagination 情報
 * @returns レビュー一覧
 * @throws ApiError 書籍が存在しない場合
 */
export async function listBookReviews({ bookId, page, limit }: ListBookReviewsInput) {
  // 先に本の存在を確認してから reviews 側の一覧取得へ渡す。
  await getBookById(bookId);

  return reviewService.listReviews({
    page,
    limit,
    bookId,
  });
}

/**
 * 書籍に関連データが残っていないことを確認して削除する。
 *
 * @param bookId - 削除対象の書籍 ID
 * @returns Promise<void>
 * @throws ApiError 書籍未存在または関連データが残っている場合
 */
export async function deleteBook(bookId: number) {
  const book = await getBookById(bookId);

  // レビューやお気に入りが残っている本は削除禁止とする。
  const [reviewCount, favoriteCount] = await Promise.all([
    bookRepository.countBookReviews(bookId),
    bookRepository.countBookFavorites(bookId),
  ]);

  if (reviewCount > 0 || favoriteCount > 0) {
    throw new ApiError(409, 'RELATED_DATA_EXISTS', ERROR_MESSAGES.RELATED_DATA_EXISTS);
  }

  await bookRepository.deleteBook(book);
}
