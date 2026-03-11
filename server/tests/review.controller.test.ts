import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ERROR_MESSAGES } from '../src/constants/error-messages';
import { ApiError } from '../src/errors/ApiError';
import {
  createReview,
  deleteReview,
  getReviewDetail,
  listReviews,
  updateReview,
} from '../src/controllers/review.controller';
import * as reviewService from '../src/services/review.service';

vi.mock('../src/services/review.service', () => ({
  listReviews: vi.fn(),
  getReviewDetail: vi.fn(),
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
}));

type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  sendStatus: ReturnType<typeof vi.fn>;
};

type TestRequest = Request & { userId?: number };

function makeRequest(input: {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  userId?: number;
} = {}): TestRequest {
  return {
    params: input.params ?? {},
    query: input.query ?? {},
    body: input.body ?? {},
    userId: input.userId,
  } as TestRequest;
}

function makeResponse(): MockResponse {
  const res = {} as MockResponse;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  return res;
}

describe('review.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listReviews: returns 400 when query validation fails', async () => {
    const req = makeRequest({ query: { bookId: 'abc' } });
    const res = makeResponse();

    await listReviews(req, res);

    expect(reviewService.listReviews).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      })
    );
  });

  it('getReviewDetail: returns data on success', async () => {
    const req = makeRequest({ params: { reviewId: '1' } });
    const res = makeResponse();
    const data = { id: 1, bookId: 10, content: 'text', createdAt: 'x', updatedAt: 'x' };
    vi.mocked(reviewService.getReviewDetail).mockResolvedValue(data as never);

    await getReviewDetail(req, res);

    expect(reviewService.getReviewDetail).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('createReview: returns 401 when unauthenticated', async () => {
    const req = makeRequest({ body: { bookId: 1, content: 'x' } });
    const res = makeResponse();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
        code: 'AUTHENTICATION_REQUIRED',
      },
    });
  });

  it('updateReview: forwards ApiError', async () => {
    const req = makeRequest({ params: { reviewId: '1' }, body: { content: 'new' }, userId: 2 });
    const res = makeResponse();
    vi.mocked(reviewService.updateReview).mockRejectedValue(
      new ApiError(403, 'FORBIDDEN', ERROR_MESSAGES.FORBIDDEN_REVIEW_UPDATE)
    );

    await updateReview(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.FORBIDDEN_REVIEW_UPDATE,
        code: 'FORBIDDEN',
      },
    });
  });

  it('deleteReview: returns 204 on success', async () => {
    const req = makeRequest({ params: { reviewId: '2' }, userId: 5 });
    const res = makeResponse();
    vi.mocked(reviewService.deleteReview).mockResolvedValue(undefined);

    await deleteReview(req, res);

    expect(reviewService.deleteReview).toHaveBeenCalledWith({ reviewId: 2, userId: 5 });
    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });
});
