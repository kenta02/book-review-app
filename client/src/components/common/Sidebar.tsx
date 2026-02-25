// サイドバーにはダッシュボード、プロフィール、設定、ログアウトの４つのリンクを表示する

// components/common/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "ダッシュボード", icon: "📊" },
    { path: "/profile", label: "プロフィール", icon: "👤" },
    { path: "/settings", label: "設定", icon: "⚙️" },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout">🚪 ログアウト</button>
        </div>
      </aside>
    </>
  );
}
