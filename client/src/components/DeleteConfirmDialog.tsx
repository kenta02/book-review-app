type DeleteConfirmDialogProps = {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const DeleteConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) => {
  // 確認ダイアログを表示する
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">{title || "確認"}</h2>
        <p className="mb-6">{message || "本当に削除しますか？"}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
};
