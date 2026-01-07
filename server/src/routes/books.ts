import express, { Request, Response } from "express";
import Book from "../models/Book";

const router = express.Router();

// GET /api/books - 書籍一覧取得（ページネーション対応）
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // findAndCountAll で総件数と該当行を同時取得（N+1 クエリ回避）
    const { count, rows } = await Book.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    console.log(
      `Fetching books - page: ${page}, limit: ${limit}, offset: ${offset}`
    );
    console.log(`Found ${count} books in total`);

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
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/books/:id - 書籍詳細取得
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const bookId = Number(req.params.id);
    const errors = [];

    // idの数値チェック
    if (!Number.isInteger(bookId) || bookId <= 0) {
      errors.push({
        field: "id",
        message: "IDは1以上の整数である必要があります。",
      });
    }
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid book id",
          code: "INVALID_BOOK_ID",
          details: errors,
        },
      });
    }

    // 成功時
    const bookInfo = await Book.findByPk(bookId);

    if (bookInfo) {
      return res.json({ success: true, data: bookInfo });
    } else {
      // 書籍がない場合
      return res.status(404).json({
        success: false,
        error: {
          message: "指定されたIDの本が見つかりません。",
          code: "BOOK_NOT_FOUND",
        },
      });
    }
  } catch (error) {
    console.error("Error fetching book:", error);
    return res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
      },
    });
  }
});

// POST /api/books - 新規書籍登録
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, author, publicationYear, ISBN, summary } = req.body;
    const errors = [];

    if (!title || title.trim() === "") {
      errors.push({ field: "title", message: "タイトルは必須項目です。" });
    }
    if (!author || author.trim() === "") {
      errors.push({ field: "author", message: "著者は必須項目です。" });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
        },
      });
    }

    // ISBN 重複チェック: 一意の識別子として機能
    if (ISBN) {
      const existingBook = await Book.findOne({ where: { ISBN } });
      if (existingBook) {
        return res.status(409).json({
          success: false,
          error: {
            message: "同じISBNの本が既に存在します。",
            code: "DUPLICATE_RESOURCE",
          },
        });
      }
    }

    const newBook = await Book.create({
      title,
      author,
      publicationYear,
      ISBN,
      summary,
    });

    res.status(201).json({
      success: true,
      data: newBook,
    });
  } catch (error) {
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

// PUT /api/books/:id - 書籍情報更新
router.put("/:id", async(req: Request, res: Response) => {
try {
    const bookId = Number(req.params.id);
    const { title, author, publicationYear, ISBN, summary } = req.body;
    const errors = [];

  // 必要そうなこと
  // 型チェック
  // 送られたフィールドの型チェック（publicationYearはnumber、ISBNはstring）や重複チェック（ISBN）が適切。空文字列やnullの扱いはどうする？ 
  // 重複チェック
  // エラーメッセージ

} catch (error) {

}
});

export default router;
