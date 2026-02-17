/**
 * バリデーション用エラーメッセージ定数
 * 多言語化・メッセージ管理の一元化を想定
 */

export const ValidationMessages = {
  // ID 関連
  INVALID_REVIEW_ID: '無効なレビューIDです。',
  INVALID_COMMENT_ID: '無効なコメントIDです。',

  // 必須・型チェック
  REQUIRED_POSITIVE_INTEGER: (field: string) => `${field}は1以上の整数で必須項目です。`,
  POSITIVE_INTEGER_REQUIRED: (field: string) => `${field}は正の整数で指定してください。`,
  REQUIRED_STRING: (field: string) => `${field}は文字列で必須項目です。`,

  // 文字列長チェック
  STRING_LENGTH_EXCEEDED: (field: string, max: number) =>
    `${field}は${max}文字以内で入力してください。`,

  // コメント関連
  COMMENT_CONTENT_REQUIRED: 'コメント内容は必須です。',
  PARENT_ID_MUST_BE_POSITIVE: '親コメントIDは1以上の整数である必要があります。',

  // レート関連
  RATING_MUST_BE_1_TO_5: 'ratingは1から5の整数で入力してください。',
};
