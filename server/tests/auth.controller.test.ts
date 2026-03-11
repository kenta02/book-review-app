import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ERROR_MESSAGES } from '../src/constants/error-messages';
import { ApiError } from '../src/errors/ApiError';
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

  it('register: returns 400 when validation fails', async () => {
    const req = makeRequest({ body: { username: 'a', email: 'bad', password: '123' } });
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

  it('register: returns 201 on success', async () => {
    const req = makeRequest({
      body: { username: 'alice', email: 'alice@example.com', password: 'password123' },
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
      password: 'password123',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('login: returns ApiError as-is', async () => {
    const req = makeRequest({ body: { email: 'a@example.com', password: 'password123' } });
    const res = makeResponse();
    vi.mocked(authService.login).mockRejectedValue(
      new ApiError(401, 'AUTHENTICATION_FAILED', ERROR_MESSAGES.AUTHENTICATION_FAILED)
    );

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.AUTHENTICATION_FAILED,
        code: 'AUTHENTICATION_FAILED',
      },
    });
  });

  it('me: returns 401 when unauthenticated', async () => {
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

  it('me: returns 200 with profile on success', async () => {
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
});
