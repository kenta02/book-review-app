import app from "./app";
import { sequelize } from "./sequelize";

const port = process.env.PORT || 3001;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");
    app.listen(port, () =>
      console.log(`🚀 API running on http://localhost:${port}`)
    );
  } catch (err) {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  }
})();
