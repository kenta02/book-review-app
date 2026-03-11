import express from 'express';

import { authenticateToken } from '../middleware/auth';
import {
  createReview,
  deleteReview,
  getReviewDetail,
  listReviews,
  updateReview,
} from '../controllers/review.controller';

const router = express.Router();

// ルーティング層は責務を持たず、reviews 用 controller へそのまま委譲する。
router.get('/reviews', listReviews);
router.get('/reviews/:reviewId', getReviewDetail);
router.post('/reviews', authenticateToken, createReview);
router.put('/reviews/:reviewId', authenticateToken, updateReview);
router.delete('/reviews/:reviewId', authenticateToken, deleteReview);

export default router;
