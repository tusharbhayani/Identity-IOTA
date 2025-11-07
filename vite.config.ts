import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

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
      "/api/fixed-offer": {
        target: "http://localhost:5173",
        changeOrigin: false,
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            const offerId = req.url?.split("/").pop();

            const fixedOffers = (global as unknown).fixedOffers || {};
            const fixedData = fixedOffers[offerId || ""];

            if (fixedData) {
              res.writeHead(200, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
              });
              res.end(JSON.stringify(fixedData));
              return;
            }

            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Fixed offer not found" }));
          });
        },
      },
      "/api": {
        target: "http://192.168.29.111:3033",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("Proxying request:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("Proxy response:", proxyRes.statusCode, req.url);
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
