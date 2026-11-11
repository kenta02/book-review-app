import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../api/apiClient";
import { useAuth } from "../../auth/useAuth";
import { normalizeError } from "../../errors/normalizeError";
import { getReviewErrorMessage } from "./reviewErrorMessage";
import {
  validateReviewForm,
  type ReviewFieldErrors,
  type ReviewFormValues,
} from "./validateReviewForm";

interface ReviewFormProps {
  /** レビューを投稿する書籍の ID */
  readonly bookId: number;
  /** 投稿に成功した後に呼ばれる。親が一覧と平均評価・件数を再取得するために使う */
  readonly onSubmitted: () => Promise<void> | void;
}

/** 評価の選択肢（1〜5） */
const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

/**
 * 書籍詳細に置くレビュー投稿フォーム（本文・評価1〜5）。
 * - ログイン済み: フォームを表示する。送信前に入力を検証し、API エラーは日本語で表示する
 * - 未ログイン: フォームの代わりにログインへの案内を表示する
 * - 認証状態の確認中: 何も表示しない（表示のちらつきを防ぐ）
 * @example
 * <ReviewForm bookId={book.id} onSubmitted={reloadBookAndReviews} />
 */
export function ReviewForm({ bookId, onSubmitted }: Readonly<ReviewFormProps>) {
  const { status } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ReviewFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") {
    return null;
  }

  if (status === "unauthenticated") {
    return (
      <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">
        レビューを投稿するには、
        <Link to="/login" className="text-purple-600 hover:underline">
          ログイン
        </Link>
        してください。
      </p>
    );
  }

  /**
   * 入力値を更新し、編集した項目のエラーとフォーム全体のエラーを消す。
   * 修正後も古いエラーが次の送信まで残り続けるのを防ぐ。
   * @param field - 編集した項目
   * @param update - その項目の値を更新する処理
   */
  const edit = (field: keyof ReviewFormValues, update: () => void) => {
    update();
    setFormError(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /** 送信処理: 入力を検証し、通ればレビュー投稿 API を呼ぶ */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    // 検証と送信で同じ値を使うため、trim はここで一度だけ行う
    const values: ReviewFormValues = { rating, content: content.trim() };
    const errors = validateReviewForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || values.rating === null) {
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createReview({
        bookId,
        rating: values.rating,
        content: values.content,
      });
    } catch (error) {
      setFormError(getReviewErrorMessage(normalizeError(error)));
      setSubmitting(false);
      return;
    }

    // 投稿に成功したらフォームを空に戻し、親に一覧の再取得を任せる
    setRating(null);
    setContent("");
    setSubmitting(false);
    await onSubmitted();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="レビュー投稿"
      className="mb-6 flex flex-col gap-4"
    >
      {formError && (
        <p
          role="alert"
          className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
        >
          {formError}
        </p>
      )}

      <fieldset
        aria-invalid={fieldErrors.rating ? true : undefined}
        aria-describedby={
          fieldErrors.rating ? "review-rating-error" : undefined
        }
        className="flex flex-col gap-1"
      >
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
          評価
        </legend>
        <div className="flex gap-4">
          {RATING_OPTIONS.map((value) => (
            <label
              key={value}
              className="flex items-center gap-1 text-sm text-gray-900 dark:text-white"
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => edit("rating", () => setRating(value))}
              />
              {value}点
            </label>
          ))}
        </div>
        {fieldErrors.rating && (
          <p
            id="review-rating-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {fieldErrors.rating}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="review-content"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          レビュー本文
        </label>
        <textarea
          id="review-content"
          rows={4}
          value={content}
          aria-invalid={fieldErrors.content ? true : undefined}
          aria-describedby={
            fieldErrors.content ? "review-content-error" : undefined
          }
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            edit("content", () => setContent(e.target.value))
          }
          className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        {fieldErrors.content && (
          <p
            id="review-content-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {fieldErrors.content}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded bg-purple-600! px-4 py-2 font-semibold text-white transition hover:bg-purple-700! disabled:opacity-60"
      >
        {submitting ? "投稿中..." : "レビューを投稿"}
      </button>
    </form>
  );
}
