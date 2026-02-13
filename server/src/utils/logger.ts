/* eslint-disable no-console */
// 軽量ロガー
// - console の直接使用をラップしてプロジェクトの lint に合わせるためのヘルパー
// - 将来的に Winston や pino に置き換えやすい形にしています

export const logger = {
  info: (...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'production') console.info(...args);
  },
  debug: (...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development') console.debug(...args);
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
