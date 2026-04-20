import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as bookRepository from '../src/repositories/book.repository';
import * as reviewRepository from '../src/repositories/review.repository';
import { sequelize } from '../src/sequelize';
import * as reviewService from '../src/services/review.service';

vi.mock('../src/repositories/book.repository', () => ({
  findBookById: vi.fn(),
}));

vi.mock('../src/repositories/review.repository', () => ({
  findReviewsWithPagination: vi.fn(),
  findReviewDetailById: vi.fn(),
  findReviewById: vi.fn(),
  createReview: vi.fn(),
  updateReviewContent: vi.fn(),
  findAnyCommentByReviewId: vi.fn(),
  deleteReview: vi.fn(),
}));

vi.mock('../src/sequelize', () => ({
  sequelize: {
    transaction: vi.fn(),
  },
}));

function makeReviewModel(input: Record<string, unknown>) {
  return {
    toJSON: () => input,
    get: (key: string) => input[key],
  };
}

describe('review.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listReviews', () => {
    it('returns pagination and converted DTOs', async () => {
      vi.mocked(reviewRepository.findReviewsWithPagination).mockResolvedValue({
        rows: [
          makeReviewModel({
            id: 1,
            bookId: 3,
            userId: 9,
            content: 'good',
            rating: 5,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          }),
        ],
        count: 1,
      } as never);

      const result = await reviewService.listReviews({ page: 2, limit: 10, bookId: 3 });

      expect(reviewRepository.findReviewsWithPagination).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        bookId: 3,
      });
      expect(result.pagination).toEqual({
        currentPage: 2,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10,
      });
      expect(result.reviews[0]).toMatchObject({ id: 1, bookId: 3, userId: 9, content: 'good' });
    });
  });

  describe('createReview', () => {
    it('throws 404 when book does not exist', async () => {
      vi.mocked(bookRepository.findBookById).mockResolvedValue(null);

      await expect(
        reviewService.createReview({ bookId: 1, content: 'x', rating: 5, userId: 1 })
      ).rejects.toMatchObject({ statusCode: 404, code: 'BOOK_NOT_FOUND' });
    });

    it('creates review when book exists', async () => {
      vi.mocked(bookRepository.findBookById).mockResolvedValue({} as never);
      vi.mocked(reviewRepository.createReview).mockResolvedValue(
        makeReviewModel({
          id: 2,
          bookId: 1,
          userId: 1,
          content: 'nice',
          rating: 4,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }) as never
      );

      const result = await reviewService.createReview({
        bookId: 1,
        content: 'nice',
        rating: 4,
        userId: 1,
      });

      expect(reviewRepository.createReview).toHaveBeenCalledWith({
        bookId: 1,
        userId: 1,
        content: 'nice',
        rating: 4,
      });
      expect(result.id).toBe(2);
    });
  });

  describe('deleteReview', () => {
    it('deletes review inside a sequelize transaction when no related comments exist', async () => {
      const transaction = { commit: vi.fn(), rollback: vi.fn() };
      vi.mocked(reviewRepository.findReviewById).mockResolvedValue(
        makeReviewModel({ id: 3, userId: 7 }) as never
      );
      vi.mocked(reviewRepository.findAnyCommentByReviewId).mockResolvedValue(null);
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);

      await reviewService.deleteReview({ reviewId: 3, userId: 7 });

      expect(sequelize.transaction).toHaveBeenCalledTimes(1);
      expect(reviewRepository.findAnyCommentByReviewId).toHaveBeenCalledWith(3, transaction);
      expect(reviewRepository.deleteReview).toHaveBeenCalledWith(
        expect.objectContaining({ get: expect.any(Function) }),
        transaction
      );
      expect(transaction.commit).toHaveBeenCalled();
    });

    it('throws 409 when related comments exist', async () => {
      const transaction = { commit: vi.fn(), rollback: vi.fn() };
      vi.mocked(reviewRepository.findReviewById).mockResolvedValue(
        makeReviewModel({ id: 3, userId: 7 }) as never
      );
      vi.mocked(reviewRepository.findAnyCommentByReviewId).mockResolvedValue({ id: 99 } as never);
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);

      await expect(reviewService.deleteReview({ reviewId: 3, userId: 7 })).rejects.toMatchObject({
        statusCode: 409,
        code: 'RELATED_DATA_EXISTS',
      });
      expect(reviewRepository.deleteReview).not.toHaveBeenCalled();
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });
});
