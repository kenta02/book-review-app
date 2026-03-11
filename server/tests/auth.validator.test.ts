import type { Request } from 'express';
import { describe, expect, it } from 'vitest';

import { validateLogin, validateRegister } from '../src/validators/auth.validator';

function makeRequest(body: unknown): Request {
  return { body } as Request;
}

describe('auth.validator', () => {
  describe('validateRegister', () => {
    it('returns success with normalized payload for valid input', () => {
      const result = validateRegister(
        makeRequest({
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123',
        })
      );

      expect(result).toEqual({
        success: true,
        data: {
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123',
        },
      });
    });

    it('returns multiple validation errors for invalid input', () => {
      const result = validateRegister(makeRequest({ username: 'a', email: 'bad', password: '123' }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.map((error) => error.field)).toEqual(['username', 'email', 'password']);
      }
    });
  });

  describe('validateLogin', () => {
    it('returns success for valid input', () => {
      const result = validateLogin(
        makeRequest({
          email: 'alice@example.com',
          password: 'password123',
        })
      );

      expect(result).toEqual({
        success: true,
        data: {
          email: 'alice@example.com',
          password: 'password123',
        },
      });
    });

    it('returns validation errors for invalid input', () => {
      const result = validateLogin(makeRequest({ email: 'bad', password: '1' }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.map((error) => error.field)).toEqual(['email', 'password']);
      }
    });
  });
});
