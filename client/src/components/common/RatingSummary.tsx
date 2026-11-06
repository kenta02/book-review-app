interface RatingSummaryProps {
  readonly averageRating?: number | null | undefined;
  readonly reviewCount?: number | undefined;
  /** card: 星の下に件数を表示 / detail: 星・数値・件数を横並びで表示 */
  readonly variant?: "card" | "detail";
  /** 星の key 重複を避けるためのプレフィックス */
  readonly keyPrefix?: string | number;
}

const MAX_STARS = 5;

/**
 * 平均評価とレビュー件数を表示するコンポーネント
 * 未評価（averageRating が null / undefined、または件数 0）の場合は「評価なし」を表示する
 */
export function RatingSummary({
  averageRating,
  reviewCount,
  variant = "card",
  keyPrefix = "rating",
}: Readonly<RatingSummaryProps>) {
  const count = reviewCount ?? 0;
  const hasRating = averageRating != null && count > 0;
  const filledStars = hasRating
    ? Math.max(0, Math.min(MAX_STARS, Math.round(averageRating)))
    : 0;

  const stars = (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: MAX_STARS }, (_, index) => (
        <span
          key={`${keyPrefix}-star-${index}`}
          className={index < filledStars ? "text-yellow-400" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </div>
  );

  if (variant === "detail") {
    return (
      <div className="flex items-center gap-2">
        {stars}
        {hasRating ? (
          <>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              ({count}件のレビュー)
            </span>
          </>
        ) : (
          <span className="text-gray-600 dark:text-gray-400">評価なし</span>
        )}
      </div>
    );
  }

  return (
    <div>
      {stars}
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {hasRating
          ? `${averageRating.toFixed(1)}（${count}件のレビュー）`
          : "評価なし"}
      </p>
    </div>
  );
}
