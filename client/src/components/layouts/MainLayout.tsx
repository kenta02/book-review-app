import { useState } from "react";
import { Header } from "../common/Header";
import { Sidebar } from "../common/Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-100 dark:bg-gray-950">
      <Header onMenuClick={toggleSidebar} />
      <div className="flex flex-1 w-full justify-center overflow-hidden">
        <div className="flex flex-1 max-w-7xl w-full overflow-hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
          <main className="flex flex-col flex-1 p-6 bg-gray-100 dark:bg-gray-950 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
