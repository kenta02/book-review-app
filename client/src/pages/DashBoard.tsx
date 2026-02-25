import { useState } from "react";
import { Header } from "../components/common/Header";
import { Sidebar } from "../components/common/Sidebar";
import "../styles/dashboard.css";

export function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="dashboard-layout">
      <Header onMenuClick={toggleSidebar} />
      <div className="dashboard-container">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <h1>書籍ダッシュボード</h1>
            <p>6冊の書籍が保存されました</p>
          </div>

          <div className="dashboard-controls">
            <input
              type="text"
              placeholder="書籍名、著者名、ISBNで検索..."
              className="search-input"
            />
            <select className="filter-select">
              <option>評価順</option>
              <option>最新順</option>
              <option>人気順</option>
            </select>
            <button className="btn-primary">+ 書籍を追加</button>
          </div>

          <div className="books-grid">
            {/* BookCard はここに表示（後で実装） */}
            <div className="placeholder">BookCard ここに表示</div>
          </div>
        </main>
      </div>
    </div>
  );
}
