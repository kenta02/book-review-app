import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreateCommentServiceDto } from '../src/modules/comment/dto/comment.dto';
import * as commentRepository from '../src/repositories/comment.repository';
import * as reviewRepository from '../src/repositories/review.repository';
import * as commentService from '../src/services/comment.service';
import { logger } from '../src/utils/logger';

vi.mock('../src/repositories/comment.repository', () => ({
  findCommentsByReviewId: vi.fn(),
  findCommentById: vi.fn(),
  createComment: vi.fn(),
}));

vi.mock('../src/repositories/review.repository', () => ({
  findReviewById: vi.fn(),
}));

function makeCommentModel(input: Record<string, unknown>) {
  return {
    toJSON: () => input,
    get: (key: string) => input[key],
  };
}

describe('comment.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listComments', () => {
    it('returns nested replies in correct order and logs activity', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      vi.mocked(commentRepository.findCommentsByReviewId).mockResolvedValue([
        makeCommentModel({
          id: 1,
          content: 'parent',
          parentId: null,
          reviewId: 10,
          userId: 2,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        }) as never,
        makeCommentModel({
          id: 2,
          content: 'reply',
          parentId: 1,
          reviewId: 10,
          userId: 3,
          createdAt: '2025-01-03T00:00:00.000Z',
          updatedAt: '2025-01-04T00:00:00.000Z',
        }) as never,
      ]);

      const result = await commentService.listComments(10);

      expect(infoSpy).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies?.[0].id).toBe(2);
    });
  });

  describe('createComment', () => {
    it('throws REVIEW_NOT_FOUND when review does not exist', async () => {
      vi.mocked(reviewRepository.findReviewById).mockResolvedValue(null);

      const dto: CreateCommentServiceDto = { reviewId: 123, content: 'x', userId: 1 };
      await expect(commentService.createComment(dto)).rejects.toMatchObject({
        code: 'REVIEW_NOT_FOUND',
      });
    });

    it('throws VALIDATION_ERROR when parent comment is missing', async () => {
      vi.mocked(reviewRepository.findReviewById).mockResolvedValue({} as never);
      vi.mocked(commentRepository.findCommentById).mockResolvedValue(null);

      const dto: CreateCommentServiceDto = {
        reviewId: 1,
        content: 'hi',
        userId: 5,
        parentId: 99,
      };

      await expect(commentService.createComment(dto)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('throws VALIDATION_ERROR when parent belongs to another review', async () => {
      vi.mocked(reviewRepository.findReviewById).mockResolvedValue({} as never);
      vi.mocked(commentRepository.findCommentById).mockResolvedValue(
        makeCommentModel({ reviewId: 888 }) as never
      );

      const dto: CreateCommentServiceDto = {
        reviewId: 10,
        content: 'hi',
        userId: 5,
        parentId: 7,
      };

      await expect(commentService.createComment(dto)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    });

    it('creates a comment when all conditions are satisfied', async () => {
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      vi.mocked(reviewRepository.findReviewById).mockResolvedValue({} as never);
      vi.mocked(commentRepository.findCommentById).mockResolvedValue(
        makeCommentModel({ reviewId: 10 }) as never
      );
      vi.mocked(commentRepository.createComment).mockResolvedValue(
        makeCommentModel({
          id: 77,
          content: 'created',
          parentId: null,
          reviewId: 10,
          userId: 2,
          createdAt: '2025-05-05T00:00:00.000Z',
          updatedAt: '2025-05-05T00:00:00.000Z',
        }) as never
      );

      const dto = await commentService.createComment({
        reviewId: 10,
        content: 'created',
        userId: 2,
        parentId: null,
      });

      expect(infoSpy).toHaveBeenCalled();
      expect(commentRepository.createComment).toHaveBeenCalledWith({
        content: 'created',
        reviewId: 10,
        parentId: null,
        userId: 2,
      });
      expect(dto.id).toBe(77);
      expect(dto.content).toBe('created');
    });
  });
});
