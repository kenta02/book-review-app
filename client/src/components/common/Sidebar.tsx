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
      {/* overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 w-64 flex flex-col justify-between py-5 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:inset-auto z-30`}
      >
        <nav className="flex flex-col gap-0">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-5 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors
                ${
                  location.pathname === item.path
                    ? "bg-purple-100 dark:bg-purple-700 text-purple-900 dark:text-white font-semibold border-l-4 border-purple-600 dark:border-purple-500"
                    : ""
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-5 mt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full py-2 px-4 bg-red-200 text-red-900 rounded hover:bg-red-300 dark:bg-red-700 dark:text-red-200 dark:hover:bg-red-600">
            🚪 ログアウト
          </button>
        </div>
      </aside>
    </>
  );
}
