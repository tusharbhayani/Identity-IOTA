import type { Plugin } from "vite";

export default function wasmLoader(): Plugin {
  return {
    name: "wasm-loader",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.endsWith(".wasm")) {
          res.setHeader("Content-Type", "application/wasm");
        }
        next();
      });
    },
    transform(code, id) {
      if (id.endsWith(".wasm")) {
        // Return the WASM file as a URL during development
        return {
          code: `export default "${id}";`,
          map: null,
        };
      }
    },
  };
}
