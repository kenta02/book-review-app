/**
 * 環境に応じてログを出力するカスタムロガー
 * 開発環境（VITE_DEBUG=true）では出力、本番環境では出力しない
 */

const getIsDev = () => {
  const env =
    typeof import.meta !== "undefined"
      ? (import.meta.env as Record<string, unknown>)
      : {};

  const viteDebug =
    (env?.VITE_DEBUG as string | undefined) ??
    (typeof process !== "undefined" ? process.env.VITE_DEBUG : undefined);
  const mode =
    (env?.MODE as string | undefined) ??
    (typeof process !== "undefined" ? process.env.NODE_ENV : undefined);

  return viteDebug === "true" || mode === "development";
};

const isDev = getIsDev();

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
