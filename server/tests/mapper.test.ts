import { describe, it, expect } from 'vitest';

import { commentModelToDto, normalizeListBook, reviewModelToDto } from '../src/utils/mapper';

// 内部ヘルパーはエクスポートされていないため、各ケースを commentModelToDto 経由で
// テストします。

describe('mapper utilities', () => {
  it('converts normal values correctly', () => {
    const model = {
      toJSON: () => ({
        id: '5',
        content: 'hello',
        parentId: '2',
        reviewId: '3',
        userId: '4',
        createdAt: '2025-02-02T12:00:00Z',
        updatedAt: '2025-02-02T13:00:00Z',
      }),
    };

    // DTO に変換
    const dto = commentModelToDto(model as unknown as { toJSON: () => Record<string, unknown> });
    // 変換結果を確認
    expect(dto.id).toBe(5);
    expect(dto.parentId).toBe(2);
    expect(dto.reviewId).toBe(3);
    expect(dto.userId).toBe(4);
    expect(dto.content).toBe('hello');
    expect(dto.createdAt).toBe(new Date('2025-02-02T12:00:00Z').toISOString());
    expect(dto.updatedAt).toBe(new Date('2025-02-02T13:00:00Z').toISOString());
  });

  it('handles null/undefined and non-numeric values gracefully', () => {
    const model = {
      toJSON: () => ({
        id: null,
        content: undefined,
        parentId: 'not-a-number',
        reviewId: '7',
        userId: null,
        createdAt: null,
        updatedAt: undefined,
      }),
    };

    // DTO に変換
    const dto = commentModelToDto(model as unknown as { toJSON: () => Record<string, unknown> });
    // id は Number(null) -> 0 に変換（ヘルパー関数の動作）
    expect(dto.id).toBe(0);
    expect(dto.content).toBe('');
    // parentId は asNumberOrNull で null に落ちる（数値でない値のハンドリング）
    expect(dto.parentId).toBeNull();
    expect(dto.reviewId).toBe(7);
    expect(dto.userId).toBeNull();
    // 日時は formatDate 関数がエラーを抑制して空文字列を返す
    expect(dto.createdAt).toBe('');
    expect(dto.updatedAt).toBe('');
  });

  it('reviewModelToDto が Review モデルを DTO へ変換できる', () => {
    const dto = reviewModelToDto({
      toJSON: () => ({
        id: '11',
        bookId: '20',
        userId: '3',
        content: 'review text',
        rating: '4',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }),
    });

    expect(dto).toMatchObject({
      id: 11,
      bookId: 20,
      userId: 3,
      content: 'review text',
      rating: 4,
    });
  });

  it('normalizeListBook が集計列を API 返却用に正規化する', () => {
    const normalized = normalizeListBook({
      toJSON: () => ({
        id: 1,
        title: 'Book A',
        averageRating: '4.5',
        reviewCount: null,
      }),
    });

    expect(normalized.averageRating).toBe(4.5);
    expect(normalized.reviewCount).toBe(0);
  });
});
