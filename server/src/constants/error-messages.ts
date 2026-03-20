export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  AUTHENTICATION_REQUIRED: 'Authentication required',
  NOT_FOUND: 'The requested resource was not found',

  // リソース未存在
  REVIEW_NOT_FOUND: 'The requested review was not found',
  BOOK_NOT_FOUND: 'The requested book was not found',
  USER_NOT_FOUND: 'User not found',
  PARENT_COMMENT_NOT_FOUND: 'The specified parent comment was not found',
  PARENT_COMMENT_WRONG_REVIEW: 'Parent comment must belong to the same review',

  // バリデーション/フィールド関連
  INVALID_BOOK_ID: 'Invalid book id',
  INVALID_USER_ID: 'Invalid user id',
  ID_MUST_BE_POSITIVE_INT: 'ID must be a positive integer',
  PAGE_MUST_BE_POSITIVE_INT: 'Page must be a positive integer',
  LIMIT_MUST_BE_POSITIVE_INT: 'Limit must be a positive integer',
  REQUIRED_TITLE: 'Title is required',
  REQUIRED_AUTHOR: 'Author is required',
  INVALID_TITLE_IF_PROVIDED: 'Title cannot be empty when provided',
  INVALID_AUTHOR_IF_PROVIDED: 'Author cannot be empty when provided',

  // 認証/ユーザー関連
  USERNAME_LENGTH: 'Username must be between 2 and 150 characters',
  EMAIL_FORMAT: 'Email must be a valid email address',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters', // NOSONAR
  AUTHENTICATION_FAILED: 'Authentication failed. Email or password is incorrect.',

  // 権限/禁止関連
  FORBIDDEN_REVIEW_UPDATE: 'You do not have permission to update this review',
  FORBIDDEN_REVIEW_DELETE: 'You do not have permission to delete this review',
  FORBIDDEN_ADMIN_REQUIRED: 'Admin privileges are required',

  // 重複/競合関連
  DUPLICATE_USERNAME: 'Username already exists',
  DUPLICATE_EMAIL: 'Email already exists',
  DUPLICATE_ISBN: 'A book with the same ISBN already exists',
  RELATED_DATA_EXISTS: 'Cannot delete because related data exists',

  // 検索関連
  INVALID_SORT_FIELD: 'sort must be one of: title, author, publicationYear, rating, createdAt',
  INVALID_ORDER_VALUE: 'order must be either asc or desc',
} as const;
