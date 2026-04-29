import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      exclude: ["tests/**", "dist/**", "src/index.ts"],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
      },
    },
    timeout: 10_000,
  },
});
