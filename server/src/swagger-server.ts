import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import yaml from 'yaml';
import swaggerUi from 'swagger-ui-express';

const app = express();
// Swagger UI 側にも基本的なセキュリティヘッダーを適用
const SWAGGER_UI_ALLOWED_ORIGINS = (
  process.env.SWAGGER_UI_ALLOWED_ORIGINS || 'http://localhost:8080'
)
  .split(',')
  .map((v) => v.trim());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || SWAGGER_UI_ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// 注意: ここでは express.json() を追加しない。
// Swagger UI はリクエストを API サーバーへプロキシするため、
// このサーバーで JSON ボディを先に消費するとプロキシ先へ渡せなくなる。
// OpenAPI 仕様の JSON 応答は `res.json` / `res.type()` で返すため、
// JSON パーサーミドルウェアは不要。

// Swagger UI設定
const swaggerFilePath = (() => {
  const candidates = [
    path.join(__dirname, 'openapi.yaml'),
    path.join(__dirname, '..', 'src', 'openapi.yaml'),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      `openapi.yaml not found. Tried: ${candidates.map((p) => JSON.stringify(p)).join(', ')}`
    );
  }
  return found;
})();
const swaggerDoc = yaml.parse(fs.readFileSync(swaggerFilePath, 'utf8'));

// OpenAPI仕様ファイルのエンドポイント（Swagger UIより先に定義）
app.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(swaggerDoc);
});

app.get('/openapi.yaml', (_req: Request, res: Response) => {
  const yamlContent = fs.readFileSync(swaggerFilePath, 'utf8');
  // servers をローカルプロキシに置換
  const modifiedYaml = yamlContent.replace(
    /servers:[\s\S]*?(?=\n[a-z]|$)/,
    `servers:
  - url: /api
    description: Local proxy (port 8080)`
  );
  res.type('text/yaml').send(modifiedYaml);
});

// APIプロキシ: Swagger UIからのリクエストをメインサーバーにフォワード
app.use('/api', (req: Request, res: Response) => {
  // path はユーザー入力に含まれる可能性があるため、URLオブジェクトで正規化
  const parsed = new URL(req.originalUrl ?? '', 'http://localhost');
  const safePath = parsed.pathname + parsed.search;

  // ヘッダーはホワイトリスト方式で受け入れる
  const allowedHeaders = new Set([
    'accept',
    'content-type',
    'authorization',
    'x-requested-with',
    'x-lang',
    'x-api-version',
  ]);
  const safeHeaders: http.OutgoingHttpHeaders = {};

  Object.entries(req.headers).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (!allowedHeaders.has(lowerKey)) {
      return;
    }
    if (Array.isArray(value)) {
      safeHeaders[lowerKey] = value.join(',');
    } else if (value !== undefined) {
      safeHeaders[lowerKey] = String(value);
    }
  });

  // `host` は明示的に外す（外部値を絶対許可しない）
  delete safeHeaders.host;
  delete safeHeaders.connection;
  delete safeHeaders['transfer-encoding'];
  delete safeHeaders['content-length'];

  // `/api` 以外は許可しない（SSRF パス回避防止）
  if (!safePath.startsWith('/api/')) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Forbidden',
        code: 'FORBIDDEN',
      },
    });
  }

  const options: http.RequestOptions = {
    hostname: 'localhost',
    port: Number(process.env.API_SERVER_PORT || 3000),
    path: safePath,
    method: req.method,
    headers: safeHeaders,
    timeout: 10_000,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // CORSヘッダーを明示的に設定
    const headers = { ...proxyRes.headers };
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

    res.writeHead(proxyRes.statusCode ?? 502, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('API proxy error:', err);
    res.status(503).json({
      success: false,
      error: {
        message: 'Could not connect to API server',
        code: 'API_UNAVAILABLE',
      },
    });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy(new Error('API proxy timeout'));
  });

  req.pipe(proxyReq);
});

// Swagger UI（最後に定義して全ルートをキャッチ）
app.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDoc, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Book Review API Docs',
    swaggerOptions: {
      urls: [
        {
          url: '/openapi.yaml',
          name: 'OpenAPI (local)',
        },
      ],
      deepLinking: true,
    },
  })
);

const port = process.env.SWAGGER_PORT || 8080;

app.listen(port, () => {
  console.info(`📚 Swagger UI running on http://localhost:${port}`);
  console.info(`📄 OpenAPI spec: http://localhost:${port}/openapi.yaml`);
  console.info(`💾 OpenAPI JSON: http://localhost:${port}/openapi.json`);
  console.info(`🔀 API proxy: http://localhost:${port}/api/* -> http://localhost:3000/api/*`);
  console.info(`\n⚠️  Note: API server (npm run dev) must be running on port 3000`);
});
