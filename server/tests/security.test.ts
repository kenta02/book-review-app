import request from 'supertest';
import { describe, it, expect } from 'vitest';

// このテストはセキュリティ関連ミドルウェアの基本動作を確認します。
// - Helmet のヘッダー、CORS の許可/不許可、ボディサイズ制限などを検証

// Import app AFTER any env setup if needed (app reads CORS_ORIGINS at module load time)
import app from '../src/app';

describe('Security middleware', () => {
  it('sets common Helmet headers on responses', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    // Helmet が設定する主要ヘッダーをチェック
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('allows CORS for allowed origin (localhost default)', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:3000');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('does not set CORS header for disallowed origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://evil.example.com');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects overly large JSON payloads (body size limit)', async () => {
    const long = 'a'.repeat(20000);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u@example.com', password: long });
    // body-parser による制限で 413 または 400 が返ることを想定
    expect([413, 400]).toContain(res.status);
  });
});
