import "@radix-ui/themes/styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { initializeEnvironment } from "./init";
import "./styles/responsive.css";

const queryClient = new QueryClient();
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find root element");
}

const root = ReactDOM.createRoot(rootElement);

// Show loading state
root.render(
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'system-ui, sans-serif'
  }}>
    Initializing WASM module...
  </div>
);

// Initialize environment before rendering
(async () => {
  try {
    console.log("Main: Starting app initialization...");
    await initializeEnvironment();
    console.log("Main: WASM initialized, rendering app...");

    // Render the app once initialized
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to initialize app:", error);

    // Render error state with more details
    const errorMessage = error instanceof Error ? error.message : String(error);
    root.render(
      <div style={{
        color: 'red',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '800px',
        margin: '50px auto'
      }}>
        <h2>Failed to initialize application</h2>
        <p>Error: {errorMessage}</p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Please check the browser console for more details.
        </p>
      </div>
    );
  }
})();

// Handle HMR to prevent re-initialization issues
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log("HMR: Module updated");
  });
}
