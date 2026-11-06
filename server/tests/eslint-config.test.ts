import path from 'node:path';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(__dirname, '..');
const eslint = new ESLint({ cwd: projectRoot });
const filePath = path.join(projectRoot, 'src/lint-contract.ts');

describe('ESLint 設定の移行', () => {
  it('型付きの正常なコードを受け入れる', async () => {
    const results = await eslint.lintText('export const value: string = "ok";', { filePath });
    expect(results[0].errorCount).toBe(0);
  });

  it('明示的な any を引き続き拒否する', async () => {
    const results = await eslint.lintText('export const value: any = 1;', { filePath });
    expect(results[0].messages.map((message) => message.ruleId)).toContain(
      '@typescript-eslint/no-explicit-any',
    );
  });

  it('解決できない import を引き続き拒否する', async () => {
    const results = await eslint.lintText(
      'import missing from "./does-not-exist"; export const value = missing;',
      { filePath },
    );
    expect(results[0].messages.map((message) => message.ruleId)).toContain('import-x/no-unresolved');
  });
});
