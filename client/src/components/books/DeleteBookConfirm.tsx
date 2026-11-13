interface DeleteBookConfirmProps {
  /** 確認の対象になっている書籍のタイトル（確認メッセージに表示する） */
  title: string;
  /** 「本当に削除しますか？」を表示中か */
  isConfirming: boolean;
  /** 削除リクエストの実行中か（二重実行を防ぐためボタンを無効にする） */
  deleting: boolean;
  /** 削除に失敗したときの表示メッセージ（なければ null） */
  error: string | null;
  onConfirm: () => void;
  /** 確認・エラー表示を閉じる */
  onCancel: () => void;
}

/**
 * 書籍削除の確認とエラー表示（画面内で確認を挟む。レビュー削除と同じ作り）。
 * 確認中でもエラーでもなければ何も表示しない。
 * @example
 * <DeleteBookConfirm
 *   title={book.title}
 *   isConfirming={isConfirming}
 *   deleting={deleting}
 *   error={error}
 *   onConfirm={confirmDelete}
 *   onCancel={cancel}
 * />
 */
export function DeleteBookConfirm({
  title,
  isConfirming,
  deleting,
  error,
  onConfirm,
  onCancel,
}: Readonly<DeleteBookConfirmProps>) {
  if (!isConfirming && !error) return null;

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p
          role="alert"
          className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
        >
          {error}
        </p>
      )}
      {isConfirming ? (
        <div
          role="group"
          aria-label="書籍削除の確認"
          className="flex flex-wrap items-center gap-2 text-sm"
        >
          <span className="text-gray-700 dark:text-gray-300">
            「{title}」を削除しますか？
          </span>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="rounded bg-red-600! px-3 py-1 text-white hover:bg-red-700! disabled:opacity-60"
          >
            {deleting ? "削除中..." : "削除する"}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            キャンセル
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onCancel}
          className="self-start text-sm text-gray-600 underline dark:text-gray-400"
        >
          閉じる
        </button>
      )}
    </div>
  );
}
