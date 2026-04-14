import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import authRouter from '../src/routes/auth';
import { apiErrorHandler } from '../src/middleware/errorHandler';
import User from '../src/models/Users';

// このファイルの目的：認証関連ルートの正常系／異常系を確認するテスト
// - /auth/register, /auth/login, /auth/me の仕様（ステータス・エラーコード）を検証
// - DB や bcrypt/jwt はモックして副作用を排除する

type UserInstance = InstanceType<typeof User>;

type TestRequest = express.Request & { userId?: number };
// テスト用の簡易アプリを作成するユーティリティ
// req.userId をセットすることで「認証済み」状態を模擬できます
function makeApp(setUserId?: number) {
  const app = express();
  app.use(express.json());
  app.use((req: TestRequest, _res: express.Response, next: express.NextFunction) => {
    if (setUserId !== undefined) req.userId = setUserId;
    next();
  });
  app.use('/api/auth', authRouter);
  app.use(apiErrorHandler);
  return app;
}

let app: express.Express;

beforeEach(() => {
  app = makeApp();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// POST /api/auth/register のテスト
describe('認証登録 API: POST /api/auth/register', () => {
  it('バリデーションエラー時は 400 を返す', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'ab',
      email: 'bad',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('username 重複時は 409 を返す', async () => {
    // User.findOne をモックして「既存ユーザーあり」の挙動を再現
    vi.spyOn(User, 'findOne').mockResolvedValue({ id: 1 } as unknown as UserInstance);

    const res = await request(app).post('/api/auth/register').send({
      username: 'taken',
      email: 'user@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_RESOURCE');
  });

  it('登録成功時は 201 と token を返す', async () => {
    // bcrypt/hash, User.create, jwt.sign をモックして正常系を検証
    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(bcrypt, 'hash').mockImplementation((async () => 'hashed') as typeof bcrypt.hash);
    vi.spyOn(User, 'create').mockResolvedValue({
      toJSON: () => ({ id: 10, username: 'ok', email: 'ok@example.com' }),
    } as unknown as UserInstance);
    vi.spyOn(jwt, 'sign').mockImplementation((() => 'token') as typeof jwt.sign);

    const res = await request(app).post('/api/auth/register').send({
      username: 'ok',
      email: 'ok@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('ok@example.com');
    expect(res.body.data.token).toBe('token');
  });
});

// POST /api/auth/login のテスト
describe('認証ログイン API: POST /api/auth/login', () => {
  it('バリデーションエラー時は 400 を返す', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'bad',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('ユーザー未存在時は 401 を返す', async () => {
    vi.spyOn(User, 'findOne').mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'none@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_FAILED');
  });

  it('パスワード不一致時は 401 を返す', async () => {
    // findOne, bcrypt.compare をモックしてパスワード不一致を再現
    vi.spyOn(User, 'findOne').mockResolvedValue({
      toJSON: () => ({ id: 1, username: 'u', email: 'u@example.com', password: 'hashed' }),
    } as unknown as UserInstance);
    vi.spyOn(bcrypt, 'compare').mockImplementation((async () => false) as typeof bcrypt.compare);

    const res = await request(app).post('/api/auth/login').send({
      email: 'u@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_FAILED');
  });

  it('ログイン成功時は 200 と token を返す', async () => {
    // 正常系：findOne, bcrypt.compare, jwt.sign をモック
    vi.spyOn(User, 'findOne').mockResolvedValue({
      toJSON: () => ({ id: 1, username: 'u', email: 'u@example.com', password: 'hashed' }),
    } as unknown as UserInstance);
    vi.spyOn(bcrypt, 'compare').mockImplementation((async () => true) as typeof bcrypt.compare);
    vi.spyOn(jwt, 'sign').mockImplementation((() => 'token') as typeof jwt.sign);

    const res = await request(app).post('/api/auth/login').send({
      email: 'u@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe('token');
  });
});

// GET /api/auth/me のテスト
describe('プロフィール API: GET /api/auth/me', () => {
  it('未認証時は 401 を返す', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('認証済みでもユーザー未存在なら 401 を返す', async () => {
    const authApp = makeApp(123);
    vi.spyOn(User, 'findByPk').mockResolvedValue(null);

    const res = await request(authApp).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('認証済みユーザーなら 200 で user を返す', async () => {
    const authApp = makeApp(5);
    vi.spyOn(User, 'findByPk').mockResolvedValue({
      toJSON: () => ({ id: 5, username: 'me', email: 'me@example.com' }),
    } as unknown as UserInstance);

    const res = await request(authApp).get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe('me');
  });
});
