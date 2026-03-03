/* eslint-disable no-console */
// NOSONAR: logger は軽量な開発用ヘルパーです。呼び出し元でユーザー制御データをログに渡さないよう注意すること。
// 軽量ロガー
// - console の直接使用をラップしてプロジェクトの lint に合わせるためのヘルパー
// - 将来的に Winston や pino に置き換えやすい形にしています

// ログインジェクションを防ぐため、文字列引数から改行を取り除くなどの簡単なサニタイズを行う
function sanitize(arg: unknown): unknown {
  if (typeof arg === 'string') {
    // 改行を除去してログに挿入される制御文字を排除
    return arg.replace(/[\r\n]/g, '');
  }
  if (arg instanceof Error) {
    return arg.stack || arg.message;
  }
  return arg;
}

export const logger = {
  info: (...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'production')
      console.info(...args.map(sanitize));
  },
  debug: (...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development')
      console.debug(...args.map(sanitize));
  },
  error: (...args: unknown[]): void => {
    console.error(...args.map(sanitize));
  },
};
