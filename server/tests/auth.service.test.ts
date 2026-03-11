import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../src/errors/ApiError';
import * as authService from '../src/services/auth.service';
import * as userRepository from '../src/repositories/user.repository';

vi.mock('../src/repositories/user.repository', () => ({
  findUserByUsername: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
  },
}));

function makeUserInstance(input: { id: number; username: string; email: string; password?: string }) {
  return {
    toJSON: () => input,
  } as unknown as userRepository.UserInstance;
}

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('throws 409 when username already exists', async () => {
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue(makeUserInstance({ id: 1, username: 'taken', email: 'taken@example.com' }));
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);

      await expect(
        authService.register({ username: 'taken', email: 'new@example.com', password: 'password123' })
      ).rejects.toBeInstanceOf(ApiError);

      await expect(
        authService.register({ username: 'taken', email: 'new@example.com', password: 'password123' })
      ).rejects.toMatchObject({ statusCode: 409, code: 'DUPLICATE_RESOURCE' });
    });

    it('throws 409 when email already exists', async () => {
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue(null);
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue(makeUserInstance({ id: 2, username: 'u2', email: 'dup@example.com' }));

      await expect(
        authService.register({ username: 'new', email: 'dup@example.com', password: 'password123' })
      ).rejects.toMatchObject({ statusCode: 409, code: 'DUPLICATE_RESOURCE' });
    });

    it('creates user and returns token when valid', async () => {
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue(null);
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      vi.mocked(userRepository.createUser).mockResolvedValue(
        makeUserInstance({ id: 10, username: 'alice', email: 'alice@example.com', password: 'hashed' })
      );
      vi.mocked(jwt.sign).mockReturnValue('token' as never);

      const result = await authService.register({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
      });

      expect(userRepository.createUser).toHaveBeenCalledWith({
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed',
      });
      expect(result).toEqual({
        user: { id: 10, username: 'alice', email: 'alice@example.com' },
        token: 'token',
      });
    });
  });

  describe('login', () => {
    it('throws 401 when user is not found', async () => {
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);

      await expect(
        authService.login({ email: 'none@example.com', password: 'password123' })
      ).rejects.toMatchObject({ statusCode: 401, code: 'AUTHENTICATION_FAILED' });
    });

    it('throws 401 when password mismatch', async () => {
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue(
        makeUserInstance({ id: 1, username: 'u1', email: 'u1@example.com', password: 'hashed' })
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        authService.login({ email: 'u1@example.com', password: 'wrong123' })
      ).rejects.toMatchObject({ statusCode: 401, code: 'AUTHENTICATION_FAILED' });
    });

    it('returns token when credentials are valid', async () => {
      vi.mocked(userRepository.findUserByEmail).mockResolvedValue(
        makeUserInstance({ id: 1, username: 'u1', email: 'u1@example.com', password: 'hashed' })
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue('token-login' as never);

      const result = await authService.login({ email: 'u1@example.com', password: 'password123' });

      expect(result).toEqual({
        user: { id: 1, username: 'u1', email: 'u1@example.com' },
        token: 'token-login',
      });
    });
  });

  describe('getMyProfile', () => {
    it('throws 404 when user is missing', async () => {
      vi.mocked(userRepository.findUserById).mockResolvedValue(null);

      await expect(authService.getMyProfile(99)).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('returns user profile when found', async () => {
      vi.mocked(userRepository.findUserById).mockResolvedValue(
        makeUserInstance({ id: 5, username: 'me', email: 'me@example.com' })
      );

      const result = await authService.getMyProfile(5);

      expect(result).toEqual({
        user: { id: 5, username: 'me', email: 'me@example.com' },
      });
    });
  });
});
