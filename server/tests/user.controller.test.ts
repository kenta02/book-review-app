import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ERROR_MESSAGES } from '../src/constants/error-messages';
import { ApiError } from '../src/errors/ApiError';
import { getUserProfile } from '../src/controllers/user.controller';
import * as userService from '../src/services/user.service';

vi.mock('../src/services/user.service', () => ({
  getUserProfile: vi.fn(),
}));

type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

function makeRequest(id: string): Request {
  return { params: { id } } as unknown as Request;
}

function makeResponse(): MockResponse {
  const res = {} as MockResponse;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function makeNext() {
  return vi.fn<NextFunction>();
}

describe('user.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when id is invalid', async () => {
    const req = makeRequest('abc');
    const res = makeResponse();
    const next = makeNext();

    await getUserProfile(req, res, next);

    expect(userService.getUserProfile).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INVALID_USER_ID' }),
      })
    );
  });

  it('returns 404 for USER_NOT_FOUND', async () => {
    const req = makeRequest('10');
    const res = makeResponse();
    const next = makeNext();
    vi.mocked(userService.getUserProfile).mockRejectedValue(
      new ApiError(404, 'USER_NOT_FOUND', ERROR_MESSAGES.USER_NOT_FOUND)
    );

    await getUserProfile(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    const [error] = next.mock.calls[0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
      message: ERROR_MESSAGES.USER_NOT_FOUND,
    });
  });

  it('returns 200 with profile on success', async () => {
    const req = makeRequest('10');
    const res = makeResponse();
    const next = makeNext();
    const data = {
      id: 10,
      username: 'bob',
      reviewCount: 3,
      favoriteCount: 4,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    vi.mocked(userService.getUserProfile).mockResolvedValue(data);

    await getUserProfile(req, res, next);

    expect(userService.getUserProfile).toHaveBeenCalledWith(10);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});
