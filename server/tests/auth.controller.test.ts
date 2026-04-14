import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ERROR_MESSAGES } from '../src/constants/error-messages';
import { ApiError } from '../src/errors/ApiError';
import { logger } from '../src/utils/logger';
import { login, me, register } from '../src/controllers/auth.controller';
import * as authService from '../src/services/auth.service';

vi.mock('../src/services/auth.service', () => ({
  register: vi.fn(),
  login: vi.fn(),
  getMyProfile: vi.fn(),
}));

type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

type TestRequest = Request & { userId?: number };

function makeRequest(input: { body?: unknown; userId?: number } = {}): TestRequest {
  return {
    body: input.body ?? {},
    userId: input.userId,
  } as TestRequest;
}

function makeResponse(): MockResponse {
  const res = {} as MockResponse;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('auth.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register: バリデーションエラー時は 400 を返す', async () => {
    const req = makeRequest({ body: { username: 'a', email: 'bad', password: '123' } }); // NOSONAR
    const res = makeResponse();

    await register(req, res);

    expect(authService.register).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      })
    );
  });

  it('register: 正常系では 201 を返す', async () => {
    const req = makeRequest({
      body: { username: 'alice', email: 'alice@example.com', password: 'password123' }, // NOSONAR
    });
    const res = makeResponse();
    const data = {
      user: { id: 1, username: 'alice', email: 'alice@example.com' },
      token: 'token',
    };
    vi.mocked(authService.register).mockResolvedValue(data);

    await register(req, res);

    expect(authService.register).toHaveBeenCalledWith({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123', // NOSONAR
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('register: service の ApiError をそのまま返す', async () => {
    const req = makeRequest({
      body: { username: 'alice', email: 'alice@example.com', password: 'password123' }, // NOSONAR
    });
    const res = makeResponse();
    vi.mocked(authService.register).mockRejectedValue(
      new ApiError(400, 'TEST_ERROR', 'test error', [{ field: 'email', message: 'invalid' }])
    );

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'test error',
        code: 'TEST_ERROR',
        details: [{ field: 'email', message: 'invalid' }],
      },
    });
  });

  it('login: バリデーションエラー時は 400 を返す', async () => {
    const req = makeRequest({ body: { email: 'not-an-email', password: '' } });
    const res = makeResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      })
    );
  });

  it('login: 正常系では 200 を返す', async () => {
    const req = makeRequest({ body: { email: 'a@example.com', password: 'password123' } }); // NOSONAR
    const res = makeResponse();
    const data = { token: 'token', user: { id: 1, username: 'alice', email: 'a@example.com' } };
    vi.mocked(authService.login).mockResolvedValue(data);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('login: details 付き ApiError をそのまま返す', async () => {
    const req = makeRequest({ body: { email: 'a@example.com', password: 'password123' } }); // NOSONAR
    const res = makeResponse();
    vi.mocked(authService.login).mockRejectedValue(
      new ApiError(400, 'TEST_ERROR', 'test error', [{ field: 'email', message: 'invalid' }])
    );

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'test error',
        code: 'TEST_ERROR',
        details: [{ field: 'email', message: 'invalid' }],
      },
    });
  });

  it('me: 未認証時は 401 を返す', async () => {
    const req = makeRequest();
    const res = makeResponse();

    await me(req, res);

    expect(authService.getMyProfile).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
        code: 'AUTHENTICATION_REQUIRED',
      },
    });
  });

  it('me: 正常系では 200 とプロフィールを返す', async () => {
    const req = makeRequest({ userId: 7 });
    const res = makeResponse();
    vi.mocked(authService.getMyProfile).mockResolvedValue({
      user: { id: 7, username: 'me', email: 'me@example.com' },
    });

    await me(req, res);

    expect(authService.getMyProfile).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { user: { id: 7, username: 'me', email: 'me@example.com' } },
    });
  });

  it('me: service の ApiError をそのまま返す', async () => {
    const req = makeRequest({ userId: 7 });
    const res = makeResponse();
    vi.mocked(authService.getMyProfile).mockRejectedValue(
      new ApiError(403, 'FORBIDDEN', ERROR_MESSAGES.FORBIDDEN_ADMIN_REQUIRED)
    );

    await me(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.FORBIDDEN_ADMIN_REQUIRED,
        code: 'FORBIDDEN',
      },
    });
  });

  it('me: 予期しない例外時は 500 を返す', async () => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const req = makeRequest({ userId: 7 });
    const res = makeResponse();
    vi.mocked(authService.getMyProfile).mockRejectedValue(new Error('boom'));

    await me(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
    expect(loggerSpy).toHaveBeenCalledWith('[AUTH ME] unexpected error occurred');
  });

  it('register: 予期しない例外時は 500 を返す', async () => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const req = makeRequest({
      body: { username: 'alice', email: 'alice@example.com', password: 'password123' }, // NOSONAR
    });
    const res = makeResponse();
    vi.mocked(authService.register).mockRejectedValue(new Error('boom'));

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
    expect(loggerSpy).toHaveBeenCalledWith('[AUTH REGISTER] unexpected error occurred');
  });

  it('login: 予期しない例外時は 500 を返す', async () => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const req = makeRequest({ body: { email: 'a@example.com', password: 'password123' } }); // NOSONAR
    const res = makeResponse();
    vi.mocked(authService.login).mockRejectedValue(new Error('boom'));

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
    expect(loggerSpy).toHaveBeenCalledWith('[AUTH LOGIN] unexpected error occurred');
  });

  it('login: details 付き ApiError をそのまま返す（重複ケース）', async () => {
    const req = makeRequest({ body: { email: 'a@example.com', password: 'password123' } }); // NOSONAR
    const res = makeResponse();
    vi.mocked(authService.login).mockRejectedValue(
      new ApiError(400, 'TEST_ERROR', 'test error', [{ field: 'email', message: 'invalid' }])
    );

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'test error',
        code: 'TEST_ERROR',
        details: [{ field: 'email', message: 'invalid' }],
      },
    });
  });
});
