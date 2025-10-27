import { useEffect, useState } from "react";
import { Badge, Box, Button, Container, Flex, Heading, Tabs, Text, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./styles/responsive.css";
import { initIdentity } from "./util";
import { SimpleIdentityFlow } from "./SimpleIdentityFlow";
import { IssueCredentialForm } from "./components/IssueCredentialForm";
import { CreatePresentationForm, StoredCredential } from "./components/CreatePresentationForm";
import { VerificationForm, VerificationResult } from "./components/VerificationForm";
import { CredentialCard } from "./components/CredentialCardNew";
import { CredentialDetails } from "./components/CredentialDetails";
import * as credentialService from "./services/credentialService";
import * as presentationService from "./services/presentationService";
import type { IotaDocument } from "@iota/identity-wasm/web";
import { Jwt } from "@iota/identity-wasm/web";

interface StoredPresentation {
  jwt: string;
  holder: string;
  credentialCount: number;
  createdAt: string;
}

function App() {
  const [status, setStatus] = useState('Starting...');
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("simple");

  const [didDocument, setDidDocument] = useState<IotaDocument | null>(null);
  const [identityStorage, setIdentityStorage] = useState<import("@iota/identity-wasm/web").Storage | null>(null);
  const [verificationFragment, setVerificationFragment] = useState<string>("");

  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [showIssueForm, setShowIssueForm] = useState(false);

  const [presentations, setPresentations] = useState<StoredPresentation[]>([]);
  const [showPresentationForm, setShowPresentationForm] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState<{
    jwt: string;
    credentials: Array<Record<string, unknown>>;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setStatus('Initializing IOTA Identity Client...');
        await initIdentity();
        setIsInitialized(true);
        setStatus('✅ IOTA Identity Client initialized and ready!');
        console.log('✅ Client connected to network');

        setCredentials(credentialService.loadCredentials());
        setPresentations(presentationService.loadPresentations());
      } catch (err) {
        console.error("Failed to initialize IOTA Identity:", err);
        setError(err instanceof Error ? err.message : String(err));
        setStatus('❌ Failed to initialize');
      }
    };

    init();
  }, []);

  const handleCreateIdentity = async () => {
    if (!isInitialized) {
      setError('Client not initialized');
      return;
    }

    setIsLoading(true);
    try {
      setStatus('Creating new identity...');
      const { createIdentityWithClient } = await import('./util');
      const { document, storage, fragment } = await createIdentityWithClient();

      setDidDocument(document);
      setIdentityStorage(storage);
      setVerificationFragment(fragment);

      setStatus('✅ Identity created successfully!');
      setError(null);
      console.log('ℹ️  Identity created:', document.id().toString());
    } catch (err) {
      console.error("Failed to create identity:", err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus('❌ Failed to create identity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCredential = async (data: {
    type: string;
    id: string;
    customFields: Record<string, string>;
  }) => {
    if (!didDocument || !identityStorage || !verificationFragment) {
      throw new Error("No identity available. Create an identity first.");
    }

    try {
      const credentialData = {
        id: data.id,
        type: data.type,
        issuer: didDocument.id().toString(),
        credentialSubject: {
          id: didDocument.id().toString(),
          ...data.customFields,
        },
      };

      const jwt = await credentialService.issueCredential(
        didDocument,
        identityStorage,
        verificationFragment,
        credentialData
      );

      const credential = await credentialService.verifyCredential(jwt, didDocument);

      credentialService.storeCredential(jwt, credential);
      setCredentials(credentialService.loadCredentials());
      setShowIssueForm(false);
      setStatus(`✅ Credential "${data.type}" issued successfully!`);
    } catch (err) {
      throw new Error(
        `Failed to issue credential: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const handleVerifyCredential = async (jwtString: string): Promise<VerificationResult> => {
    if (!didDocument) {
      return {
        isValid: false,
        type: "credential",
        details: {},
        errors: ["No DID document available"],
      };
    }

    try {
      const jwt = new Jwt(jwtString);
      const credential = await credentialService.verifyCredential(jwt, didDocument);
      const credentialSubject = credential.credentialSubject();

      const claims: Record<string, string | number | boolean | undefined> = {};
      if (typeof credentialSubject === "object" && credentialSubject !== null) {
        for (const [key, value] of Object.entries(credentialSubject)) {
          if (key !== "id" && (typeof value === "string" || typeof value === "number" || typeof value === "boolean")) {
            claims[key] = value;
          }
        }
      }

      return {
        isValid: true,
        type: "credential",
        details: {
          issuer: credential.issuer().toString(),
          subject: typeof credentialSubject === "object" && credentialSubject !== null
            ? (credentialSubject as { id?: string }).id
            : undefined,
          credentialTypes: credential.type(),
          claims,
        },
      };
    } catch (err) {
      return {
        isValid: false,
        type: "credential",
        details: {},
        errors: [err instanceof Error ? err.message : String(err)],
      };
    }
  };

  const handleCreatePresentation = async (data: {
    credentialJwts: string[];
    challenge?: string;
    expiresInMinutes?: number;
  }) => {
    if (!didDocument || !identityStorage || !verificationFragment) {
      throw new Error("No identity available. Create an identity first.");
    }

    try {
      const credentialJwts = data.credentialJwts.map((jwtString) => new Jwt(jwtString));

      const presentationData = {
        holder: didDocument.id().toString(),
        verifiableCredentials: credentialJwts,
        challenge: data.challenge,
        expirationMinutes: data.expiresInMinutes,
      };

      const presentationJwt = await presentationService.createPresentation(
        didDocument,
        identityStorage,
        verificationFragment,
        presentationData
      );

      const presentationResult = await presentationService.verifyPresentation(
        presentationJwt,
        didDocument,
        [didDocument],
        data.challenge
      );

      presentationService.storePresentation(presentationJwt, presentationResult.presentation);
      setPresentations(presentationService.loadPresentations());

      const decodedCredentials = data.credentialJwts.map((credJwt) => {
        const parts = credJwt.split(".");
        if (parts.length >= 2) {
          try {
            const payload = JSON.parse(
              atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
            );
            return payload;
          } catch {
            return null;
          }
        }
        return null;
      }).filter(Boolean) as Array<Record<string, unknown>>;

      setSelectedPresentation({
        jwt: presentationJwt.toString(),
        credentials: decodedCredentials,
      });

      setShowPresentationForm(false);
      setStatus(`✅ Presentation created with ${data.credentialJwts.length} credential(s)!`);
    } catch (err) {
      throw new Error(
        `Failed to create presentation: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const handleViewPresentationDetails = (presentation: StoredPresentation) => {
    const parts = presentation.jwt.split(".");
    if (parts.length >= 2) {
      try {
        const payload = JSON.parse(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
        );

        const credentials: Array<Record<string, unknown>> = [];
        if (payload.vp && payload.vp.verifiableCredential) {
          const vcs = Array.isArray(payload.vp.verifiableCredential)
            ? payload.vp.verifiableCredential
            : [payload.vp.verifiableCredential];

          vcs.forEach((vc: string) => {
            const credParts = vc.split(".");
            if (credParts.length >= 2) {
              try {
                const credPayload = JSON.parse(
                  atob(credParts[1].replace(/-/g, "+").replace(/_/g, "/"))
                );
                credentials.push(credPayload);
              } catch {
                console.log("Catch");

              }
            }
          });
        }

        setSelectedPresentation({
          jwt: presentation.jwt,
          credentials,
        });
      } catch {
        setError("Failed to decode presentation");
      }
    }
  };

  const handleVerify = async (
    jwtString: string,
    challenge?: string
  ): Promise<VerificationResult> => {
    if (!didDocument) {
      return {
        isValid: false,
        type: "credential",
        details: {},
        errors: ["No DID document available"],
      };
    }

    try {
      const jwt = new Jwt(jwtString);

      try {
        const result = await presentationService.verifyPresentation(
          jwt,
          didDocument,
          [didDocument],
          challenge
        );

        const parts = jwtString.split(".");
        const decodedCredentials: Array<Record<string, unknown>> = [];

        if (parts.length >= 2) {
          try {
            const payload = JSON.parse(
              atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
            );

            if (payload.vp && payload.vp.verifiableCredential) {
              const vcs = Array.isArray(payload.vp.verifiableCredential)
                ? payload.vp.verifiableCredential
                : [payload.vp.verifiableCredential];

              vcs.forEach((vc: string) => {
                const credParts = vc.split(".");
                if (credParts.length >= 2) {
                  try {
                    const credPayload = JSON.parse(
                      atob(credParts[1].replace(/-/g, "+").replace(/_/g, "/"))
                    );
                    decodedCredentials.push(credPayload);
                  } catch {
                    console.log("Catch");

                  }
                }
              });
            }
          } catch {
            console.log("Catch");

          }
        }

        return {
          isValid: result.credentialsValid,
          type: "presentation",
          details: {
            holder: result.presentation.holder().toString(),
            credentialCount: result.presentation.verifiableCredential().length,
          },
          decodedCredentials,
          presentationJwt: jwtString,
        };
      } catch {
        return await handleVerifyCredential(jwtString);
      }
    } catch (err) {
      return {
        isValid: false,
        type: "credential",
        details: {},
        errors: [err instanceof Error ? err.message : String(err)],
      };
    }
  };

  return (
    <Theme
      accentColor="blue"
      grayColor="slate"
      radius="medium"
      scaling="100%"
      appearance="dark"
    >
      <Container size="4" style={{ minHeight: '100vh', padding: '2rem' }}>
        <Box p="4">
          <Flex direction="column" gap="4">
            <Flex justify="between" align="center">
              <Heading size="8" style={{ color: 'var(--accent-9)' }}>
                🚀 IOTA Identity dApp
              </Heading>
              {didDocument && (
                <Badge color="green" size="3">
                  ✓ Identity Created
                </Badge>
              )}
            </Flex>

            <Box
              p="3"
              style={{
                background: 'var(--gray-3)',
                borderRadius: '8px',
                border: '1px solid var(--gray-6)',
              }}
            >
              <Text size="2" weight="bold">Status: </Text>
              <Text size="2">{status}</Text>
            </Box>

            {error && (
              <Box
                p="3"
                style={{
                  background: 'var(--red-3)',
                  borderRadius: '8px',
                  border: '1px solid var(--red-6)',
                }}
              >
                <Text color="red">❌ Error: {error}</Text>
              </Box>
            )}

            {isInitialized && (
              <Tabs.Root value={currentTab} onValueChange={setCurrentTab}>
                <Tabs.List>
                  <Tabs.Trigger value="simple">🚀 Simple Flow</Tabs.Trigger>
                  <Tabs.Trigger value="identity">🆔 Identity</Tabs.Trigger>
                  <Tabs.Trigger value="credentials">
                    📜 Credentials
                    {credentials.length > 0 && (
                      <Badge ml="2" variant="solid">
                        {credentials.length}
                      </Badge>
                    )}
                  </Tabs.Trigger>
                  <Tabs.Trigger value="presentations">
                    🎯 Presentations
                    {presentations.length > 0 && (
                      <Badge ml="2" variant="solid">
                        {presentations.length}
                      </Badge>
                    )}
                  </Tabs.Trigger>
                  <Tabs.Trigger value="verify">🔍 Verify</Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="simple">
                  <Box mt="4">
                    <SimpleIdentityFlow />
                  </Box>
                </Tabs.Content>

                <Box pt="4">

                  <Tabs.Content value="identity">
                    <Flex direction="column" gap="4">
                      {!didDocument ? (
                        <>
                          <Text size="3">
                            Create your decentralized identity to start issuing credentials
                          </Text>
                          <Button
                            size="3"
                            variant="solid"
                            onClick={handleCreateIdentity}
                            disabled={isLoading}
                          >
                            {isLoading ? '⏳ Creating...' : '➕ Create New Identity'}
                          </Button>
                        </>
                      ) : (
                        <Box
                          p="4"
                          style={{
                            background: 'var(--gray-3)',
                            borderRadius: '8px',
                          }}
                        >
                          <Text size="2" weight="bold" mb="2">
                            Your DID:
                          </Text>
                          <Text
                            size="2"
                            style={{
                              fontFamily: 'monospace',
                              wordBreak: 'break-all',
                            }}
                          >
                            {didDocument.id().toString()}
                          </Text>
                        </Box>
                      )}
                    </Flex>
                  </Tabs.Content>

                  <Tabs.Content value="credentials">
                    <Flex direction="column" gap="4">
                      {!didDocument ? (
                        <Text size="3" color="gray">
                          Create an identity first to issue credentials
                        </Text>
                      ) : (
                        <>
                          {!showIssueForm ? (
                            <>
                              <Button
                                size="3"
                                variant="solid"
                                onClick={() => setShowIssueForm(true)}
                              >
                                ➕ Issue New Credential
                              </Button>

                              {credentials.length === 0 ? (
                                <Box
                                  p="4"
                                  style={{
                                    background: 'var(--gray-3)',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                  }}
                                >
                                  <Text size="3" color="gray">
                                    No credentials issued yet
                                  </Text>
                                </Box>
                              ) : (
                                <Flex direction="column" gap="3">
                                  {credentials.map((credential, index) => (
                                    <CredentialCard
                                      key={index}
                                      credential={credential}
                                      onVerify={async () => {
                                        try {
                                          setStatus('🔍 Verifying credential...');
                                          const result = await handleVerifyCredential(credential.jwt);
                                          if (result.isValid) {
                                            setStatus(`✅ Credential verified successfully!`);
                                            setError(null);
                                          } else {
                                            setStatus(`❌ Credential verification failed`);
                                            setError(result.errors?.join(', ') || 'Verification failed');
                                          }
                                        } catch (err) {
                                          setStatus(`❌ Verification error`);
                                          setError(err instanceof Error ? err.message : String(err));
                                        }
                                      }}
                                      onCreatePresentation={async () => {
                                        setCurrentTab("presentations");
                                        setShowPresentationForm(true);
                                      }}
                                    />
                                  ))}
                                </Flex>
                              )}
                            </>
                          ) : (
                            <IssueCredentialForm
                              subjectDID={didDocument.id().toString()}
                              onIssue={handleIssueCredential}
                              onCancel={() => setShowIssueForm(false)}
                            />
                          )}
                        </>
                      )}
                    </Flex>
                  </Tabs.Content>

                  <Tabs.Content value="presentations">
                    <Flex direction="column" gap="4">
                      {!didDocument ? (
                        <Text size="3" color="gray">
                          Create an identity first to create presentations
                        </Text>
                      ) : (
                        <>
                          {!showPresentationForm ? (
                            <>
                              <Button
                                size="3"
                                variant="solid"
                                onClick={() => setShowPresentationForm(true)}
                                disabled={credentials.length === 0}
                              >
                                ➕ Create New Presentation
                              </Button>

                              {presentations.length === 0 ? (
                                <Box
                                  p="4"
                                  style={{
                                    background: 'var(--gray-3)',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                  }}
                                >
                                  <Text size="3" color="gray">
                                    No presentations created yet
                                  </Text>
                                </Box>
                              ) : (
                                <Flex direction="column" gap="3">
                                  {presentations.map((presentation, index) => (
                                    <Box
                                      key={index}
                                      p="4"
                                      style={{
                                        background: 'var(--gray-3)',
                                        borderRadius: '8px',
                                      }}
                                    >
                                      <Flex direction="column" gap="2">
                                        <Flex justify="between" align="center">
                                          <Text size="3" weight="bold">
                                            Presentation #{index + 1}
                                          </Text>
                                          <Badge color="blue">
                                            {presentation.credentialCount} credential(s)
                                          </Badge>
                                        </Flex>
                                        <Text size="2" color="gray">
                                          Created: {new Date(presentation.createdAt).toLocaleString()}
                                        </Text>
                                        <Text
                                          size="1"
                                          style={{
                                            fontFamily: 'monospace',
                                            wordBreak: 'break-all',
                                          }}
                                        >
                                          {presentation.jwt.substring(0, 100)}...
                                        </Text>
                                        <Button
                                          size="2"
                                          variant="soft"
                                          onClick={() => handleViewPresentationDetails(presentation)}
                                          style={{ marginTop: '8px' }}
                                        >
                                          📋 View Details
                                        </Button>
                                      </Flex>
                                    </Box>
                                  ))}

                                  {selectedPresentation && (
                                    <Box mt="4">
                                      <Flex justify="between" align="center" mb="3">
                                        <Text size="4" weight="bold">Presentation Details</Text>
                                        <Button
                                          size="1"
                                          variant="ghost"
                                          onClick={() => setSelectedPresentation(null)}
                                        >
                                          ✕ Close
                                        </Button>
                                      </Flex>
                                      <CredentialDetails
                                        credentials={selectedPresentation.credentials}
                                        presentationJwt={selectedPresentation.jwt}
                                      />
                                    </Box>
                                  )}
                                </Flex>
                              )}
                            </>
                          ) : (
                            <CreatePresentationForm
                              credentials={credentials}
                              onCreatePresentation={handleCreatePresentation}
                              onCancel={() => setShowPresentationForm(false)}
                            />
                          )}
                        </>
                      )}
                    </Flex>
                  </Tabs.Content>

                  <Tabs.Content value="verify">
                    <VerificationForm onVerify={handleVerify} />
                  </Tabs.Content>
                </Box>
              </Tabs.Root>
            )}
          </Flex>
        </Box>
      </Container>
    </Theme>
  );
}

export default App;
