import express from 'express';

import {
  listBooks,
  getBook,
  createBook,
  updateBook,
  listBookReviews,
  deleteBook,
} from '../controllers/book.controller';

const router = express.Router();

// ルーティング層は責務を持たず、books 用 controller へそのまま委譲する。

/**
 * GET /api/books - 書籍一覧をページングで取得
 *
 * @route {GET} /api/books
 * @access Public
 * @query {string} [page] ページ番号（整数、>=1）
 * @query {string} [limit] 件数（整数、>=1）
 *
 * @returns {200} {success:true,data:{books:Book[],pagination:Pagination}}
 * @returns {500} 内部エラー
 *
 * @example GET /api/books?page=1&limit=20 → 200
 */
router.get('/', listBooks);

/**
 * GET /api/books/:id - 指定書籍の詳細取得
 *
 * @route {GET} /api/books/:id
 * @access Public
 * @param {string} id.path.required - 書籍ID
 *
 * @returns {200} {success:true,data:Book}
 * @returns {400} INVALID_BOOK_ID
 * @returns {404} BOOK_NOT_FOUND
 * @returns {500} 内部エラー
 *
 * @example GET /api/books/1 → 200
 */
router.get('/:id', getBook);

/**
 * POST /api/books - 書籍登録
 *
 * @route {POST} /api/books
 * @access Public
 * @body {string} title
 * @body {string} author
 * @body {number} [publicationYear]
 * @body {string} [ISBN]
 * @body {string} [summary]
 *
 * @returns {201} 作成した書籍
 * @returns {400} VALIDATION_ERROR
 * @returns {409} DUPLICATE_RESOURCE
 * @returns {500} 内部エラー
 *
 * @example POST /api/books {title:'t',author:'a'} → 201
 */
router.post('/', createBook);

/**
 * PUT /api/books/:id - 書籍部分更新
 *
 * @route {PUT} /api/books/:id
 * @access Public
 * @param {string} id.path.required - 書籍ID
 * @body {string} [title]
 * @body {string} [author]
 * @body {number} [publicationYear]
 * @body {string} [ISBN]
 * @body {string} [summary]
 *
 * @returns {200} 更新後の書籍
 * @returns {400} VALIDATION_ERROR / INVALID_BOOK_ID
 * @returns {404} BOOK_NOT_FOUND
 * @returns {409} DUPLICATE_RESOURCE
 * @returns {500} 内部エラー
 *
 * @example PUT /api/books/1 {title:'new'} → 200
 */
router.put('/:id', updateBook);

/**
 * GET /api/books/:bookId/reviews - 書籍のレビュー一覧
 *
 * @route {GET} /api/books/:bookId/reviews
 * @access Public
 * @param {string} bookId.path.required
 * @query {string} [page]
 * @query {string} [limit]
 *
 * @returns {200} {success:true,data:{reviews:Review[],pagination:Pagination}}
 * @returns {400} INVALID_BOOK_ID / VALIDATION_ERROR
 * @returns {404} BOOK_NOT_FOUND
 * @returns {500} 内部エラー
 *
 * @example GET /api/books/1/reviews → 200
 */
router.get('/:bookId/reviews', listBookReviews);

/**
 * DELETE /api/books/:id - 書籍削除
 *
 * @route {DELETE} /api/books/:id
 * @access Public
 * @param {string} id.path.required
 *
 * @returns {204} No Content
 * @returns {400} INVALID_BOOK_ID
 * @returns {404} BOOK_NOT_FOUND
 * @returns {409} RELATED_DATA_EXISTS
 * @returns {500} 内部エラー
 *
 * @example DELETE /api/books/1 → 204
 */
router.delete('/:id', deleteBook);

export default router;
