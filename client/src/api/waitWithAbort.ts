/**
 * 指定時間だけ待機しつつ、AbortSignal による中断を即時反映する。
 * モック API の疑似遅延で使い、キャンセル後の不要な後続処理を防ぐ。
 * @param milliseconds - 待機するミリ秒
 * @param abortSignal - 中断監視に使う AbortSignal
 * @returns 待機完了時に解決される Promise
 */
export async function waitWithAbort(
  milliseconds: number,
  abortSignal?: AbortSignal,
): Promise<void> {
  if (abortSignal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  await new Promise<void>((resolve, reject) => {
    // 待機完了時には abort リスナーを必ず解除する。
    const timeoutId = window.setTimeout(() => {
      abortSignal?.removeEventListener("abort", handleAbort);
      resolve();
    }, milliseconds);

    // 中断時はタイマーを破棄して即座に AbortError を返す。
    const handleAbort = () => {
      window.clearTimeout(timeoutId);
      abortSignal?.removeEventListener("abort", handleAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };

    abortSignal?.addEventListener("abort", handleAbort, { once: true });
  });
}
