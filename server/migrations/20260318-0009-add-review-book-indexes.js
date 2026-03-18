'use strict';

const SINGLE_INDEX_NAME = 'idx_reviews_book_id';
const COMPOSITE_INDEX_NAME = 'idx_reviews_book_id_rating';

/**
 * Reviews テーブルに存在する index 名一覧を取得します。
 *
 * @param {import('sequelize').QueryInterface} queryInterface - migration の QueryInterface
 * @param {{ transaction?: import('sequelize').Transaction }} [options] - 実行オプション
 * @returns {Promise<string[]>} 既存 index 名の配列
 */
async function listIndexNames(queryInterface, options = {}) {
  const indexes = await queryInterface.showIndex('Reviews', options);
  return indexes.map((index) => index.name);
}

module.exports = {
  /**
   * Reviews の bookId 集計に必要な index を追加します。
   *
   * @param {import('sequelize').QueryInterface} queryInterface - migration の QueryInterface
   * @returns {Promise<void>}
   */
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const options = { transaction };
      const indexNames = await listIndexNames(queryInterface, options);

      if (!indexNames.includes(SINGLE_INDEX_NAME)) {
        await queryInterface.addIndex('Reviews', ['bookId'], {
          name: SINGLE_INDEX_NAME,
          ...options,
        });
      }

      if (!indexNames.includes(COMPOSITE_INDEX_NAME)) {
        await queryInterface.addIndex('Reviews', ['bookId', 'rating'], {
          name: COMPOSITE_INDEX_NAME,
          ...options,
        });
      }
    });
  },

  /**
   * 追加した Reviews の index を削除します。
   *
   * @param {import('sequelize').QueryInterface} queryInterface - migration の QueryInterface
   * @returns {Promise<void>}
   */
  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const options = { transaction };
      const indexNames = await listIndexNames(queryInterface, options);

      if (indexNames.includes(COMPOSITE_INDEX_NAME)) {
        await queryInterface.removeIndex('Reviews', COMPOSITE_INDEX_NAME, options);
      }

      if (indexNames.includes(SINGLE_INDEX_NAME)) {
        await queryInterface.removeIndex('Reviews', SINGLE_INDEX_NAME, options);
      }
    });
  },
};
