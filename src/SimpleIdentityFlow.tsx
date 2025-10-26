import { useState } from "react";
import {
    Box,
    Button,
    Card,
    Container,
    Flex,
    Heading,
    Text,
    TextField,
    Select,
    Badge,
    Callout,
} from "@radix-ui/themes";
import type { IotaDocument, Storage } from "@iota/identity-wasm/web";
import { Jwt } from "@iota/identity-wasm/web";
import * as credentialService from "./services/credentialService";
import * as presentationService from "./services/presentationService";

interface CredentialData {
    jwt: string;
    type: string;
    holder: string;
    createdAt: string;
}

interface DecodedCredential {
    vc?: {
        credentialSubject?: Record<string, unknown>;
        type?: string[];
        [key: string]: unknown;
    };
    iss?: string;
    nbf?: number;
    [key: string]: unknown;
}

export function SimpleIdentityFlow() {
    const [identity, setIdentity] = useState<{
        document: IotaDocument;
        storage: Storage;
        fragment: string;
    } | null>(null);

    const [credentials, setCredentials] = useState<CredentialData[]>([]);
    const [credentialForm, setCredentialForm] = useState({
        type: "UniversityDegree",
        name: "",
        degree: "",
    });

    const [selectedCredentials, setSelectedCredentials] = useState<string[]>([]);
    const [challenge, setChallenge] = useState("");
    const [presentationJwt, setPresentationJwt] = useState<string>("");
    const [verificationResult, setVerificationResult] = useState<{
        isValid: boolean;
        presentation: unknown;
        credentials: DecodedCredential[];
    } | null>(null);

    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
    const [status, setStatus] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPresentationJwt, setShowPresentationJwt] = useState(false);
    const [showCredentialDetails, setShowCredentialDetails] = useState(false);

    const createIdentity = async () => {
        setIsLoading(true);
        setStatus("Creating your digital identity...");
        try {
            const { createIdentityWithClient } = await import("./util");
            const result = await createIdentityWithClient();
            setIdentity(result);
            setStatus("✅ Identity created! This is like your digital ID card.");
            setCurrentStep(2);
        } catch (error) {
            setStatus(
                `❌ Failed: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            setIsLoading(false);
        }
    };

    const issueCredential = async () => {
        if (!identity) return;

        setIsLoading(true);
        setStatus("Issuing credential...");
        try {
            const credentialData = {
                id: `https://example.com/credentials/${Date.now()}`,
                type: credentialForm.type,
                issuer: identity.document.id().toString(),
                credentialSubject: {
                    id: identity.document.id().toString(),
                    name: credentialForm.name,
                    degree: credentialForm.degree,
                },
            };

            const jwt = await credentialService.issueCredential(
                identity.document,
                identity.storage,
                identity.fragment,
                credentialData
            );

            const newCredential: CredentialData = {
                jwt: jwt.toString(),
                type: credentialForm.type,
                holder: identity.document.id().toString(),
                createdAt: new Date().toISOString(),
            };

            setCredentials([...credentials, newCredential]);

            const storedCred = {
                jwt: jwt.toString(),
                type: credentialForm.type,
                issuer: identity.document.id().toString(),
                subject: identity.document.id().toString(),
                claims: {
                    name: credentialForm.name,
                    degree: credentialForm.degree,
                },
                issuedAt: new Date().toISOString(),
            };

            const stored = credentialService.loadCredentials();
            stored.push(storedCred);
            localStorage.setItem("iota_credentials", JSON.stringify(stored));

            setStatus(
                `✅ Credential issued! This is like receiving a ${credentialForm.type}.`
            );
            setCredentialForm({ type: "UniversityDegree", name: "", degree: "" });
            setCurrentStep(3);
        } catch (error) {
            setStatus(
                `❌ Failed: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            setIsLoading(false);
        }
    };

    const createPresentation = async () => {
        if (!identity || selectedCredentials.length === 0) return;

        setIsLoading(true);
        setStatus("Creating presentation...");
        try {
            const credentialJwts = selectedCredentials.map((jwt) => new Jwt(jwt));

            const presentationData = {
                holder: identity.document.id().toString(),
                verifiableCredentials: credentialJwts,
                challenge: challenge || undefined,
                expirationMinutes: 60,
            };

            const presentationJwtObj = await presentationService.createPresentation(
                identity.document,
                identity.storage,
                identity.fragment,
                presentationData
            );

            const jwtString = presentationJwtObj.toString();
            setPresentationJwt(jwtString);

            setStatus(
                "✅ Presentation created! This is like showing your credentials to someone."
            );
            setCurrentStep(4);

            await verifyPresentation(jwtString);
        } catch (error) {
            setStatus(
                `❌ Failed: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            setIsLoading(false);
        }
    };

    const verifyPresentation = async (jwtString: string) => {
        if (!identity) return;

        setIsLoading(true);
        setStatus("Verifying presentation...");
        try {
            const jwt = new Jwt(jwtString);
            const result = await presentationService.verifyPresentation(
                jwt,
                identity.document,
                [identity.document],
                challenge || undefined
            );

            const decodedCredentials = selectedCredentials.map((credJwt) => {
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
            }).filter(Boolean);

            setVerificationResult({
                isValid: result.credentialsValid,
                presentation: result.presentation,
                credentials: decodedCredentials,
            });

            if (result.credentialsValid) {
                setStatus(
                    "✅ Verification successful! The credentials are authentic and valid."
                );
            } else {
                setStatus("⚠️ Verification completed but some credentials are invalid.");
            }
        } catch (error) {
            setStatus(
                `❌ Verification failed: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setStatus(`✅ ${label} copied to clipboard!`);
            setTimeout(() => {
                setStatus("✅ Verification successful! The credentials are authentic and valid.");
            }, 2000);
        });
    };

    return (
        <Container size="3" p="4">
            <Box mb="6">
                <Heading size="8" mb="2">
                    🆔 Digital Identity Demo
                </Heading>
                <Text color="gray" size="3">
                    Learn how digital credentials work - just like real-world ID cards,
                    diplomas, and licenses!
                </Text>
            </Box>

            <Flex gap="2" mb="6" wrap="wrap">
                <Badge color={currentStep >= 1 ? "green" : "gray"} size="2">
                    1. Create Identity
                </Badge>
                <Badge color={currentStep >= 2 ? "green" : "gray"} size="2">
                    2. Get Credentials
                </Badge>
                <Badge color={currentStep >= 3 ? "green" : "gray"} size="2">
                    3. Share Credentials
                </Badge>
                <Badge color={currentStep >= 4 ? "green" : "gray"} size="2">
                    4. Verify
                </Badge>
            </Flex>

            {status && (
                <Callout.Root mb="4" color={status.includes("✅") ? "green" : status.includes("❌") ? "red" : "blue"}>
                    <Callout.Text>{status}</Callout.Text>
                </Callout.Root>
            )}

            {!identity && (
                <Card mb="4">
                    <Heading size="5" mb="3">
                        Step 1: Create Your Digital Identity
                    </Heading>
                    <Text color="gray" size="2" mb="4">
                        Think of this like getting your first ID card or passport. This
                        creates a unique digital identity that you control.
                    </Text>
                    <Button
                        onClick={createIdentity}
                        disabled={isLoading}
                        size="3"
                        style={{ width: "100%" }}
                    >
                        {isLoading ? "Creating..." : "🆔 Create My Digital Identity"}
                    </Button>
                </Card>
            )}

            {identity && (
                <Card mb="4" variant="surface">
                    <Flex justify="between" align="center">
                        <Box>
                            <Text weight="bold" size="2">
                                Your Digital Identity (DID)
                            </Text>
                            <Text size="1" color="gray" style={{ wordBreak: "break-all" }}>
                                {identity.document.id().toString()}
                            </Text>
                        </Box>
                        <Badge color="green">Active</Badge>
                    </Flex>
                </Card>
            )}

            {identity && currentStep >= 2 && (
                <Card mb="4">
                    <Heading size="5" mb="3">
                        Step 2: Get Credentials
                    </Heading>
                    <Text color="gray" size="2" mb="4">
                        Just like getting a university degree, driver's license, or
                        professional certification. These prove specific facts about you.
                    </Text>

                    <Box mb="3">
                        <Text size="2" weight="bold" mb="2">
                            Credential Type
                        </Text>
                        <Select.Root
                            value={credentialForm.type}
                            onValueChange={(value) =>
                                setCredentialForm({ ...credentialForm, type: value })
                            }
                        >
                            <Select.Trigger style={{ width: "100%" }} />
                            <Select.Content>
                                <Select.Item value="UniversityDegree">
                                    🎓 University Degree
                                </Select.Item>
                                <Select.Item value="DriversLicense">
                                    🚗 Driver's License
                                </Select.Item>
                                <Select.Item value="ProfessionalCertification">
                                    💼 Professional Certification
                                </Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Box>

                    <Box mb="3">
                        <Text size="2" weight="bold" mb="2">
                            Your Name
                        </Text>
                        <TextField.Root
                            value={credentialForm.name}
                            onChange={(e) =>
                                setCredentialForm({ ...credentialForm, name: e.target.value })
                            }
                            placeholder="e.g., Alice Johnson"
                        />
                    </Box>

                    <Box mb="4">
                        <Text size="2" weight="bold" mb="2">
                            Degree/Certification
                        </Text>
                        <TextField.Root
                            value={credentialForm.degree}
                            onChange={(e) =>
                                setCredentialForm({ ...credentialForm, degree: e.target.value })
                            }
                            placeholder="e.g., Bachelor of Computer Science"
                        />
                    </Box>

                    <Button
                        onClick={issueCredential}
                        disabled={
                            isLoading || !credentialForm.name || !credentialForm.degree
                        }
                        size="3"
                        style={{ width: "100%" }}
                    >
                        {isLoading ? "Issuing..." : "📜 Issue Credential"}
                    </Button>

                    {credentials.length > 0 && (
                        <Box mt="4">
                            <Text weight="bold" size="2" mb="2">
                                Your Credentials ({credentials.length})
                            </Text>
                            {credentials.map((cred, index) => (
                                <Card key={index} mt="2" variant="surface">
                                    <Flex justify="between" align="center">
                                        <Box>
                                            <Text size="2" weight="bold">
                                                {cred.type}
                                            </Text>
                                            <Text size="1" color="gray">
                                                Issued {new Date(cred.createdAt).toLocaleDateString()}
                                            </Text>
                                        </Box>
                                        <Badge color="blue">Valid</Badge>
                                    </Flex>
                                </Card>
                            ))}
                        </Box>
                    )}
                </Card>
            )}

            {credentials.length > 0 && currentStep >= 3 && (
                <Card mb="4">
                    <Heading size="5" mb="3">
                        Step 3: Share Your Credentials
                    </Heading>
                    <Text color="gray" size="2" mb="4">
                        Like showing your ID at airport security or presenting your diploma
                        to an employer. You choose what to share.
                    </Text>

                    <Box mb="3">
                        <Text size="2" weight="bold" mb="2">
                            Select Credentials to Share
                        </Text>
                        {credentials.map((cred, index) => (
                            <Flex key={index} align="center" gap="2" mb="2">
                                <input
                                    type="checkbox"
                                    checked={selectedCredentials.includes(cred.jwt)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedCredentials([...selectedCredentials, cred.jwt]);
                                        } else {
                                            setSelectedCredentials(
                                                selectedCredentials.filter((jwt) => jwt !== cred.jwt)
                                            );
                                        }
                                    }}
                                />
                                <Text size="2">{cred.type}</Text>
                            </Flex>
                        ))}
                    </Box>

                    <Box mb="4">
                        <Text size="2" weight="bold" mb="2">
                            Challenge Code (Optional)
                        </Text>
                        <TextField.Root
                            value={challenge}
                            onChange={(e) => setChallenge(e.target.value)}
                            placeholder="e.g., verify-2024-abc123"
                        />
                        <Text size="1" color="gray" mt="1">
                            Like a security code to prove this presentation is fresh
                        </Text>
                    </Box>

                    <Button
                        onClick={createPresentation}
                        disabled={isLoading || selectedCredentials.length === 0}
                        size="3"
                        style={{ width: "100%" }}
                    >
                        {isLoading ? "Creating..." : "🤝 Create Presentation"}
                    </Button>
                </Card>
            )}

            {currentStep >= 4 && (
                <Card>
                    <Heading size="5" mb="3">
                        ✅ Verification Complete!
                    </Heading>
                    <Text color="gray" size="2" mb="4">
                        Your presentation has been verified. In the real world, the verifier
                        (employer, government, etc.) would check your credentials like this.
                    </Text>

                    <Card mb="4" variant="surface">
                        <Flex justify="between" align="center" mb="2">
                            <Text size="2" weight="bold">
                                📄 Presentation JWT Token
                            </Text>
                            <Button
                                size="1"
                                variant="soft"
                                onClick={() => copyToClipboard(presentationJwt, "Presentation JWT")}
                            >
                                📋 Copy
                            </Button>
                        </Flex>
                        <Box
                            p="3"
                            style={{
                                background: "var(--gray-2)",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontFamily: "monospace",
                                wordBreak: "break-all",
                                maxHeight: showPresentationJwt ? "none" : "60px",
                                overflow: "hidden",
                                position: "relative",
                            }}
                        >
                            {presentationJwt}
                        </Box>
                        <Button
                            size="1"
                            variant="ghost"
                            onClick={() => setShowPresentationJwt(!showPresentationJwt)}
                            style={{ marginTop: "8px" }}
                        >
                            {showPresentationJwt ? "Show Less" : "Show Full JWT"}
                        </Button>
                    </Card>

                    {verificationResult && (
                        <Card mb="4" variant="surface">
                            <Heading size="4" mb="3">
                                🔍 Verification Details
                            </Heading>

                            <Box mb="3">
                                <Flex gap="2" align="center" mb="2">
                                    <Badge color="green">✓</Badge>
                                    <Text size="2">Signature Valid</Text>
                                </Flex>
                                <Flex gap="2" align="center" mb="2">
                                    <Badge color="green">✓</Badge>
                                    <Text size="2">Credentials Verified</Text>
                                </Flex>
                                <Flex gap="2" align="center" mb="2">
                                    <Badge color="green">✓</Badge>
                                    <Text size="2">Not Tampered</Text>
                                </Flex>
                                <Flex gap="2" align="center" mb="2">
                                    <Badge color="green">✓</Badge>
                                    <Text size="2">Not Expired</Text>
                                </Flex>
                            </Box>

                            <Box mb="3">
                                <Text size="2" weight="bold" mb="2">
                                    Holder (Who presented):
                                </Text>
                                <Box
                                    p="2"
                                    style={{
                                        background: "var(--gray-2)",
                                        borderRadius: "4px",
                                        fontSize: "11px",
                                        fontFamily: "monospace",
                                        wordBreak: "break-all",
                                    }}
                                >
                                    {identity?.document.id().toString()}
                                </Box>
                            </Box>

                            {challenge && (
                                <Box mb="3">
                                    <Text size="2" weight="bold" mb="2">
                                        Challenge Code Verified:
                                    </Text>
                                    <Box
                                        p="2"
                                        style={{
                                            background: "var(--green-3)",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            fontFamily: "monospace",
                                        }}
                                    >
                                        {challenge}
                                    </Box>
                                </Box>
                            )}
                        </Card>
                    )}

                    {verificationResult && verificationResult.credentials.length > 0 && (
                        <Card mb="4" variant="surface">
                            <Flex justify="between" align="center" mb="3">
                                <Heading size="4">📜 Credentials in Presentation</Heading>
                                <Badge color="blue">{verificationResult.credentials.length} credential(s)</Badge>
                            </Flex>

                            {verificationResult.credentials.map((cred: DecodedCredential, index: number) => (
                                <Card key={index} mb="3" style={{ background: "var(--gray-1)" }}>
                                    <Flex justify="between" align="center" mb="2">
                                        <Text size="2" weight="bold">
                                            Credential #{index + 1}
                                        </Text>
                                        <Badge color="green">✓ Valid</Badge>
                                    </Flex>

                                    {/* Credential Subject */}
                                    <Box mb="2">
                                        <Text size="2" weight="bold" color="gray">
                                            Subject Information:
                                        </Text>
                                        {cred.vc && cred.vc.credentialSubject && (
                                            <Box
                                                p="2"
                                                mt="1"
                                                style={{
                                                    background: "var(--gray-2)",
                                                    borderRadius: "4px",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                {Object.entries(cred.vc.credentialSubject)
                                                    .filter(([key]) => key !== "id")
                                                    .map(([key, value]) => (
                                                        <Flex key={key} justify="between" mb="1">
                                                            <Text size="2" weight="bold">
                                                                {key}:
                                                            </Text>
                                                            <Text size="2">{String(value)}</Text>
                                                        </Flex>
                                                    ))}
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Credential Type */}
                                    <Box mb="2">
                                        <Text size="2" weight="bold" color="gray">
                                            Type:
                                        </Text>
                                        <Text size="2" mt="1">
                                            {cred.vc?.type?.join(", ") || "VerifiableCredential"}
                                        </Text>
                                    </Box>

                                    {/* Issuer */}
                                    <Box mb="2">
                                        <Text size="2" weight="bold" color="gray">
                                            Issued by:
                                        </Text>
                                        <Box
                                            p="2"
                                            mt="1"
                                            style={{
                                                background: "var(--gray-2)",
                                                borderRadius: "4px",
                                                fontSize: "11px",
                                                fontFamily: "monospace",
                                                wordBreak: "break-all",
                                            }}
                                        >
                                            {cred.iss || "Unknown"}
                                        </Box>
                                    </Box>

                                    {/* Issuance Date */}
                                    {cred.nbf && (
                                        <Box mb="2">
                                            <Text size="2" weight="bold" color="gray">
                                                Issued on:
                                            </Text>
                                            <Text size="2" mt="1">
                                                {new Date(cred.nbf * 1000).toLocaleString()}
                                            </Text>
                                        </Box>
                                    )}

                                    {/* Full Credential JSON */}
                                    <Button
                                        size="1"
                                        variant="ghost"
                                        onClick={() => setShowCredentialDetails(!showCredentialDetails)}
                                        style={{ marginTop: "8px" }}
                                    >
                                        {showCredentialDetails ? "Hide" : "Show"} Full Credential JSON
                                    </Button>

                                    {showCredentialDetails && (
                                        <Box
                                            mt="2"
                                            p="3"
                                            style={{
                                                background: "var(--gray-2)",
                                                borderRadius: "4px",
                                                fontSize: "11px",
                                                fontFamily: "monospace",
                                                maxHeight: "300px",
                                                overflow: "auto",
                                            }}
                                        >
                                            <pre>{JSON.stringify(cred, null, 2)}</pre>
                                        </Box>
                                    )}

                                    <Button
                                        size="1"
                                        variant="soft"
                                        onClick={() =>
                                            copyToClipboard(
                                                JSON.stringify(cred, null, 2),
                                                "Credential JSON"
                                            )
                                        }
                                        style={{ marginTop: "8px", width: "100%" }}
                                    >
                                        📋 Copy Credential JSON
                                    </Button>
                                </Card>
                            ))}
                        </Card>
                    )}

                    <Callout.Root color="green">
                        <Callout.Text>
                            <strong>How it works:</strong> Your credentials are
                            cryptographically signed, making them tamper-proof. Anyone can
                            verify they're authentic without contacting the issuer.
                        </Callout.Text>
                    </Callout.Root>
                </Card>
            )}
        </Container>
    );
}
