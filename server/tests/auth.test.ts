import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import authRouter from '../src/routes/auth';
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
describe('POST /api/auth/register', () => {
  it('returns 400 when validation fails', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'ab',
      email: 'bad',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 when username already exists', async () => {
    // User.findOne をモックして「既存ユーザーあり」の挙動を再現
    vi.spyOn(User, 'findOne').mockResolvedValueOnce({ id: 1 } as unknown as UserInstance);

    const res = await request(app).post('/api/auth/register').send({
      username: 'taken',
      email: 'user@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_RESOURCE');
  });

  it('returns 201 and token when registration succeeds', async () => {
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
describe('POST /api/auth/login', () => {
  it('returns 400 when validation fails', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'bad',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when user not found', async () => {
    vi.spyOn(User, 'findOne').mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'none@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_FAILED');
  });

  it('returns 401 when password is invalid', async () => {
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

  it('returns 200 and token when login succeeds', async () => {
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
describe('GET /api/auth/me', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns 404 when user not found', async () => {
    const authApp = makeApp(123);
    vi.spyOn(User, 'findByPk').mockResolvedValue(null);

    const res = await request(authApp).get('/api/auth/me');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('returns 200 with user data when authenticated', async () => {
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
