import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  clean: true,
  format: ["cjs", "esm"],
  shims: true,
  dts: true,
  external: ['solid-js'],
  outExtension({ format }) {
    return {
      js: `.${format === "esm" ? "mjs" : format}`,
    };
  },
});
