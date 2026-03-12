import express from 'express';

import { getUserProfile } from '../controllers/user.controller';

const router = express.Router();

// ルーティング層は責務を持たず、users 用 controller へそのまま委譲する。
router.get('/:id', getUserProfile);

export default router;
