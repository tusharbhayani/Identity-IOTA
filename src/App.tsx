import { useEffect, useState } from "react";
import { Container, Flex, Heading, Tabs, Text, Theme, Box } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./styles/responsive.css";
import { initIdentity } from "./util";
import { StoredCredential } from "./components/CreatePresentationForm";
import { IdentityDashboard } from "./components/IdentityDashboard";
import { CredentialsManager } from "./components/CredentialsManager";
import { PresentationsManager } from "./components/PresentationsManager";
import { SettingsPanel } from "./components/SettingsPanel";
import { CredentialDetailsModal } from "./components/CredentialDetailsModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import * as credentialService from "./services/credentialService";
import * as presentationService from "./services/presentationService";
import { migrationIdentityService } from "./services/migrationIdentityService";
import type { IotaDocument } from "@iota/identity-wasm/web";
import { Jwt } from "@iota/identity-wasm/web";
import type { PresentationData } from "./services/presentationService";

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

  const [didDocument, setDidDocument] = useState<IotaDocument | null>(null);
  const [identityStorage, setIdentityStorage] = useState<import("@iota/identity-wasm/web").Storage | null>(null);
  const [verificationFragment, setVerificationFragment] = useState<string>("");

  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [showMigrationForm, setShowMigrationForm] = useState(false);

  const [presentations, setPresentations] = useState<StoredPresentation[]>([]);
  const [showPresentationForm, setShowPresentationForm] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<StoredCredential | null>(null);

  const handleClearCredentials = () => {
    setCredentials([]);
    credentialService.clearCredentials();
  };

  const handleDeleteCredential = (credentialToDelete: StoredCredential) => {
    const updatedCredentials = credentials.filter(cred => cred.jwt !== credentialToDelete.jwt);
    setCredentials(updatedCredentials);

    localStorage.setItem("iota-credentials", JSON.stringify(updatedCredentials));

    setStatus(`🗑️ Credential "${credentialToDelete.type}" deleted successfully`);

  };

  const handleClearPresentations = () => {
    setPresentations([]);
    presentationService.clearPresentations();
  };

  const handleCreatePresentation = async (data: {
    credentialJwts: string[];
    challenge?: string;
    expiresInMinutes?: number;
  }) => {
    try {
      if (!didDocument || !identityStorage || !verificationFragment) {
        throw new Error("Identity not initialized");
      }

      const presentationData: PresentationData = {
        holder: didDocument.id().toString(),
        verifiableCredentials: data.credentialJwts.map(jwt => new Jwt(jwt)),
        challenge: data.challenge || Date.now().toString(),
        expirationMinutes: data.expiresInMinutes || 60
      };

      const jwt = await presentationService.createPresentation(
        didDocument,
        identityStorage,
        verificationFragment,
        presentationData
      );

      const newPresentation: StoredPresentation = {
        jwt: jwt.toString(),
        holder: didDocument.id().toString(),
        credentialCount: data.credentialJwts.length,
        createdAt: new Date().toISOString()
      };

      setPresentations([...presentations, newPresentation]);
      setShowPresentationForm(false);
      setStatus(`✅ Presentation created with ${data.credentialJwts.length} credentials!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create presentation");
      throw err;
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setStatus('Initializing IOTA Identity Client...');
        await initIdentity();
        setIsInitialized(true);
        setStatus('✅ IOTA Identity Client initialized and ready!');

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

      if (data.type.startsWith('Migration') ||
        data.type === 'WorkPermit' ||
        data.type === 'HealthRecord' ||
        data.type === 'SkillCertification') {

        const result = await migrationIdentityService.issueMigrationCredential(
          didDocument,
          identityStorage,
          verificationFragment,
          {
            type: data.type,
            holder: {
              name: data.customFields.name || 'Unknown',
              dateOfBirth: data.customFields.dateOfBirth || '1990-01-01',
              nationality: data.customFields.nationality || 'Unknown',
              passportNumber: data.customFields.passportNumber,
              occupation: data.customFields.occupation,
              employerId: data.customFields.employerId,
            },
            claims: data.customFields,
            issuanceDate: new Date().toISOString(),
            expirationDate: data.customFields.expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }
        );

        if (result.credentialJwt) {
          const storedCredential = {
            jwt: result.credentialJwt,
            type: data.type,
            issuer: didDocument.id().toString(),
            subject: didDocument.id().toString(),
            claims: data.customFields,
            issuedAt: new Date().toISOString(),
          };

          const currentCredentials = credentialService.loadCredentials();
          currentCredentials.push(storedCredential);
          localStorage.setItem("iota-credentials", JSON.stringify(currentCredentials));
          setCredentials(currentCredentials);
        }

        setShowMigrationForm(false);
        setStatus(`✅ ${data.type} issued successfully!`);

        return {
          credentialJwt: result.credentialJwt,
          credentialOffer: result.credentialOffer,
          qrCodeUrl: result.qrCodeUrl,
          httpUrl: result.httpUrl,
          preAuthorizedCode: result.preAuthorizedCode,
          w3cCredential: result.w3cCredential
        };
      } else {
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
        setStatus(`✅ Credential "${data.type}" issued successfully!`);

        return { credentialJwt: jwt.toString() };
      }
    } catch (err) {
      console.error("❌ Failed to issue credential:", err);
      throw new Error(
        `Failed to issue credential: ${err instanceof Error ? err.message : String(err)}`
      );
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
        <ErrorBoundary>
          <Flex direction="column" gap="6">
            <Box>
              <Heading size="8" mb="2">🔐 Digital Identity Wallet</Heading>
              <Text size="4" color="gray">
                Manage your verifiable credentials with W3C and OpenID4VCI standards
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

            <Tabs.Root defaultValue="dashboard">
              <Tabs.List size="2" style={{ marginBottom: '24px' }}>
                <Tabs.Trigger value="dashboard">📊 Dashboard</Tabs.Trigger>
                <Tabs.Trigger value="credentials">🎫 Credentials</Tabs.Trigger>
                <Tabs.Trigger value="presentations">✅ Presentations</Tabs.Trigger>
                <Tabs.Trigger value="settings">⚙️ Settings</Tabs.Trigger>
              </Tabs.List>

              <Box>
                <Tabs.Content value="dashboard">
                  <IdentityDashboard
                    didDocument={didDocument}
                    credentials={credentials}
                    presentations={presentations}
                    status={status}
                    onCreateIdentity={handleCreateIdentity}
                    isLoading={isLoading}
                  />
                </Tabs.Content>

                <Tabs.Content value="credentials">
                  <CredentialsManager
                    didDocument={didDocument}
                    credentials={credentials}
                    showMigrationForm={showMigrationForm}
                    onShowMigrationForm={() => setShowMigrationForm(true)}
                    onHideMigrationForm={() => setShowMigrationForm(false)}
                    onIssueCredential={handleIssueCredential}
                    onCredentialSelect={(cred) => setSelectedCredential(cred)}
                    onCredentialDelete={handleDeleteCredential}
                  />
                </Tabs.Content>

                <Tabs.Content value="presentations">
                  <PresentationsManager
                    didDocument={didDocument}
                    credentials={credentials}
                    presentations={presentations}
                    showPresentationForm={showPresentationForm}
                    onShowPresentationForm={() => setShowPresentationForm(true)}
                    onHidePresentationForm={() => setShowPresentationForm(false)}
                    onCreatePresentation={handleCreatePresentation}
                    onPresentationSelect={(presentation) => {
                      console.log('Selected presentation:', presentation);
                    }}
                  />
                </Tabs.Content>

                <Tabs.Content value="settings">
                  <SettingsPanel
                    credentials={credentials}
                    presentations={presentations}
                    onClearCredentials={handleClearCredentials}
                    onClearPresentations={handleClearPresentations}
                  />
                </Tabs.Content>
              </Box>
            </Tabs.Root>

            {selectedCredential && (
              <CredentialDetailsModal
                credential={selectedCredential}
                didDocument={didDocument}
                identityStorage={identityStorage}
                verificationFragment={verificationFragment}
                onClose={() => setSelectedCredential(null)}
              />
            )}
          </Flex>
        </ErrorBoundary>
      </Container>
    </Theme>
  );
}

export default App;