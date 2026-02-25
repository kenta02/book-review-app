import { useState, useEffect } from "react";

// TODO: Headerコンポーネントの実装;
//   - ロゴ「BookReview
//   - ナビゲーション（ダッシュボード等）
//   - ユーザーメニュー／通知アイコン
//   - 検索バー (プレースホルダ：書籍名、著者名…)
//   - ソートドロップダウン (評価順等)
//   - フィルタボタン
//   - 右上に「+ 書籍を追加」アクションボタン

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // localStorage から初期状態を取得
    const saved = localStorage.getItem("dark");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // html 要素に tailwind の dark クラスを追加/削除
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // localStorage に保存
    localStorage.setItem("dark", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16 w-full flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          className="block md:hidden text-2xl p-2 text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
          onClick={onMenuClick}
          aria-label="メニュー"
          title="メニューを開く"
        >
          ☰
        </button>
        <div className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <span>📚</span>
          <span>BookReview</span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          書籍システム
        </span>
      </div>

      <div className="flex items-center gap-5">
        <button
          className="text-lg p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="検索"
        >
          🔍
        </button>

        <button
          className="text-lg p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="ダークモード切り替え"
          onClick={toggleDarkMode}
          title={
            isDarkMode ? "ライトモードに切り替え" : "ダークモードに切り替え"
          }
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>

        <button
          className="text-lg p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="通知"
        >
          🔔
        </button>
        <div className="flex items-center gap-3">
          <span className="text-gray-900 dark:text-gray-100 font-medium text-sm">
            山田太郎
          </span>
          <button className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-lg hover:bg-gray-400 dark:hover:bg-gray-500">
            👤
          </button>
        </div>
      </div>
    </header>
  );
}
