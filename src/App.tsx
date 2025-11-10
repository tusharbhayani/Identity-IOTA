import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Container, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./styles/responsive.css";
import { initIdentity } from "./util";
import { ModernCredentialsManager } from "./components/ModernCredentialsManager";
import { VerificationCallback } from "./components/VerificationCallback";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  useEffect(() => {
    const init = async () => {
      try {
        await initIdentity();
      } catch (err) {
        console.error("Failed to initialize IOTA Identity:", err);
      }
    };

    init();
  }, []);





  return (
    <BrowserRouter>
      <Theme
        accentColor="blue"
        grayColor="slate"
        radius="medium"
        scaling="100%"
        appearance="dark"
      >
        <Container size="4" style={{ minHeight: '100vh', padding: '2rem' }}>
          <ErrorBoundary>
            <Routes>
              <Route
                path="/"
                element={<ModernCredentialsManager />}
              />

              <Route path="/verification/callback" element={<VerificationCallback />} />
            </Routes>
          </ErrorBoundary>
        </Container>
      </Theme>
    </BrowserRouter>
  );
}

export default App;