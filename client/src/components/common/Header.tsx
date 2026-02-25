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
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // body に dark-mode クラスを追加/削除
    if (isDarkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
    // localStorage に保存
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="hamburger-btn"
          onClick={onMenuClick}
          aria-label="メニュー"
          title="メニューを開く"
        >
          ☰
        </button>
        <div className="logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">BookReview</span>
        </div>
        <span className="subtitle">書籍システム</span>
      </div>

      <div className="header-right">
        <button className="icon-btn" aria-label="検索">
          🔍
        </button>

        <button
          className="icon-btn"
          aria-label="ダークモード切り替え"
          onClick={toggleDarkMode}
          title={
            isDarkMode ? "ライトモードに切り替え" : "ダークモードに切り替え"
          }
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>

        <button className="icon-btn" aria-label="通知">
          🔔
        </button>
        <div className="user-menu">
          <span className="user-name">山田太郎</span>
          <button className="user-avatar">👤</button>
        </div>
      </div>
    </header>
  );
}
