import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Container, Flex, Heading, Text, Theme, Box } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./styles/responsive.css";
import { initIdentity } from "./util";
import { ModernCredentialsManager } from "./components/ModernCredentialsManager";
import { VerificationCallback } from "./components/VerificationCallback";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  const [status, setStatus] = useState('Starting...');
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    const init = async () => {
      try {
        setStatus('Initializing IOTA Identity Client...');
        await initIdentity();
        setStatus('✅ IOTA Identity Client initialized and ready!');
      } catch (err) {
        console.error("Failed to initialize IOTA Identity:", err);
        setError(err instanceof Error ? err.message : String(err));
        setStatus('❌ Failed to initialize');
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
              {/* Main Dashboard */}
              <Route
                path="/"
                element={
                  <Flex direction="column" gap="6">
                    <Box>
                      <Heading size="8" mb="2">🔐 Digital Identity Wallet</Heading>
                      <Text size="4" color="gray">
                        Manage your verifiable credentials with SSI Agent integration
                      </Text>
                      {error && (
                        <Box mt="3" p="3" style={{ background: 'var(--red-3)', borderRadius: '8px' }}>
                          <Text color="red" weight="bold">❌ Error: {error}</Text>
                        </Box>
                      )}
                      {status && (
                        <Box mt="2" p="2" style={{ background: 'var(--blue-3)', borderRadius: '6px' }}>
                          <Text size="2" color="blue">{status}</Text>
                        </Box>
                      )}
                    </Box>

                    <ModernCredentialsManager />
                  </Flex>
                }
              />

              {/* Verification Callback */}
              <Route path="/verification/callback" element={<VerificationCallback />} />
            </Routes>
          </ErrorBoundary>
        </Container>
      </Theme>
    </BrowserRouter>
  );
}

export default App;