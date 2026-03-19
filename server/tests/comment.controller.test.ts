import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ERROR_MESSAGES } from '../src/constants/error-messages';
import { ApiError } from '../src/errors/ApiError';
import { logger } from '../src/utils/logger';
import { createComment, listComments } from '../src/controllers/comment.controller';
import * as commentService from '../src/services/comment.service';

vi.mock('../src/services/comment.service', () => ({
  listComments: vi.fn(),
  createComment: vi.fn(),
}));

type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

type TestRequest = Request & { userId?: number };

function makeRequest(
  input: {
    params?: Record<string, string>;
    body?: unknown;
    userId?: number;
  } = {}
): TestRequest {
  return {
    params: input.params ?? {},
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

describe('comment.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listComments: returns 400 for invalid reviewId', async () => {
    const req = makeRequest({ params: { reviewId: 'abc' } });
    const res = makeResponse();

    await listComments(req, res);

    expect(commentService.listComments).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INVALID_REVIEW_ID' }),
      })
    );
  });

  it('listComments: returns comments on success', async () => {
    const req = makeRequest({ params: { reviewId: '3' } });
    const res = makeResponse();
    const comments = [{ id: 1, content: 'nice' }];
    vi.mocked(commentService.listComments).mockResolvedValue(comments as never);

    await listComments(req, res);

    expect(commentService.listComments).toHaveBeenCalledWith(3);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { comments } });
  });

  it('listComments: forwards ApiError', async () => {
    const req = makeRequest({ params: { reviewId: '3' } });
    const res = makeResponse();
    vi.mocked(commentService.listComments).mockRejectedValue(
      new ApiError(404, 'NOT_FOUND', ERROR_MESSAGES.NOT_FOUND)
    );

    await listComments(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.NOT_FOUND,
        code: 'NOT_FOUND',
      },
    });
  });

  it('listComments: returns 500 when service fails', async () => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const req = makeRequest({ params: { reviewId: '3' } });
    const res = makeResponse();
    vi.mocked(commentService.listComments).mockRejectedValue(new Error('boom'));

    await listComments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
    });
    expect(loggerSpy).toHaveBeenCalledWith('[COMMENTS GET] unexpected error occurred');
  });

  it('createComment: returns 401 when unauthenticated', async () => {
    const req = makeRequest({ params: { reviewId: '1' }, body: { content: 'x' } });
    const res = makeResponse();

    await createComment(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
        code: 'AUTHENTICATION_REQUIRED',
      },
    });
  });

  it('createComment: returns 400 when validation fails', async () => {
    const req = makeRequest({ params: { reviewId: '1' }, body: { content: '' }, userId: 7 });
    const res = makeResponse();

    await createComment(req, res);

    expect(commentService.createComment).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      })
    );
  });

  it('createComment: forwards ApiError with details', async () => {
    const req = makeRequest({ params: { reviewId: '1' }, body: { content: 'ok' }, userId: 7 });
    const res = makeResponse();
    vi.mocked(commentService.createComment).mockRejectedValue(
      new ApiError(400, 'VALIDATION_ERROR', ERROR_MESSAGES.VALIDATION_FAILED, [
        { field: 'parentId', message: ERROR_MESSAGES.PARENT_COMMENT_NOT_FOUND },
      ])
    );

    await createComment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        code: 'VALIDATION_ERROR',
        details: [{ field: 'parentId', message: ERROR_MESSAGES.PARENT_COMMENT_NOT_FOUND }],
      },
    });
  });

  it('createComment: returns 500 when service fails', async () => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const req = makeRequest({ params: { reviewId: '1' }, body: { content: 'ok' }, userId: 7 });
    const res = makeResponse();
    vi.mocked(commentService.createComment).mockRejectedValue(new Error('boom'));

    await createComment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR' },
    });
    expect(loggerSpy).toHaveBeenCalledWith('[COMMENTS POST] unexpected error occurred');
  });
});
