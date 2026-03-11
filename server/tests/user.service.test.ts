import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as userRepository from '../src/repositories/user.repository';
import * as userService from '../src/services/user.service';

vi.mock('../src/repositories/user.repository', () => ({
  findUserById: vi.fn(),
  countReviewsByUserId: vi.fn(),
  countFavoritesByUserId: vi.fn(),
}));

function makeUserInstance(input: { id: number; username: string; createdAt: Date }) {
  return {
    toJSON: () => input,
  } as unknown as userRepository.UserInstance;
}

describe('user.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 404 when user is missing', async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue(null);

    await expect(userService.getUserProfile(100)).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  });

  it('returns profile with review/favorite counts', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    vi.mocked(userRepository.findUserById).mockResolvedValue(
      makeUserInstance({ id: 2, username: 'bob', createdAt })
    );
    vi.mocked(userRepository.countReviewsByUserId).mockResolvedValue(4);
    vi.mocked(userRepository.countFavoritesByUserId).mockResolvedValue(7);

    const result = await userService.getUserProfile(2);

    expect(result).toEqual({
      id: 2,
      username: 'bob',
      reviewCount: 4,
      favoriteCount: 7,
      createdAt,
    });
  });
});
