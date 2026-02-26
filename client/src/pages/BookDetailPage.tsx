import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/common/Header";
import { Sidebar } from "../components/common/Sidebar";
import { BookInfoDetail } from "../components/books/BookInfoDetail";
import { ReviewSectionDetail } from "../components/books/ReviewSectionDetail";

export function BookDetailPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-100 dark:bg-gray-950">
      <Header onMenuClick={toggleSidebar} />
      <div className="flex flex-1 w-full justify-center overflow-hidden">
        <div className="flex flex-1 max-w-7xl w-full overflow-hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
          <main className="flex flex-col flex-1 p-6 bg-gray-100 dark:bg-gray-950 overflow-y-auto">
            {/* 戻るボタン */}
            <button
              onClick={handleBack}
              className="mb-6 flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            >
              <span className="mr-2">←</span>
              <span>戻る</span>
            </button>

            {/* 本の詳細セクション */}
            <BookInfoDetail />

            {/* レビューセクション */}
            <ReviewSectionDetail />
          </main>
        </div>
      </div>
    </div>
  );
}
