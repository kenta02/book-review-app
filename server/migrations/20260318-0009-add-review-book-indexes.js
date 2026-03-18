'use strict';

const SINGLE_INDEX_NAME = 'idx_reviews_book_id';
const COMPOSITE_INDEX_NAME = 'idx_reviews_book_id_rating';

async function listIndexNames(queryInterface, options = {}) {
  const indexes = await queryInterface.showIndex('Reviews', options);
  return indexes.map((index) => index.name);
}

module.exports = {
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
