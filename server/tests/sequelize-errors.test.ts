import { describe, expect, it } from 'vitest';

import { isUniqueConstraintError } from '../src/utils/sequelizeErrors';

describe('sequelizeErrors', () => {
  it('SequelizeUniqueConstraintError の path 一致を検出できる', () => {
    const error = {
      name: 'SequelizeUniqueConstraintError',
      errors: [{ path: 'email' }],
    };

    expect(isUniqueConstraintError(error, ['email'])).toBe(true);
    expect(isUniqueConstraintError(error, ['username'])).toBe(false);
  });

  it('fields キー一致を検出できる', () => {
    const error = {
      name: 'SequelizeUniqueConstraintError',
      fields: { username: 'alice' },
    };

    expect(isUniqueConstraintError(error, ['username'])).toBe(true);
  });

  it('sqlMessage フォールバックで重複を検出できる', () => {
    const error = {
      name: 'SequelizeUniqueConstraintError',
      sqlMessage: "Duplicate entry 'alice' for key 'username'",
    };

    expect(isUniqueConstraintError(error, ['username'])).toBe(true);
  });

  it('ターゲットなしの場合は一意制約違反として true を返す', () => {
    const error = {
      name: 'SequelizeUniqueConstraintError',
      errors: [{ path: 'ISBN' }],
    };

    expect(isUniqueConstraintError(error)).toBe(true);
  });
});
