import { describe, it, expect, vi, afterEach } from 'vitest';

import { logger } from '../src/utils/logger';

// logger ユーティリティのテスト
describe('logger utility', () => {
  // NODE_ENV の元の値を保存
  const origEnv = process.env.NODE_ENV;

  afterEach(() => {
    // 各テスト後に NODE_ENV と spy をリセット
    process.env.NODE_ENV = origEnv;
    vi.restoreAllMocks();
  });

  it('info logs when NODE_ENV is not production', () => {
    // development 環境では logger.info がコンソールに出力すること
    process.env.NODE_ENV = 'development';
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('hello');
    // logger.info が呼ばれたことを確認
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('info does not log in production', () => {
    // production 環境では logger.info がコンソールに出力しないこと
    process.env.NODE_ENV = 'production';
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('hello');
    // logger.info が呼ばれないことを確認
    expect(spy).not.toHaveBeenCalled();
  });

  it('debug logs only in development', () => {
    // debug は development 環境でのみ出力すること
    process.env.NODE_ENV = 'development';
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('d');
    // development 環境では debug が呼ばれることを確認
    expect(spy).toHaveBeenCalledWith('d');
    // production 環境に切り替え
    process.env.NODE_ENV = 'production';
    spy.mockClear();
    logger.debug('d');
    // production 環境では debug が呼ばれないことを確認
    expect(spy).not.toHaveBeenCalled();
  });

  it('error always logs', () => {
    // error は常にコンソール出力すること（環境に関わらず）
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('err');
    // logger.error が常に呼ばれることを確認
    expect(spy).toHaveBeenCalledWith('err');
  });
});
