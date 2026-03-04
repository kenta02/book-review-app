import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    cache: {
      dir: "node_modules/.vitest",
    },
    include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"], // generate lcov for SonarCloud
      reportsDirectory: "./coverage",
      exclude: ["**/*.d.ts", "node_modules/**"],
    },
  },
});
