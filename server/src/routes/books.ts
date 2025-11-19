import express, { Request, Response } from "express";
import Book from "../models/Book";

// Routerのインスタンスを作成
const router = express.Router();

// GET エンドポイントを定義
router.get("/", async (req: Request, res: Response) => {
  try {
    // DB処理
    // クエリパラメータを取得
    const page = parseInt(req.query.page as string) || 1; // 文字列 → 数値
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit; // ページ1なら offset=0, ページ2なら offset=20
    // データベースから取得
    const { count, rows } = await Book.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    // ページネーション情報をログ出力（レスポンス前）
    console.log(
      `Fetching books - page: ${page}, limit: ${limit}, offset: ${offset}`
    );

    // 結果をログ出力（レスポンス前）
    console.log(`Found ${count} books in total`);

    // レスポンスを返す
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
    // エラー処理
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/booksを実装する
router.post("/", async (req: Request, res: Response) => {
  try {
    // req.body から本の情報を取得
    const { title, author, publicationYear, ISBN, summary } = req.body;
    console.log("Received new book data:", req.body);
    // 手動でバリデーションを行う

    // エラーを格納する配列
    const errors = [];

    // titleの必須チェック
    if (!title || title.trim() === "") {
      errors.push({ field: "title", message: "タイトルは必須項目です。" });
    }
    // authorの必須チェック
    if (!author || author.trim() === "") {
      errors.push({ field: "author", message: "著者は必須項目です。" });
    }

    // 複数のバリデーションエラーがある場合
    // 例: details:[
    //   { field: "title", message: "タイトルは必須項目です。" },
    //   { field: "author", message: "著者は必須項目です。" },
    // ]
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

    // 重複チェック（ISBN）
    if (ISBN) {
      const existingBook = await Book.findOne({ where: { ISBN } });
      if (existingBook) {
        // 409エラーを返す
        return res.status(409).json({
          success: false,
          error: {
            message: "同じISBNの本が既に存在します。",
            code: "DUPLICATE_RESOURCE",
          },
        });
      }
    }

    // データベースに保存
    const newBook = await Book.create({
      title,
      author,
      publicationYear,
      ISBN,
      summary,
    });

    // 201成功レスポンスを返す
    res.status(201).json({
      success: true,
      data: newBook,
    });
  } catch (error) {
    // エラー処理
    console.error("Error creating new book:", error);
    // 500エラーを返す
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
});

// ルーターをエクスポート
export default router;
