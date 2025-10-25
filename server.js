/* eslint-disable no-console */
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 5173;

// Serve static files directly from the root
app.use(express.static(__dirname));

// Set correct MIME types with logging
app.use((req, res, next) => {
  if (req.url?.endsWith(".wasm")) {
    console.log(`🧩 Serving WASM file: ${req.url}`);
    res.setHeader("Content-Type", "application/wasm");
  }

  // Add security headers for SharedArrayBuffer support
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  // Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  next();
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// Special handling for node_modules WASM files
app.use("/node_modules", express.static(join(__dirname, "node_modules")));

// Handle all requests by serving the index.html for SPA routing
app.get("*", (req, res, next) => {
  if (!req.url.includes(".")) {
    console.log(`🔄 Serving index.html for path: ${req.url}`);
    res.sendFile(join(__dirname, "index.html"));
  } else {
    next();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);
  res.status(500).send(`Server Error: ${err.message}`);
  next();
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log(`🌐 Open your browser to http://localhost:${port}`);
});
