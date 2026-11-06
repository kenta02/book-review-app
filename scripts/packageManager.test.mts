import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pnpmPath = process.env.npm_execpath;

// 実際の workspace とロックファイルを使い、ネットワークなしで契約を検証する。
function createWorkspace(): string {
  const fixture = mkdtempSync(join(tmpdir(), "book-review-pnpm-test-"));
  for (const directory of ["client", "server"]) {
    mkdirSync(join(fixture, directory));
  }
  for (const file of [
    "package.json",
    "client/package.json",
    "server/package.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
  ]) {
    copyFileSync(join(root, file), join(fixture, file));
  }
  return fixture;
}

function frozenInstall(cwd: string) {
  assert.ok(pnpmPath, "pnpm run test から実行してください");
  const env = { ...process.env };
  // 子プロセスの出力を Node.js テストプロトコルとして扱わせない。
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(
    process.execPath,
    [
      pnpmPath,
      "--reporter=ndjson",
      "install",
      "--lockfile-only",
      "--frozen-lockfile",
      "--offline",
      "--ignore-scripts",
      "--trust-lockfile",
      "--store-dir",
      join(cwd, ".store"),
      "--config.cache-dir=" + join(cwd, ".cache"),
    ],
    { cwd, env, encoding: "utf8", timeout: 30000 },
  );
}

test("全 workspace の manifest が共有ロックファイルと整合する", () => {
  const fixture = createWorkspace();
  try {
    const before = readFileSync(join(fixture, "pnpm-lock.yaml"), "utf8");
    const result = frozenInstall(fixture);
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(readFileSync(join(fixture, "pnpm-lock.yaml"), "utf8"), before);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

for (const directory of [".", "client", "server"]) {
  test(`${directory} の依存定義が変わると frozen install が失敗する`, () => {
    const fixture = createWorkspace();
    try {
      const manifestPath = join(fixture, directory, "package.json");
      const manifest: { dependencies?: Record<string, string> } = JSON.parse(
        readFileSync(manifestPath, "utf8"),
      );
      manifest.dependencies = {
        ...manifest.dependencies,
        "pnpm-lockfile-mismatch-fixture": "1.0.0",
      };
      writeFileSync(manifestPath, JSON.stringify(manifest));
      const result = frozenInstall(fixture);
      assert.ifError(result.error);
      assert.notEqual(result.status, 0);
      assert.match(result.stdout + result.stderr, /ERR_PNPM_OUTDATED_LOCKFILE/);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
}
