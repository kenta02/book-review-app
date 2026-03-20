import express from 'express';

import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  createBook,
  deleteBook,
  getBookDetail,
  listBookReviews,
  listBooks,
  updateBook,
} from '../controllers/book.controller';

const router = express.Router();

// ルーティング層は URL と HTTP メソッドの定義に限定し、
// 入力検証や業務ロジックは controller 以下へ委譲する。
router.get('/', listBooks);
router.get('/:id', getBookDetail);
router.post('/', authenticateToken, requireAdmin, createBook);
router.put('/:id', authenticateToken, requireAdmin, updateBook);
router.get('/:bookId/reviews', listBookReviews);
router.delete('/:id', authenticateToken, requireAdmin, deleteBook);

export default router;
