import type { Request, Response } from 'express';
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

describe('user.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when id is invalid', async () => {
    const req = makeRequest('abc');
    const res = makeResponse();

    await getUserProfile(req, res);

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
    vi.mocked(userService.getUserProfile).mockRejectedValue(
      new ApiError(404, 'USER_NOT_FOUND', ERROR_MESSAGES.USER_NOT_FOUND)
    );

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.USER_NOT_FOUND,
        code: 'USER_NOT_FOUND',
      },
    });
  });

  it('returns 200 with profile on success', async () => {
    const req = makeRequest('10');
    const res = makeResponse();
    const data = {
      id: 10,
      username: 'bob',
      reviewCount: 3,
      favoriteCount: 4,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    vi.mocked(userService.getUserProfile).mockResolvedValue(data);

    await getUserProfile(req, res);

    expect(userService.getUserProfile).toHaveBeenCalledWith(10);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});
