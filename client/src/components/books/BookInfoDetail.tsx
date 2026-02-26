export function BookInfoDetail() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 本のカバー画像 */}
        <div className="flex justify-center md:justify-start">
          <div className="w-48 h-64 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg flex items-center justify-center">
            <span className="text-white text-center text-sm px-4">
              人を動かす
            </span>
          </div>
        </div>

        {/* 本の情報 */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                人を動かす
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                デール・カーネギー
              </p>
            </div>
            <button className="text-red-500 hover:text-red-600">
              <span className="text-2xl">♡</span>
            </button>
          </div>

          {/* 評価 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                <span className="text-yellow-400">★</span>
                <span className="text-yellow-400">★</span>
                <span className="text-yellow-400">★</span>
                <span className="text-yellow-400">★</span>
                <span className="text-yellow-400">★</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                5.0
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                (2件のレビュー)
              </span>
            </div>
          </div>

          {/* メタ情報 */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                出版年
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                1936年
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                ISBN
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                9784422210517
              </p>
            </div>
          </div>

          {/* 概要 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              概要
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              人間関係の古典的名著。人に好かれ、人を説得し、人を変える原則をわかりやすく説いています。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
