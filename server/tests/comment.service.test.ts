import { describe, it, expect, beforeEach, vi } from 'vitest';

import * as commentService from '../src/services/comment.service';
import Review from '../src/models/Review';
import Comment from '../src/models/Comment';
import { logger } from '../src/utils/logger';
import type { CreateCommentServiceDto } from '../src/types/dto';

// Sequelize インスタンス型を定義
type CommentInstance = InstanceType<typeof Comment>;

// モデルメソッドを spy して外部依存を排除

describe('comment.service', () => {
  beforeEach(() => {
    // 各テスト用に spy をリセット
    vi.restoreAllMocks();
  });

  describe('listComments', () => {
    it('returns nested replies in correct order and logs activity', async () => {
      // logger.info のスパイ設定
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      // 親コメント（parentId: null）をモック
      const parent = {
        toJSON: () => ({
          id: 1,
          content: 'parent',
          parentId: null,
          reviewId: 10,
          userId: 2,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        }),
      } as unknown as Comment;
      // 返信コメント（parentId: 1）をモック
      const reply = {
        toJSON: () => ({
          id: 2,
          content: 'reply',
          parentId: 1,
          reviewId: 10,
          userId: 3,
          createdAt: '2025-01-03T00:00:00.000Z',
          updatedAt: '2025-01-04T00:00:00.000Z',
        }),
      } as unknown as Comment;

      // Comment.findAll をモック化
      vi.spyOn(Comment, 'findAll').mockResolvedValue([parent, reply] as unknown as CommentInstance[]);

      // listComments を実行
      const result = await commentService.listComments(10);

      // logger.info が呼ばれたことを確認
      expect(infoSpy).toHaveBeenCalled();
      // 親コメントのみが結果に含まれる（返信はネストされる）
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      // 返信コメントがネストされていることを確認
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies?.[0].id).toBe(2);
    });
  });

  describe('createComment', () => {
    it('throws REVIEW_NOT_FOUND when review does not exist', async () => {
      // Review が見つからないようにモック
      vi.spyOn(Review, 'findByPk').mockResolvedValue(null);

      const dto: CreateCommentServiceDto = { reviewId: 123, content: 'x', userId: 1 };
      // REVIEW_NOT_FOUND エラーが投げられることを確認
      await expect(commentService.createComment(dto)).rejects.toMatchObject({ code: 'REVIEW_NOT_FOUND' });
    });

    it('throws VALIDATION_ERROR when parent comment is missing', async () => {
      // Review は存在することをモック（型安全なキャスト）
      vi.spyOn(Review, 'findByPk').mockResolvedValue({} as unknown as InstanceType<typeof Review>);
      // 親コメント（parentId: 99）が見つからないようにモック
      vi.spyOn(Comment, 'findByPk').mockResolvedValue(null);

      const dto: CreateCommentServiceDto = {
        reviewId: 1,
        content: 'hi',
        userId: 5,
        parentId: 99,
      };
      // 親コメントが見つからないため VALIDATION_ERROR が投げられることを確認
      await expect(commentService.createComment(dto)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });

    it('throws VALIDATION_ERROR when parent belongs to another review', async () => {
      // Review は存在することをモック
      vi.spyOn(Review, 'findByPk').mockResolvedValue({} as unknown as InstanceType<typeof Review>);
      // 親コメントは異なる reviewId（888）を持つようにモック
      const parentCommentMock = { get: () => 888 } as unknown as InstanceType<typeof Comment>;
      vi.spyOn(Comment, 'findByPk').mockResolvedValue(parentCommentMock);

      const dto: CreateCommentServiceDto = {
        reviewId: 10,
        content: 'hi',
        userId: 5,
        parentId: 7,
      };
      // 親コメントが別のレビューに属するため VALIDATION_ERROR が投げられることを確認
      await expect(commentService.createComment(dto)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });

    it('creates a comment when all conditions are satisfied', async () => {
      // logger.info のスパイ設定
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
      // Review は存在することをモック
      vi.spyOn(Review, 'findByPk').mockResolvedValue({} as unknown as InstanceType<typeof Review>);
      // 親コメントのレビュー ID（10）がリクエストのレビュー ID と一致するようにモック
      const parentCommentMock = { get: () => 10 } as unknown as InstanceType<typeof Comment>;
      vi.spyOn(Comment, 'findByPk').mockResolvedValue(parentCommentMock);
      // 作成されたコメントのモック
      const created = {
        toJSON: () => ({
          id: 77,
          content: 'created',
          parentId: null,
          reviewId: 10,
          userId: 2,
          createdAt: '2025-05-05T00:00:00.000Z',
          updatedAt: '2025-05-05T00:00:00.000Z',
        }),
        get: (key: string) => {
          if (key === 'id') return 77;
          return undefined;
        },
      } as unknown as Comment;
      // Comment.create をモック化
      vi.spyOn(Comment, 'create').mockResolvedValue(created);

      // コメント作成を実行
      const dto = await commentService.createComment({
        reviewId: 10,
        content: 'created',
        userId: 2,
        parentId: null,
      } as CreateCommentServiceDto);

      // logger が呼ばれたことを確認
      expect(infoSpy).toHaveBeenCalled();
      // 作成されたコメントの ID を確認
      expect(dto.id).toBe(77);
      // 作成されたコメントの内容を確認
      expect(dto.content).toBe('created');
    });
  });
});
