import { useState, type ChangeEvent, type FormEvent } from "react";
import { apiClient } from "../../api/apiClient";
import { normalizeError } from "../../errors/normalizeError";
import type { Review } from "../../types";
import { getReviewChangeErrorMessage } from "./reviewErrorMessage";
import { validateReviewContent } from "./validateReviewForm";

interface ReviewEditFormProps {
  /** 編集するレビュー */
  readonly review: Review;
  /** 更新に成功した後に呼ばれる。親が編集モードを閉じ、一覧と平均評価・件数を再取得するために使う */
  readonly onSaved: () => Promise<void> | void;
  /** 「キャンセル」が押された、または本文が変わっていないときに呼ばれる */
  readonly onCancel: () => void;
}

/**
 * 自分のレビューの本文を編集するフォーム。
 * サーバーの更新 API は本文（content）だけを更新する仕様のため、評価は編集できない。
 * 送信前に入力を検証し、API エラーは日本語で表示する。
 * @example
 * <ReviewEditForm review={review} onSaved={reload} onCancel={() => setIsEditing(false)} />
 */
export function ReviewEditForm({
  review,
  onSaved,
  onCancel,
}: Readonly<ReviewEditFormProps>) {
  const [content, setContent] = useState(review.content);
  const [contentError, setContentError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const contentId = `review-edit-content-${review.id}`;
  const errorId = `review-edit-content-error-${review.id}`;

  /** 本文を更新し、古いエラー表示を消す（修正後も次の送信までエラーが残らないようにする） */
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
    setContentError(null);
    setFormError(null);
  };

  /** 送信処理: 入力を検証し、変更があれば更新 API を呼ぶ */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    // 検証と送信で同じ値を使うため、trim はここで一度だけ行う
    const trimmed = content.trim();
    const error = validateReviewContent(trimmed);
    setContentError(error ?? null);
    if (error) {
      return;
    }

    // 変更が無ければ API を呼ばずに閉じる
    if (trimmed === review.content) {
      onCancel();
      return;
    }

    setSaving(true);
    try {
      // 評価は送らない（サーバーが更新しないため）
      await apiClient.updateReview({ reviewId: review.id, content: trimmed });
    } catch (err) {
      setFormError(getReviewChangeErrorMessage(normalizeError(err), "update"));
      setSaving(false);
      return;
    }

    setSaving(false);
    await onSaved();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="レビュー編集"
      className="mb-3 flex flex-col gap-3"
    >
      {formError && (
        <p
          role="alert"
          className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor={contentId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          レビュー本文
        </label>
        <textarea
          id={contentId}
          rows={4}
          value={content}
          aria-invalid={contentError ? true : undefined}
          aria-describedby={contentError ? errorId : undefined}
          onChange={handleChange}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        {contentError && (
          <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
            {contentError}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-purple-600! px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700! disabled:opacity-60"
        >
          {saving ? "更新中..." : "更新"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-800"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
