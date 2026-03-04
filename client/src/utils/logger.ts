/**
 * 環境に応じてログを出力するカスタムロガー
 * 開発環境（VITE_DEBUG=true）では出力、本番環境では出力しない
 */

const isDev =
  import.meta.env.VITE_DEBUG === "true" ||
  import.meta.env.MODE === "development";

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
};
