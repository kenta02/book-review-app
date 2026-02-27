import { useState } from "react";
import { MainLayout } from "../components/layouts/MainLayout";
import { BookCard } from "../components/BookCard";

export function DashboardPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            書籍ダッシュボード
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            ここでは書籍の管理や検索ができます。
          </p>
        </div>
        <button className="py-2 px-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded font-semibold text-sm hover:from-purple-600 hover:to-pink-600 active:scale-95 transition whitespace-nowrap">
          + 書籍を追加
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center flex-wrap">
          <input
            type="text"
            placeholder="書籍名、著者名、ISBNで検索..."
            className="flex-1 min-w-[250px] py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-slate-700 rounded focus:border-purple-600 focus:ring-2 focus:ring-purple-400"
          />
          <select className="py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded cursor-pointer focus:border-purple-600 focus:ring-2 focus:ring-purple-400">
            <option>評価順</option>
            <option>最新順</option>
            <option>人気順</option>
          </select>
          <button
            onClick={toggleFilter}
            className="py-2 px-5 border-2 border-purple-500 text-purple-600 dark:text-purple-400 rounded font-semibold text-sm hover:bg-purple-500 hover:text-white active:scale-95 transition whitespace-nowrap"
          >
            ⚙️ フィルター
          </button>
        </div>

        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-300 dark:border-slate-700">
            <label className="text-gray-700 dark:text-gray-400 mr-2">
              出版年
            </label>
            <select className="py-2 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded cursor-pointer focus:border-purple-600 focus:ring-2 focus:ring-purple-400">
              <option>全ての年</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 overflow-y-auto">
        <BookCard
          title="人を動かす"
          author="デール・カーネギー"
          ratingDisplay="5.0 (15件のレビュー)"
          summary="人間関係の古典的名著。人に好かれ、人を説得し、人を変える原則をわかりやすく説いています。"
          ISBN="9784422210517"
          publicationYear={1936}
        />
        <BookCard
          title="リーダブルコード"
          author="Dustin Boswell, Trevor Foucher"
          ratingDisplay="4.8 (12件のレビュー)"
          summary="より良いコードを書くための実践的テクニック。読みやすく、保守しやすいコードの書き方を学べます。"
          ISBN="9784873115658"
          publicationYear={2012}
        />
        <BookCard
          title="三体"
          author="劉慈欣"
          ratingDisplay="4.7 (18件のレビュー)"
          summary="宇宙SFの傑作。壮大なスケールで描かれた、人類と異星人の運命が交差する壮大な物語です。"
          ISBN="9784161206535"
          publicationYear={2008}
        />
        <BookCard
          title="クリーンアーキテクチャ"
          author="Robert C. Martin"
          ratingDisplay="4.5 (9件のレビュー)"
          summary="ソフトウェア設計の第一人者による、アーキテクチャの原則。テスト駆動設計とアーキテクチャの関係。"
          ISBN="9784647196936"
          publicationYear={2018}
        />
        <BookCard
          title="リーン・スタートアップ"
          author="エリック・リース"
          ratingDisplay="4.4 (11件のレビュー)"
          summary="新規事業の立ち上げ方法を革新的に解説。MVP、反復学習、ピボットなどの重要な戦略を紹介。"
          ISBN="9784862760974"
          publicationYear={2011}
        />
        <BookCard
          title="ノルウェイの森"
          author="村上春樹"
          ratingDisplay="4.3 (20件のレビュー)"
          summary="1969年の秋から翌年初頭にかけての青年時代を描いた恋愛小説。村上春樹の代表作の一つです。"
          ISBN="9784844764803"
          publicationYear={1987}
        />
      </div>
    </MainLayout>
  );
}
