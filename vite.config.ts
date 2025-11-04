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
  define: {
    "import.meta.env.VITE_UNICORE_API_URL": JSON.stringify(
      process.env.VITE_UNICORE_API_URL,
    ),
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    fs: {
      allow: [".."],
    },
    proxy: {
      "/api": {
        target:
          process.env.VITE_UNICORE_API_URL ||
          process.env.VITE_NGROK_URL ||
          "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url,
            );
          });
        },
      },
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
