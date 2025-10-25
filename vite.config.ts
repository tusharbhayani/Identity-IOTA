import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait({
      promiseExportName: "__tla",
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    fs: {
      allow: [".."],
    },
  },
  optimizeDeps: {
    exclude: [
      "@iota/sdk-wasm",
      "@iota/identity-wasm",
      "@iota/identity-wasm/web",
    ],
    esbuildOptions: {
      target: "esnext",
    },
  },
  assetsInclude: ["**/*.wasm"],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  build: {
    target: "esnext",
    modulePreload: {
      polyfill: false,
    },
  },
});
