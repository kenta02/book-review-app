import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import usersRouter from '../src/routes/users';
import User from '../src/models/Users';
import Review from '../src/models/Review';
import Favorite from '../src/models/Favorite';

// express アプリケーションファクトリー
function makeApp() {
  const app = express();
  app.use('/api/users', usersRouter);
  return app;
}

describe('Users route', () => {
  let app: express.Express;

  beforeEach(() => {
    // 各テスト用に express アプリケーションを作成
    app = makeApp();
    // モック関数をリセット
    vi.restoreAllMocks();
  });

  it('returns 400 when id is invalid (non positive integer)', async () => {
    // 無効な ID （abc）でリクエスト
    const res = await request(app).get('/api/users/abc');
    // 400 Bad Request を確認
    expect(res.status).toBe(400);
    // エラーコードが INVALID_USER_ID であることを確認
    expect(res.body.error.code).toBe('INVALID_USER_ID');
  });

  it('returns 404 when user does not exist', async () => {
    // User.findByPk が null を返すようにモック（ユーザーが存在しない）
    vi.spyOn(User, 'findByPk').mockResolvedValue(null);
    // ユーザー 123 を取得
    const res = await request(app).get('/api/users/123');
    // 404 Not Found を確認
    expect(res.status).toBe(404);
    // エラーコードが USER_NOT_FOUND であることを確認
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('returns user profile when user exists', async () => {
    // モック用のユーザーオブジェクトを作成
    const fakeUser = { toJSON: () => ({ id: 1, username: 'u', createdAt: '2025-06-01' }) } as unknown as InstanceType<typeof User>;
    // User.findByPk がモックユーザーを返すようにモック
    vi.spyOn(User, 'findByPk').mockResolvedValue(fakeUser);
    // Review.count が 5 を返すようにモック
    vi.spyOn(Review, 'count').mockResolvedValue(5 as unknown as number);
    // Favorite.count が 3 を返すようにモック
    vi.spyOn(Favorite, 'count').mockResolvedValue(3 as unknown as number);

    // ユーザー 1 を取得
    const res = await request(app).get('/api/users/1');
    // 200 OK を確認
    expect(res.status).toBe(200);
    // レスポンスの success フラグを確認
    expect(res.body.success).toBe(true);
    // ユーザー情報（レビュー数とお気に入り数含む）を確認
    expect(res.body.data).toMatchObject({ id: 1, username: 'u', reviewCount: 5, favoriteCount: 3 });
  });

  it('returns 500 if underlying service throws', async () => {
    // User.findByPk が正常なオブジェクトを返すようにモック
    vi.spyOn(User, 'findByPk').mockResolvedValue({ toJSON: () => ({ id: 2, username: 'foo' }) } as unknown as InstanceType<typeof User>);
    // Review.count がエラーをスロー（DB エラーを模擬）
    vi.spyOn(Review, 'count').mockRejectedValue(new Error('DB error'));

    // ユーザー 2 を取得
    const res = await request(app).get('/api/users/2');
    // 500 Internal Server Error を確認
    expect(res.status).toBe(500);
    // エラーコードが INTERNAL_SERVER_ERROR であることを確認
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
