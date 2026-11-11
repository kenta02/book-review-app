/** レビューフォームの入力値（評価は未選択のとき null） */
export interface ReviewFormValues {
  rating: number | null;
  content: string;
}

/** 項目ごとのエラーメッセージ（エラーが無い項目はキー自体が無い） */
export type ReviewFieldErrors = Partial<Record<keyof ReviewFormValues, string>>;

// サーバー（review.validator.ts）と同じ制約。送信前に分かるエラーは画面側で先に伝える。
const RATING_MIN = 1;
const RATING_MAX = 5;
const CONTENT_MIN_LENGTH = 1;
const CONTENT_MAX_LENGTH = 1000;

/**
 * レビューフォームの入力チェック。
 * 値の正規化（trim）は行わない。サーバーの検証と結果を揃えるため、送信する値をそのまま渡すこと。
 * @param values - 入力値（送信する値そのまま）
 * @returns 項目ごとのエラー。空オブジェクトなら入力は正しい
 * @example
 * validateReviewForm({ rating: null, content: "" });
 * // => { rating: "評価を1〜5から選んでください", content: "レビュー本文は1〜1000文字で入力してください" }
 */
export function validateReviewForm(
  values: ReviewFormValues,
): ReviewFieldErrors {
  const errors: ReviewFieldErrors = {};

  const { rating, content } = values;
  if (
    rating === null ||
    !Number.isInteger(rating) ||
    rating < RATING_MIN ||
    rating > RATING_MAX
  ) {
    errors.rating = `評価を${RATING_MIN}〜${RATING_MAX}から選んでください`;
  }

  if (
    content.length < CONTENT_MIN_LENGTH ||
    content.length > CONTENT_MAX_LENGTH
  ) {
    errors.content = `レビュー本文は${CONTENT_MIN_LENGTH}〜${CONTENT_MAX_LENGTH}文字で入力してください`;
  }

  return errors;
}
