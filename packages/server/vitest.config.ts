import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "server",
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
  },
});
