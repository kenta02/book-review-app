import { describe, it, expect } from 'vitest';

import { ApiError, isApiError, ErrorDetail } from '../src/errors/ApiError';
import { ERROR_MESSAGES } from '../src/constants/error-messages';

// 単純かつ完全なカバレッジを狙うためのテスト

describe('ApiError class', () => {
  it('can be constructed and exposes properties', () => {
    // ErrorDetail の配列を作成
    const details: ErrorDetail[] = [{ field: 'foo', message: 'bar' }];
    // ApiError を直接コンストラクタで作成
    const err = new ApiError(418, 'TEAPOT', 'I am a teapot', details);

    // ApiError と Error のインスタンスである確認
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(Error);
    // プロパティが正しく設定されたことを確認
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('TEAPOT');
    expect(err.message).toBe('I am a teapot');
    expect(err.details).toBe(details);

    // instanceof が動作するように prototype が正しく設定されていることを確認
    expect(err instanceof ApiError).toBe(true);
  });

  it('validation() helper produces a 400 error with provided details', () => {
    // エラー詳細を定義
    const d: ErrorDetail[] = [{ field: 'a', message: 'b' }];
    // ApiError.validation() ヘルパーを使用
    const err = ApiError.validation(d);

    // ステータスコードとコードを確認
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    // メッセージは ERROR_MESSAGES.VALIDATION_FAILED と一致することを確認
    expect(err.message).toBe(ERROR_MESSAGES.VALIDATION_FAILED);
    // 詳細情報が保持されていることを確認
    expect(err.details).toBe(d);
  });

  it('notFound() helper uses defaults and allows overrides', () => {
    // デフォルト値で notFound() を呼び出し
    const err1 = ApiError.notFound();
    expect(err1.statusCode).toBe(404);
    expect(err1.code).toBe('NOT_FOUND');
    // メッセージがデフォルト値と一致することを確認
    expect(err1.message).toBe(ERROR_MESSAGES.NOT_FOUND);
    expect(err1.details).toBeUndefined();

    // code をオーバーライドして notFound() を呼び出し
    const err2 = ApiError.notFound('CUSTOM');
    expect(err2.statusCode).toBe(404);
    expect(err2.code).toBe('CUSTOM');
    // message パラメータはデフォルト値を使用
    expect(err2.message).toBe(ERROR_MESSAGES.NOT_FOUND);
  });
});

describe('isApiError type guard', () => {
  it('returns true for ApiError instances', () => {
    // ApiError インスタンスの型ガードをテスト
    const err = new ApiError(500, 'E', 'msg');
    // isApiError 関数が true を返すことを確認
    expect(isApiError(err)).toBe(true);
  });

  it('returns false for other values', () => {
    // ApiError 以外の値では false を返すことを確認
    expect(isApiError(new Error('x'))).toBe(false);
    expect(isApiError({})).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
  });
});
