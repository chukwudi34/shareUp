import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    env: { DATABASE_URL: "file:./test.db" },
    fileParallelism: false,
    testTimeout: 30000,
  },
});
