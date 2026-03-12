import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as reviewRepository from '../src/repositories/review.repository';
import * as reviewService from '../src/services/review.service';

vi.mock('../src/repositories/review.repository', () => ({
  findReviewsWithPagination: vi.fn(),
  findReviewDetailById: vi.fn(),
  findReviewById: vi.fn(),
  findBookById: vi.fn(),
  createReview: vi.fn(),
  updateReviewContent: vi.fn(),
  findAnyCommentByReviewId: vi.fn(),
  deleteReview: vi.fn(),
  createTransaction: vi.fn(),
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
        where: { bookId: 3 },
        limit: 10,
        offset: 10,
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
      vi.mocked(reviewRepository.findBookById).mockResolvedValue(null);

      await expect(
        reviewService.createReview({ bookId: 1, content: 'x', rating: 5, userId: 1 })
      ).rejects.toMatchObject({ statusCode: 404, code: 'BOOK_NOT_FOUND' });
    });

    it('creates review when book exists', async () => {
      vi.mocked(reviewRepository.findBookById).mockResolvedValue({} as never);
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

      const result = await reviewService.createReview({ bookId: 1, content: 'nice', rating: 4, userId: 1 });

      expect(reviewRepository.createReview).toHaveBeenCalledWith({
        bookId: 1,
        userId: 1,
        content: 'nice',
        rating: 4,
      });
      expect(result.id).toBe(2);
    });
  });
});
