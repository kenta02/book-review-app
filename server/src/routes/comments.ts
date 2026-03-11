import express from 'express';

import { authenticateToken } from '../middleware/auth';
import { createComment, listComments } from '../controllers/comment.controller';

const router = express.Router();

// ルーティング層は責務を持たず、comments 用 controller へそのまま委譲する。
router.get('/reviews/:reviewId/comments', listComments);
router.post('/reviews/:reviewId/comments', authenticateToken, createComment);

export default router;
