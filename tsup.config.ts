import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      "core/index": "src/core/index.ts",
      "mcp/index": "src/mcp/index.ts",
      "cli/bin": "src/cli/bin.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: "node18",
    outDir: "dist",
    banner: {
      js: "",
    },
  },
]);
