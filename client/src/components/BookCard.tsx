import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteBook } from "../hooks/useDeleteBook";
import { DeleteBookConfirm } from "./books/DeleteBookConfirm";
import { RatingSummary } from "./common/RatingSummary";

interface BookCardProps {
  readonly title: string;
  readonly author: string;
  readonly averageRating?: number | null | undefined;
  readonly reviewCount?: number | undefined;
  readonly summary: string;
  readonly ISBN: string;
  readonly publicationYear: number;
  readonly bookId: number;
  readonly liked?: boolean;
  /** 「⋮」メニューに「削除」を表示するか（管理者のときだけ true にする） */
  readonly canDelete?: boolean;
  /** 削除に成功した後に呼ばれる（一覧の再取得用） */
  readonly onDeleted?: () => Promise<void> | void;
}

/**
 * 書籍のカードコンポーネント
 * 「⋮」メニューの「削除」は canDelete が true のときだけ表示し、確認を挟んでから削除する。
 * @param props - 書籍の情報を含むプロパティ
 * @returns - 書籍のカードを表示するReactコンポーネント
 * @example
 * <BookCard {...book} bookId={book.id} canDelete={isAdmin} onDeleted={refresh} />
 */
export function BookCard(props: Readonly<BookCardProps>) {
  const {
    title,
    author,
    averageRating,
    reviewCount,
    summary,
    ISBN,
    publicationYear,
    bookId,
    liked,
    canDelete = false,
    onDeleted,
  } = props;
  const isLiked = liked ?? false;

  const navigate = useNavigate();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const {
    isConfirming,
    deleting,
    error,
    requestDelete,
    cancel,
    confirmDelete,
  } = useDeleteBook(bookId, () => onDeleted?.());

  /** 「削除」が押されたとき: メニューを閉じて、カード上に確認を表示する */
  const handleDeleteClick = () => {
    menuRef.current?.removeAttribute("open");
    requestDelete();
  };

  const handleCardClick = () => {
    navigate(`/books/${bookId}`);
  };

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="book-card"
        onClick={handleCardClick}
        className="flex cursor-pointer flex-col rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg dark:bg-gray-800"
      >
        {/* グラデーション背景のヘッダー部分 */}
        <div className="relative bg-gradient-to-br from-violet-600 to-purple-600 h-40 flex items-center justify-center flex-shrink-0 rounded-t-lg">
          <h3 className="text-white text-center text-lg font-bold px-4 line-clamp-3">
            {title}
          </h3>
        </div>

        {/* カード本体 */}
        <div className="p-4 flex flex-col flex-1">
          {/* タイトル */}
          <h4 className="text-gray-900 dark:text-white font-bold text-base mb-1 line-clamp-2">
            {title}
          </h4>

          {/* 著者名 */}
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
            {author}
          </p>

          {/* 評価 */}
          <div className="mb-3">
            <RatingSummary
              averageRating={averageRating}
              reviewCount={reviewCount}
              keyPrefix={bookId}
            />
          </div>

          {/* 説明文 */}
          <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4">
            {summary}
          </p>

          {/* 出版年 */}
          <div className="mt-auto flex flex-col gap-1 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <span>{publicationYear}年</span>
            <span>ISBN: {ISBN}</span>
          </div>
        </div>
      </button>

      <button
        type="button"
        className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-xl shadow-sm transition hover:scale-105 dark:bg-gray-700"
        aria-label="いいね"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {isLiked ? "❤️" : "🤍"}
      </button>

      <details ref={menuRef} className="absolute right-3 top-3 z-10">
        <summary className="flex h-10 w-10 list-none items-center justify-center rounded-2xl bg-white text-xl text-gray-600 shadow-md transition hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-100 [&::-webkit-details-marker]:hidden">
          ⋮
        </summary>
        <div className="absolute right-0 mt-2 w-32 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
          >
            編集
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="block w-full px-4 py-2 text-left text-sm text-red-500 transition hover:bg-red-50 hover:text-red-600"
            >
              削除
            </button>
          )}
        </div>
      </details>

      {/* 削除の確認・エラー（カードの上に重ねて表示する） */}
      {canDelete && (isConfirming || error) && (
        <div className="absolute inset-x-3 top-16 z-20 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <DeleteBookConfirm
            title={title}
            isConfirming={isConfirming}
            deleting={deleting}
            error={error}
            onConfirm={confirmDelete}
            onCancel={cancel}
          />
        </div>
      )}
    </div>
  );
}
