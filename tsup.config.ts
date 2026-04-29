import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  minify: false,
  dts: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  external: ["keytar"],
  esbuildOptions(options) {
    options.conditions = ["node"];
  },
});
