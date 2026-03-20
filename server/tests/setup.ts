import { sequelize } from '../src/sequelize';

const guardMessage =
  '[TEST_GUARD] Real DB access is blocked in unit/integration tests. Mock the repository or sequelize method in each test.';

// Direct assignment keeps this guard active even if a test uses vi.restoreAllMocks().
sequelize.authenticate = (async () => {
  throw new Error(guardMessage);
}) as typeof sequelize.authenticate;

sequelize.sync = (async () => {
  throw new Error(guardMessage);
}) as typeof sequelize.sync;

sequelize.transaction = (async () => {
  throw new Error(guardMessage);
}) as typeof sequelize.transaction;

sequelize.query = (async () => {
  throw new Error(guardMessage);
}) as typeof sequelize.query;
