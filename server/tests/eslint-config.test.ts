import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(__dirname, '..');
const eslint = new ESLint({ cwd: projectRoot });
const filePath = path.join(projectRoot, 'src/lint-contract.ts');
const oxlintBin = path.join(projectRoot, 'node_modules/.bin/oxlint');
const oxlintConfig = path.join(projectRoot, '.oxlintrc.jsonc');

type OxlintDiagnostic = { code: string; severity: string };

// コードを一時ファイルに書き出し、oxlint の指摘（ルール ID と重大度）を返す。
const lintWithOxlint = (code: string): OxlintDiagnostic[] => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oxlint-contract-'));
  try {
    const target = path.join(dir, 'contract.ts');
    fs.writeFileSync(target, code);
    // 違反があると終了コード 1 になるため、終了コードではなく JSON の内容で判定する。
    const result = spawnSync(oxlintBin, ['-c', oxlintConfig, '--format', 'json', target], {
      cwd: projectRoot,
      encoding: 'utf8',
    });
    const parsed = JSON.parse(result.stdout) as { diagnostics: OxlintDiagnostic[] };
    return parsed.diagnostics;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

const eslintRuleIds = async (code: string): Promise<(string | null)[]> => {
  const results = await eslint.lintText(code, { filePath });
  return results[0].messages.map((message) => message.ruleId);
};

// oxlint と ESLint を併用しているため、ルールごとに担当するツールが決まっている。
// oxlint 担当のルールは ESLint 側で無効化されており、ESLint 担当のルールは oxlint では検出されない。
describe('lint 設定（oxlint と ESLint の併用）', () => {
  it('型付きの正常なコードを両ツールが受け入れる', async () => {
    const code = 'export const value: string = "ok";';
    const results = await eslint.lintText(code, { filePath });
    expect(results[0].errorCount).toBe(0);
    expect(lintWithOxlint(code)).toEqual([]);
  });

  it('明示的な any を oxlint が拒否する', () => {
    const diagnostics = lintWithOxlint('export const value: any = 1;');
    expect(diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'typescript(no-explicit-any)'
    );
    expect(diagnostics.every((diagnostic) => diagnostic.severity === 'error')).toBe(true);
  });

  it('var の使用を oxlint が拒否する', () => {
    const diagnostics = lintWithOxlint('var value = 1;\nexport { value };');
    expect(diagnostics.map((diagnostic) => diagnostic.code)).toContain('eslint(no-var)');
  });

  it('oxlint が担当するルールは ESLint 側で重複して報告されない', async () => {
    const ruleIds = await eslintRuleIds('export const value: any = 1;');
    expect(ruleIds).not.toContain('@typescript-eslint/no-explicit-any');
  });

  it('解決できない import を ESLint が拒否する', async () => {
    const ruleIds = await eslintRuleIds(
      'import missing from "./does-not-exist"; export const value = missing;'
    );
    expect(ruleIds).toContain('import-x/no-unresolved');
  });

  it('import の並び順の違反を ESLint が警告する', async () => {
    const ruleIds = await eslintRuleIds(
      'import path from "node:path";\nimport { ESLint } from "eslint";\nexport const value = [path, ESLint];'
    );
    expect(ruleIds).toContain('import-x/order');
  });
});
