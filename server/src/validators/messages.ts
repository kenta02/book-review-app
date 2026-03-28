/**
 * バリデーション用エラーメッセージ定数
 * 多言語化・メッセージ管理の一元化を想定
 */

export const ValidationMessages = {
  // ID 関連
  INVALID_REVIEW_ID: 'Invalid review ID.',
  INVALID_COMMENT_ID: 'Invalid comment ID.',

  // 必須・型チェック
  REQUIRED_POSITIVE_INTEGER: (field: string): string => `${field} is required and must be a positive integer.`,
  POSITIVE_INTEGER_REQUIRED: (field: string): string => `${field} must be a positive integer.`,
  REQUIRED_STRING: (field: string): string => `${field} is required and must be a string.`,

  // 文字列長チェック
  STRING_LENGTH_EXCEEDED: (field: string, max: number): string =>
    `${field} must be ${max} characters or fewer.`,

  // コメント関連
  COMMENT_CONTENT_REQUIRED: 'Comment content is required.',
  PARENT_ID_MUST_BE_POSITIVE: 'Parent comment ID must be a positive integer.',

  // レート関連
  RATING_MUST_BE_1_TO_5: 'Rating must be an integer between 1 and 5.',
};
