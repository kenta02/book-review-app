import { describe, it, expect } from 'vitest';
import type { Request } from 'express';

import { validateGetCommentsForReview, validateCreateComment } from '../src/validators/comment.validator';

describe('comment.validator', () => {
  describe('validateGetCommentsForReview', () => {
    it('returns error for invalid id', () => {
      // 無効な reviewId でエラーを返すことをテスト
      const req = { params: { reviewId: 'foo' } } as unknown as Request;
      const result = validateGetCommentsForReview(req);
      // バリデーション失敗を確認
      expect(result.success).toBe(false);
      if (!result.success) {
        // エラーコードが正しいことを確認
        expect(result.errors[0].code).toBe('INVALID_REVIEW_ID');
      }
    });

    it('parses valid id', () => {
      // 有効な reviewId をパースすることをテスト
      const req = { params: { reviewId: '42' } } as unknown as Request;
      const result = validateGetCommentsForReview(req);
      // バリデーション成功を確認
      expect(result.success).toBe(true);
      if (result.success) {
        // パースされた ID が正し整数値に変換されていることを確認
        expect(result.data.reviewId).toBe(42);
      }
    });
  });

  describe('validateCreateComment', () => {
    it('catches multiple validation issues', () => {
      // 複数の検証エラーをキャッチすることをテスト（reviewId が 0 は無効、content が空、parentId が負数）
      const req = {
        params: { reviewId: '0' },
        body: { content: '', parentId: -1 },
      } as unknown as Request;
      const result = validateCreateComment(req);
      // バリデーション失敗を確認
      expect(result.success).toBe(false);
      if (!result.success) {
        const codes = result.errors.map((e) => e.code);
        // 各エラーコードが含まれていることを確認
        expect(codes).toContain('INVALID_REVIEW_ID');
        // content フィールドのエラーを確認
        expect(result.errors.some((e) => e.field === 'content')).toBe(true);
        // parentId フィールドのエラーを確認
        expect(result.errors.some((e) => e.field === 'parentId')).toBe(true);
      }
    });

    it('accepts a well-formed request', () => {
      // 正しい形式のリクエストが受け入れられることをテスト
      const req = {
        params: { reviewId: '5' },
        body: { content: ' ok ', parentId: '10' },
      } as unknown as Request;
      const result = validateCreateComment(req);
      // バリデーション成功を確認
      expect(result.success).toBe(true);
      if (result.success) {
        // 各フィールドが正しくパースされていることを確認
        expect(result.data.reviewId).toBe(5);
        expect(result.data.content).toBe('ok');
        expect(result.data.parentId).toBe('10');
      }
    });

    it('trims content and allows undefined parentId', () => {
      // content が trim され、parentId が undefined で許可されることをテスト
      const req = {
        params: { reviewId: '5' },
        body: { content: ' hi ' },
      } as unknown as Request;
      const result = validateCreateComment(req);
      // バリデーション成功を確認
      expect(result.success).toBe(true);
      if (result.success) {
        // content が trim されていることを確認
        expect(result.data.content).toBe('hi');
        // parentId が undefined で許可されていることを確認
        expect(result.data.parentId).toBeUndefined();
      }
    });
  });
});