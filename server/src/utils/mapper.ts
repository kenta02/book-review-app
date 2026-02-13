import type { CommentDto } from '../types/dto';

// Model -> DTO 変換ユーティリティ
// - Sequelize の model.toJSON() を受けて、API に返す形に整形します。
// - DB の内部構造は露出せず、外向けの型（DTO）だけを返します。

// model.toJSON() を持つオブジェクトを受け取る想定
type SerializableModel = { toJSON(): Record<string, unknown> };

// 値を安全に文字列/数値へ変換するヘルパー
function asString(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function asNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

/**
 * Comment model を CommentDto に変換して返す
 * - 日時は ISO 文字列に整形します
 */
export function commentModelToDto(m: SerializableModel): CommentDto {
  const js = m.toJSON();

  // 型変換と安全なパースを明示的に行う（実行時の堅牢性を確保）
  const id = Number(js['id']);
  const content = asString(js['content']);
  const parentId = asNumberOrNull(js['parentId']);
  const reviewId = Number(js['reviewId']);
  const userId = asNumberOrNull(js['userId']);
  const createdAt = new Date(asString(js['createdAt'])).toISOString();
  const updatedAt = new Date(asString(js['updatedAt'])).toISOString();

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
