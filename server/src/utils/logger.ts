/* eslint-disable no-console */
// NOSONAR: logger は軽量な開発用ヘルパーです。呼び出し元でユーザー制御データをログに渡さないよう注意すること。
// 軽量ロガー
// - console の直接使用をラップしてプロジェクトの lint に合わせるためのヘルパー
// - 将来的に Winston や pino に置き換えやすい形にしています

// ログインジェクションを防ぐため、ログに出力する前に文字列化し、改行や端末制御文字を取り除く
function sanitize(arg: unknown): string {
  let str: string;

  if (typeof arg === 'string') {
    str = arg;
  } else if (arg instanceof Error) {
    str = arg.stack || arg.message;
  } else if (typeof arg === 'object' && arg !== null) {
    try {
      str = JSON.stringify(arg);
    } catch {
      str = String(arg);
    }
  } else {
    str = String(arg);
  }

  // 改行・復帰を除去し、端末制御文字（ANSIエスケープシーケンス）でもログに埋め込まれないようにする
  const ESC = String.fromCharCode(27);
  return str.replace(/\r|\n/g, '').split(ESC).join('');
}

function logWithSanitization(method: 'info' | 'debug' | 'error', ...args: unknown[]): void {
  const message = args.map(sanitize).join(' ');
  console[method](message);
}

export const logger = {
  info: (...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'production') logWithSanitization('info', ...args);
  },
  debug: (...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development') logWithSanitization('debug', ...args);
  },
  error: (...args: unknown[]): void => {
    logWithSanitization('error', ...args);
  },
};
