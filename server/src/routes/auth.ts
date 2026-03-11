import express from 'express';

import { authenticateToken } from '../middleware/auth';
import { login, me, register } from '../controllers/auth.controller';

const router = express.Router();

// ルーティング層は責務を持たず、auth 用 controller へそのまま委譲する。

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, me);

export default router;
