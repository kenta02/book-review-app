import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';

import { authenticateToken } from '../src/middleware/auth';
import User from '../src/models/Users';

// このファイルの目的：authenticateToken ミドルウェアの挙動を検証
// - req.userId が既にある場合は処理をスキップすること
// - Authorization ヘッダー、JWT 検証、ユーザー存在チェックの各ケースを確認

type UserInstance = InstanceType<typeof User>;
type TestRequest = express.Request & { userId?: number };

// テスト用ルート /protected を用意してミドルウェアの動作を直接確認する
function makeApp(setUserId?: number) {
  const app = express();
  app.use(express.json());
  app.use((req: TestRequest, _res: express.Response, next: express.NextFunction) => {
    if (setUserId !== undefined) req.userId = setUserId;
    next();
  });
  app.get('/protected', authenticateToken, (req: TestRequest, res: express.Response) => {
    res.status(200).json({ success: true, userId: req.userId });
  });
  return app;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('authenticateToken middleware', () => {
  it('allows request when req.userId is already set', async () => {
    const app = makeApp(123);
    const verifySpy = vi.spyOn(jwt, 'verify');
    const findSpy = vi.spyOn(User, 'findByPk');

    const res = await request(app).get('/protected');

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(123);
    expect(verifySpy).not.toHaveBeenCalled();
    expect(findSpy).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header is missing', async () => {
    const app = makeApp();

    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns 401 when authorization header is not Bearer', async () => {
    const app = makeApp();

    const res = await request(app).get('/protected').set('Authorization', 'Token abc');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns 401 when jwt verification fails', async () => {
    const app = makeApp();
    vi.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('bad token');
    });

    const res = await request(app).get('/protected').set('Authorization', 'Bearer bad');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns 401 when user is not found', async () => {
    const app = makeApp();
    vi.spyOn(jwt, 'verify').mockReturnValue({ id: 9 } as unknown as jwt.JwtPayload);
    vi.spyOn(User, 'findByPk').mockResolvedValue(null);

    const res = await request(app).get('/protected').set('Authorization', 'Bearer ok');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('sets req.userId and calls next when token is valid', async () => {
    const app = makeApp();
    vi.spyOn(jwt, 'verify').mockReturnValue({ id: 7 } as unknown as jwt.JwtPayload);
    vi.spyOn(User, 'findByPk').mockResolvedValue({
      toJSON: () => ({ id: 7 }),
    } as unknown as UserInstance);

    const res = await request(app).get('/protected').set('Authorization', 'Bearer ok');

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(7);
  });
});
