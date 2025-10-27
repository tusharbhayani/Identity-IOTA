import { Badge, Box, Button, Card, Flex, Heading, Separator, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";
import { CredentialDetails } from "./CredentialDetails";

export interface VerificationResult {
    isValid: boolean;
    type: "credential" | "presentation";
    details: {
        issuer?: string;
        subject?: string;
        holder?: string;
        credentialTypes?: string[];
        issuedAt?: string;
        expiresAt?: string;
        claims?: Record<string, string | number | boolean | undefined>;
        credentialCount?: number;
    };
    errors?: string[];
    decodedCredentials?: Array<Record<string, unknown>>;
    presentationJwt?: string;
}

export interface VerificationFormProps {
    onVerify: (jwt: string, challenge?: string) => Promise<VerificationResult>;
}

export function VerificationForm({ onVerify }: VerificationFormProps) {
    const [jwt, setJwt] = useState("");
    const [challenge, setChallenge] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResult(null);

        if (!jwt.trim()) {
            setError("JWT is required");
            return;
        }

        setIsLoading(true);

        try {
            const verificationResult = await onVerify(
                jwt.trim(),
                challenge.trim() || undefined
            );
            setResult(verificationResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setJwt("");
        setChallenge("");
        setResult(null);
        setError(null);
    };

    return (
        <Flex direction="column" gap="4">
            <Card size="3">
                <form onSubmit={handleVerify}>
                    <Flex direction="column" gap="4">
                        <Heading size="5">🔍 Verify Credential or Presentation</Heading>

                        <Box>
                            <Text size="2" weight="bold" mb="2">
                                JWT Token *
                            </Text>
                            <TextField.Root
                                placeholder="Paste JWT token here (credential or presentation)"
                                value={jwt}
                                onChange={(e) => setJwt(e.target.value)}
                                size="2"
                                required
                            />
                        </Box>

                        <Box>
                            <Text size="2" weight="bold" mb="2">
                                Challenge (Optional for Presentations)
                            </Text>
                            <TextField.Root
                                placeholder="Enter challenge if presentation was created with one"
                                value={challenge}
                                onChange={(e) => setChallenge(e.target.value)}
                                size="2"
                            />
                        </Box>

                        {error && (
                            <Box
                                p="3"
                                style={{
                                    background: "var(--red-3)",
                                    borderRadius: "8px",
                                    border: "1px solid var(--red-6)",
                                }}
                            >
                                <Text size="2" color="red">
                                    {error}
                                </Text>
                            </Box>
                        )}

                        <Flex gap="2">
                            <Button
                                type="button"
                                variant="soft"
                                size="3"
                                onClick={handleReset}
                                disabled={isLoading}
                                style={{ flex: 1 }}
                            >
                                Reset
                            </Button>
                            <Button
                                type="submit"
                                variant="solid"
                                size="3"
                                disabled={isLoading}
                                style={{ flex: 1 }}
                            >
                                {isLoading ? "⏳ Verifying..." : "✓ Verify"}
                            </Button>
                        </Flex>
                    </Flex>
                </form>
            </Card>

            {result && <VerificationResultCard result={result} />}

            {result && result.decodedCredentials && result.decodedCredentials.length > 0 && (
                <Box mt="4">
                    <CredentialDetails
                        credentials={result.decodedCredentials}
                        presentationJwt={result.presentationJwt}
                    />
                </Box>
            )}
        </Flex>
    );
}

interface VerificationResultCardProps {
    result: VerificationResult;
}

function VerificationResultCard({ result }: VerificationResultCardProps) {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <Card
            size="3"
            style={{
                border: result.isValid
                    ? "2px solid var(--green-6)"
                    : "2px solid var(--red-6)",
                background: result.isValid ? "var(--green-2)" : "var(--red-2)",
            }}
        >
            <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                    <Flex align="center" gap="2">
                        <Text size="6">{result.isValid ? "✓" : "✗"}</Text>
                        <Heading size="5">
                            {result.isValid ? "Verification Successful" : "Verification Failed"}
                        </Heading>
                    </Flex>
                    <Badge color={result.isValid ? "green" : "red"} size="2">
                        {result.type === "credential" ? "Credential" : "Presentation"}
                    </Badge>
                </Flex>

                <Separator size="4" />

                <Flex direction="column" gap="2">
                    {result.details.issuer && (
                        <Flex direction="column" gap="1">
                            <Text size="2" weight="bold">
                                Issuer
                            </Text>
                            <Text size="2" style={{ wordBreak: "break-all" }}>
                                {result.details.issuer}
                            </Text>
                        </Flex>
                    )}

                    {result.details.subject && (
                        <Flex direction="column" gap="1">
                            <Text size="2" weight="bold">
                                Subject
                            </Text>
                            <Text size="2" style={{ wordBreak: "break-all" }}>
                                {result.details.subject}
                            </Text>
                        </Flex>
                    )}

                    {result.details.holder && (
                        <Flex direction="column" gap="1">
                            <Text size="2" weight="bold">
                                Holder
                            </Text>
                            <Text size="2" style={{ wordBreak: "break-all" }}>
                                {result.details.holder}
                            </Text>
                        </Flex>
                    )}

                    {result.details.credentialCount !== undefined && (
                        <Flex direction="column" gap="1">
                            <Text size="2" weight="bold">
                                Credentials in Presentation
                            </Text>
                            <Text size="2">{result.details.credentialCount}</Text>
                        </Flex>
                    )}

                    {result.details.credentialTypes && result.details.credentialTypes.length > 0 && (
                        <Flex direction="column" gap="1">
                            <Text size="2" weight="bold">
                                Credential Types
                            </Text>
                            <Flex gap="2" wrap="wrap">
                                {result.details.credentialTypes.map((type, index) => (
                                    <Badge key={index} variant="soft" color="blue">
                                        {type}
                                    </Badge>
                                ))}
                            </Flex>
                        </Flex>
                    )}

                    {result.details.issuedAt && (
                        <Flex direction="column" gap="1">
                            <Text size="2" weight="bold">
                                Issued At
                            </Text>
                            <Text size="2">{new Date(result.details.issuedAt).toLocaleString()}</Text>
                        </Flex>
                    )}

                    {result.details.expiresAt && (
                        <Flex direction="column" gap="1">
                            <Text size="2" weight="bold">
                                Expires At
                            </Text>
                            <Text size="2">{new Date(result.details.expiresAt).toLocaleString()}</Text>
                        </Flex>
                    )}
                </Flex>

                {result.details.claims && Object.keys(result.details.claims).length > 0 && (
                    <Box>
                        <Button
                            variant="ghost"
                            size="2"
                            onClick={() => setShowDetails(!showDetails)}
                        >
                            {showDetails ? "▼" : "▶"} Claims ({Object.keys(result.details.claims).length})
                        </Button>
                        {showDetails && (
                            <Box
                                mt="2"
                                p="3"
                                style={{
                                    background: "var(--gray-3)",
                                    borderRadius: "8px",
                                    fontFamily: "monospace",
                                }}
                            >
                                <pre style={{ margin: 0, fontSize: "12px" }}>
                                    {JSON.stringify(result.details.claims, null, 2)}
                                </pre>
                            </Box>
                        )}
                    </Box>
                )}

                {result.errors && result.errors.length > 0 && (
                    <Box
                        p="3"
                        style={{
                            background: "var(--red-4)",
                            borderRadius: "8px",
                        }}
                    >
                        <Text size="2" weight="bold" mb="2">
                            Errors:
                        </Text>
                        <Flex direction="column" gap="1">
                            {result.errors.map((error, index) => (
                                <Text key={index} size="2">
                                    • {error}
                                </Text>
                            ))}
                        </Flex>
                    </Box>
                )}
            </Flex>
        </Card>
    );
}
