// TODO: Headerコンポーネントの実装;
//   - ロゴ「BookReview
//   - ナビゲーション（ダッシュボード等）
//   - ユーザーメニュー／通知アイコン
//   - 検索バー (プレースホルダ：書籍名、著者名…)
//   - ソートドロップダウン (評価順等)
//   - フィルタボタン
//   - 右上に「+ 書籍を追加」アクションボタン

export function Header() {
  return (
    <header className="header">
      <div className="header-left">
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
