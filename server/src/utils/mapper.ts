import type { CommentDto } from '../modules/comment/dto/comment.dto';
import type { ReviewDto } from '../modules/review/dto/review.dto';

// Model -> DTO 変換ユーティリティ
// - Sequelize の model.toJSON() を受けて、API に返す形に整形します。
// - DB の内部構造は露出せず、外向けの型（DTO）だけを返します。

// model.toJSON() を持つオブジェクトを受け取る想定
type SerializableModel = { toJSON(): Record<string, unknown> };
export type BookListRow = {
  toJSON?: () => Record<string, unknown>;
  get?: (key: string) => unknown;
};

// 値を安全に文字列/数値へ変換するヘルパー
function asString(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function asNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// 日付文字列を ISO 8601 に変換し、無効な日時なら空文字を返す
function formatDate(value: unknown): string {
  const s = asString(value);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toISOString();
}

/**
 * Comment Model → DTO 型変換
 * @returns {CommentDto} 型安全な DTO
 */
export function commentModelToDto(m: SerializableModel): CommentDto {
  const js = m.toJSON();

  // 型変換と安全なパースを明示的に行う（実行時の堅牢性を確保）
  const id = Number(js['id']);
  const content = asString(js['content']);
  const parentId = asNumberOrNull(js['parentId']);
  const reviewId = Number(js['reviewId']);
  const userId = asNumberOrNull(js['userId']);
  // 日時を ISO 8601 形式文字列に変換
  const createdAt = formatDate(js['createdAt']);
  const updatedAt = formatDate(js['updatedAt']);

  // DTO を構築して返却
  return {
    id,
    content,
    parentId,
    reviewId,
    userId,
    createdAt,
    updatedAt,
  };
}

/**
 * Review Model（または toJSON を持つオブジェクト）を DTO へ変換します。
 *
 * @param model - Review モデル / plain object
 * @returns API レスポンス向け ReviewDto
 */
export function reviewModelToDto(model: unknown): ReviewDto {
  const json = (
    typeof (model as { toJSON?: unknown }).toJSON === 'function'
      ? (model as { toJSON: () => Record<string, unknown> }).toJSON()
      : model
  ) as Record<string, unknown>;

  return {
    id: Number(json.id),
    bookId: Number(json.bookId),
    userId: json.userId === null || json.userId === undefined ? null : Number(json.userId),
    content: String(json.content),
    rating: json.rating === undefined ? undefined : Number(json.rating),
    createdAt: formatDate(json.createdAt),
    updatedAt: formatDate(json.updatedAt),
  };
}

/**
 * 書籍一覧の 1 行を API レスポンス向けに正規化します。
 *
 * @param row - repository から返された書籍行
 * @returns 集計列を正規化した書籍データ
 */
export function normalizeListBook(row: BookListRow): Record<string, unknown> & {
  averageRating: number | null;
  reviewCount: number;
} {
  const raw = typeof row.toJSON === 'function' ? row.toJSON() : (row as Record<string, unknown>);
  const averageRatingValue =
    raw.averageRating ?? (typeof row.get === 'function' ? row.get('averageRating') : undefined);
  const reviewCountValue =
    raw.reviewCount ?? (typeof row.get === 'function' ? row.get('reviewCount') : undefined);
  const averageRating = asNumberOrNull(averageRatingValue);
  const reviewCount = asNumberOrNull(reviewCountValue);

  return {
    ...raw,
    averageRating,
    reviewCount: reviewCount ?? 0,
  };
}
