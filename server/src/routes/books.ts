import express, { Request, Response } from "express";
import Book from "../models/Book";

// GET /api/books - 本一覧取得エンドポイント
const router = express.Router();
router.get("/", async (req: Request, res: Response) => {
  try {
    // クエリパラメータからページネーション情報を取得（文字列から数値に変換）
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    // ページネーション設定でDBから本データを取得
    const { count, rows } = await Book.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    // 取得情報をログ出力
    console.log(
      `Fetching books - page: ${page}, limit: ${limit}, offset: ${offset}`
    );
    console.log(`Found ${count} books in total`);

    // ページネーション情報を含めたレスポンスを返す
    res.json({
      success: true,
      data: {
        books: rows,
        pagination: {
          currentPage: page,
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    // エラーをログ出力し500ステータスで返す
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/books - 新規本登録エンドポイント
router.post("/", async (req: Request, res: Response) => {
  try {
    // リクエストボディから本の情報を抽出
    const { title, author, publicationYear, ISBN, summary } = req.body;
    console.log("Received new book data:", req.body);
    // 入力バリデーション: 各フィールドの必須チェック
    const errors = [];

    // バリデーション: titleは必須
    if (!title || title.trim() === "") {
      errors.push({ field: "title", message: "タイトルは必須項目です。" });
    }
    // バリデーション: authorは必須
    if (!author || author.trim() === "") {
      errors.push({ field: "author", message: "著者は必須項目です。" });
    }

    // バリデーションエラーが存在する場合は400ステータスで返す
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors, // エラーの詳細情報
        },
      });
    }

    // 重複チェック: ISBNが既に存在するか確認
    if (ISBN) {
      const existingBook = await Book.findOne({ where: { ISBN } });
      if (existingBook) {
        // 409 Conflictで既存リソースを返す
        return res.status(409).json({
          success: false,
          error: {
            message: "同じISBNの本が既に存在します。",
            code: "DUPLICATE_RESOURCE",
          },
        });
      }
    }

    // 本データをDBに保存
    const newBook = await Book.create({
      title,
      author,
      publicationYear,
      ISBN,
      summary,
    });

    // 201 Createdで作成された本情報を返す
    res.status(201).json({
      success: true,
      data: newBook,
    });
  } catch (error) {
    // エラーをログ出力し500ステータスで返す
    console.error("Error creating new book:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
});

export default router;
