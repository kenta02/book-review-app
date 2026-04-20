import type { NextFunction, Request, Response } from 'express';
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

function makeRequest(
  input: {
    params?: Record<string, string>;
    query?: Record<string, string>;
    body?: unknown;
    userId?: number;
  } = {}
): TestRequest {
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

function makeNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

describe('review.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listReviews: returns 400 when query validation fails', async () => {
    const req = makeRequest({ query: { bookId: 'abc' } });
    const res = makeResponse();
    const next = makeNext();

    await listReviews(req, res, next);

    expect(reviewService.listReviews).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      })
    );
  });

  it('listReviews: returns data on success', async () => {
    const req = makeRequest({ query: { bookId: '1' } });
    const res = makeResponse();
    const next = makeNext();
    const data = { reviews: [], pagination: { page: 1, totalItems: 0, totalPages: 0 } };
    vi.mocked(reviewService.listReviews).mockResolvedValue(data as never);

    await listReviews(req, res, next);

    expect(reviewService.listReviews).toHaveBeenCalledWith({ bookId: 1, page: 1, limit: 20 });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('listReviews: forwards ApiError', async () => {
    const req = makeRequest({ query: { bookId: '1' } });
    const res = makeResponse();
    const next = makeNext();
    vi.mocked(reviewService.listReviews).mockRejectedValue(
      new ApiError(404, 'NOT_FOUND', ERROR_MESSAGES.NOT_FOUND)
    );

    await listReviews(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it('getReviewDetail: returns data on success', async () => {
    const req = makeRequest({ params: { reviewId: '1' } });
    const res = makeResponse();
    const next = makeNext();
    const data = { id: 1, bookId: 10, content: 'text', createdAt: 'x', updatedAt: 'x' };
    vi.mocked(reviewService.getReviewDetail).mockResolvedValue(data as never);

    await getReviewDetail(req, res, next);

    expect(reviewService.getReviewDetail).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('getReviewDetail: returns 500 when service fails', async () => {
    const req = makeRequest({ params: { reviewId: '1' } });
    const res = makeResponse();
    const next = makeNext();
    vi.mocked(reviewService.getReviewDetail).mockRejectedValue(new Error('boom'));

    await getReviewDetail(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('createReview: returns 201 on success', async () => {
    const req = makeRequest({ body: { bookId: 1, content: 'x' }, userId: 2 });
    const res = makeResponse();
    const next = makeNext();
    const created = { id: 1, bookId: 1, content: 'x' } as const;
    vi.mocked(reviewService.createReview).mockResolvedValue(created as never);

    await createReview(req, res, next);

    expect(reviewService.createReview).toHaveBeenCalledWith({ bookId: 1, content: 'x', userId: 2 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: created });
  });

  it('createReview: returns 500 when service fails', async () => {
    const req = makeRequest({ body: { bookId: 1, content: 'x' }, userId: 2 });
    const res = makeResponse();
    const next = makeNext();
    vi.mocked(reviewService.createReview).mockRejectedValue(new Error('boom'));

    await createReview(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('createReview: returns 401 when unauthenticated', async () => {
    const req = makeRequest({ body: { bookId: 1, content: 'x' } });
    const res = makeResponse();
    const next = makeNext();

    await createReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
        code: 'AUTHENTICATION_REQUIRED',
      },
    });
  });

  it('updateReview: returns 401 when unauthenticated', async () => {
    const req = makeRequest({ params: { reviewId: '1' }, body: { content: 'new' } });
    const res = makeResponse();
    const next = makeNext();

    await updateReview(req, res, next);

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
    const next = makeNext();
    vi.mocked(reviewService.updateReview).mockRejectedValue(
      new ApiError(403, 'FORBIDDEN', ERROR_MESSAGES.FORBIDDEN_REVIEW_UPDATE)
    );

    await updateReview(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it('updateReview: returns 400 when reviewId is invalid', async () => {
    const req = makeRequest({ params: { reviewId: 'abc' }, body: { content: 'new' }, userId: 2 });
    const res = makeResponse();
    const next = makeNext();

    await updateReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INVALID_REVIEW_ID' }),
      })
    );
  });

  it('updateReview: returns 500 when service fails', async () => {
    const req = makeRequest({ params: { reviewId: '1' }, body: { content: 'new' }, userId: 2 });
    const res = makeResponse();
    const next = makeNext();
    vi.mocked(reviewService.updateReview).mockRejectedValue(new Error('boom'));

    await updateReview(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('deleteReview: returns 401 when unauthenticated', async () => {
    const req = makeRequest({ params: { reviewId: '2' } });
    const res = makeResponse();
    const next = makeNext();

    await deleteReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
        code: 'AUTHENTICATION_REQUIRED',
      },
    });
  });

  it('deleteReview: returns 400 when reviewId is invalid', async () => {
    const req = makeRequest({ params: { reviewId: 'abc' }, userId: 1 });
    const res = makeResponse();
    const next = makeNext();

    await deleteReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INVALID_REVIEW_ID' }),
      })
    );
  });

  it('deleteReview: returns 500 when service fails', async () => {
    const req = makeRequest({ params: { reviewId: '2' }, userId: 5 });
    const res = makeResponse();
    const next = makeNext();
    vi.mocked(reviewService.deleteReview).mockRejectedValue(new Error('boom'));

    await deleteReview(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('deleteReview: returns 204 on success', async () => {
    const req = makeRequest({ params: { reviewId: '2' }, userId: 5 });
    const res = makeResponse();
    const next = makeNext();
    vi.mocked(reviewService.deleteReview).mockResolvedValue(undefined);

    await deleteReview(req, res, next);

    expect(reviewService.deleteReview).toHaveBeenCalledWith({ reviewId: 2, userId: 5 });
    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });
});
