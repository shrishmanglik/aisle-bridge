import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: {
    alias: { "@": import.meta.dirname },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: { lines: 85, functions: 85, statements: 85, branches: 80 },
    },
  },
});
