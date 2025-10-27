import { Box, Button, Card, Checkbox, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";

export interface StoredCredential {
    jwt: string;
    type: string;
    issuer: string;
    subject: string;
    claims: Record<string, string | number | boolean | undefined>;
    issuedAt: string;
}

export interface CreatePresentationFormProps {
    credentials: StoredCredential[];
    onCreatePresentation: (data: {
        credentialJwts: string[];
        challenge?: string;
        expiresInMinutes?: number;
    }) => Promise<void>;
    onCancel: () => void;
}

export function CreatePresentationForm({
    credentials,
    onCreatePresentation,
    onCancel,
}: CreatePresentationFormProps) {
    const [selectedCredentials, setSelectedCredentials] = useState<Set<number>>(new Set());
    const [challenge, setChallenge] = useState("");
    const [expirationMinutes, setExpirationMinutes] = useState<string>("60");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleCredential = (index: number) => {
        const newSelection = new Set(selectedCredentials);
        if (newSelection.has(index)) {
            newSelection.delete(index);
        } else {
            newSelection.add(index);
        }
        setSelectedCredentials(newSelection);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (selectedCredentials.size === 0) {
            setError("Please select at least one credential");
            return;
        }

        const expiresInMinutes = expirationMinutes ? parseInt(expirationMinutes, 10) : undefined;
        if (expiresInMinutes !== undefined && (isNaN(expiresInMinutes) || expiresInMinutes <= 0)) {
            setError("Expiration time must be a positive number");
            return;
        }

        setIsLoading(true);

        try {
            const credentialJwts = Array.from(selectedCredentials).map(
                (index) => credentials[index].jwt
            );

            await onCreatePresentation({
                credentialJwts,
                challenge: challenge.trim() || undefined,
                expiresInMinutes,
            });

            setSelectedCredentials(new Set());
            setChallenge("");
            setExpirationMinutes("60");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create presentation");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card size="3">
            <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="4">
                    <Heading size="5">🎯 Create Verifiable Presentation</Heading>

                    <Box>
                        <Text size="2" weight="bold" mb="2">
                            Select Credentials *
                        </Text>
                        {credentials.length === 0 ? (
                            <Box
                                p="3"
                                style={{
                                    background: "var(--gray-3)",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                }}
                            >
                                <Text size="2" color="gray">
                                    No credentials available. Issue a credential first.
                                </Text>
                            </Box>
                        ) : (
                            <Flex direction="column" gap="2">
                                {credentials.map((credential, index) => (
                                    <Box
                                        key={index}
                                        p="3"
                                        style={{
                                            background: selectedCredentials.has(index)
                                                ? "var(--blue-3)"
                                                : "var(--gray-3)",
                                            borderRadius: "8px",
                                            border: selectedCredentials.has(index)
                                                ? "2px solid var(--blue-6)"
                                                : "1px solid var(--gray-6)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <Flex gap="3" align="center">
                                            <Checkbox
                                                checked={selectedCredentials.has(index)}
                                                onCheckedChange={() => toggleCredential(index)}
                                            />
                                            <Flex
                                                direction="column"
                                                gap="1"
                                                style={{ flex: 1, cursor: "pointer" }}
                                                onClick={() => toggleCredential(index)}
                                            >
                                                <Text size="2" weight="bold">
                                                    {credential.type}
                                                </Text>
                                                <Text size="1" color="gray">
                                                    Issuer: {credential.issuer.substring(0, 30)}...
                                                </Text>
                                                <Text size="1" color="gray">
                                                    Issued: {new Date(credential.issuedAt).toLocaleString()}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                    </Box>
                                ))}
                            </Flex>
                        )}
                    </Box>

                    <Box>
                        <Text size="2" weight="bold" mb="2">
                            Challenge/Nonce (Optional)
                        </Text>
                        <TextField.Root
                            placeholder="Enter challenge string for verification"
                            value={challenge}
                            onChange={(e) => setChallenge(e.target.value)}
                            size="2"
                        />
                        <Text size="1" color="gray" mt="1">
                            A challenge can be provided by the verifier to prevent replay attacks
                        </Text>
                    </Box>

                    {/* Expiration */}
                    <Box>
                        <Text size="2" weight="bold" mb="2">
                            Expiration (minutes)
                        </Text>
                        <TextField.Root
                            type="number"
                            placeholder="60"
                            value={expirationMinutes}
                            onChange={(e) => setExpirationMinutes(e.target.value)}
                            size="2"
                            min="1"
                        />
                        <Text size="1" color="gray" mt="1">
                            Presentation will expire after this duration
                        </Text>
                    </Box>

                    {/* Error Message */}
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
                            onClick={onCancel}
                            disabled={isLoading}
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            size="3"
                            disabled={isLoading || credentials.length === 0}
                            style={{ flex: 1 }}
                        >
                            {isLoading ? "⏳ Creating..." : "✓ Create Presentation"}
                        </Button>
                    </Flex>
                </Flex>
            </form>
        </Card>
    );
}
