import express, { Request, Response } from 'express';
import Book from '../models/Book';
import { BookParams } from '../types/route-params';
import Review from '../models/Review';
import Favorite from '../models/Favorite';

const router = express.Router();

// TODO: 時間あるときにやる;
// GET /api/reviews/:reviewId/comments - レビューのコメント一覧取得
router.get('/', async (req: Request, res: Response) => {
  try {
    // findAndCountAll で総件数と該当行を同時取得（N+1 クエリ回避）
    const { count, rows } = await Book.findAndCountAll({
      // limit,
      // offset,
      order: [['createdAt', 'DESC']],
    });

    console.log(`Fetching books - page: ${page}, limit: ${limit}, offset: ${offset}`);
    console.log(`Found ${count} books in total`);

    res.json({
      success: true,
      data: {
        // // books: rows,
        // pagination: {
        //   currentPage: page,
        //   totalItems: count,
        //   totalPages: Math.ceil(count / limit),
        //   itemsPerPage: limit,
        // },
      },
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
