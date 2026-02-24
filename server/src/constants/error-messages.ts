export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  AUTHENTICATION_REQUIRED: '認証が必要です。',
  NOT_FOUND: '指定されたリソースが見つかりません。',

  // Resource not found
  REVIEW_NOT_FOUND: '指定されたレビューが存在しません。',
  BOOK_NOT_FOUND: '指定された本が存在しません。',
  USER_NOT_FOUND: 'ユーザーが見つかりません。',
  PARENT_COMMENT_NOT_FOUND: '指定された親コメントが存在しません。',
  PARENT_COMMENT_WRONG_REVIEW: '親コメントは同じレビューに属している必要があります。',

  // Validation / field messages
  INVALID_BOOK_ID: 'Invalid book id',
  INVALID_USER_ID: 'Invalid user id',
  ID_MUST_BE_POSITIVE_INT: 'IDは1以上の整数である必要があります。',
  REQUIRED_TITLE: 'タイトルは必須項目です。',
  REQUIRED_AUTHOR: '著者は必須項目です。',

  // Auth / user messages
  USERNAME_LENGTH: 'ユーザー名は2~150文字で入力してください.',
  EMAIL_FORMAT: 'メールアドレスは有効なメール形式で入力してください。',
  PASSWORD_MIN_LENGTH: 'パスワードは8文字以上で入力してください。',
  AUTHENTICATION_FAILED: '認証に失敗しました。メールアドレスまたはパスワードが正しくありません。',
  PASSWORD_MISMATCH: '認証に失敗しました。パスワードが一致しません。',

  // Forbidden / permission
  FORBIDDEN_REVIEW_UPDATE: 'このレビューを更新する権限がありません。',
  FORBIDDEN_REVIEW_DELETE: 'このレビューを削除する権限がありません。',

  // Duplicates / conflicts
  DUPLICATE_USERNAME: '同じユーザー名が既に存在します。',
  DUPLICATE_EMAIL: '同じメールアドレスが既に存在します。',
  DUPLICATE_ISBN: '同じISBNの本が既に存在します。',
  RELATED_DATA_EXISTS: '関連するデータが存在するため、削除できません。',
} as const;
