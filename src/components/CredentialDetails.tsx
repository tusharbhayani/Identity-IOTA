import { useState } from "react";
import { Box, Button, Card, Flex, Text, Badge } from "@radix-ui/themes";

interface DecodedCredential {
    vc?: {
        credentialSubject?: Record<string, unknown>;
        type?: string[];
        [key: string]: unknown;
    };
    iss?: string;
    nbf?: number;
    exp?: number;
    [key: string]: unknown;
}

interface CredentialDetailsProps {
    credentials: DecodedCredential[];
    presentationJwt?: string;
}

export function CredentialDetails({ credentials, presentationJwt }: CredentialDetailsProps) {
    const [showCredentialDetails, setShowCredentialDetails] = useState<Record<number, boolean>>({});
    const [showPresentationJwt, setShowPresentationJwt] = useState(false);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert(`✅ ${label} copied to clipboard!`);
        });
    };

    const toggleCredentialDetails = (index: number) => {
        setShowCredentialDetails(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <>
            {presentationJwt && (
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
            )}

            {credentials.length > 0 && (
                <Card variant="surface">
                    <Flex justify="between" align="center" mb="3">
                        <Text size="3" weight="bold">📜 Credentials Details</Text>
                        <Badge color="blue">{credentials.length} credential(s)</Badge>
                    </Flex>

                    {credentials.map((cred: DecodedCredential, index: number) => (
                        <Card key={index} mb="3" style={{ background: "var(--gray-1)" }}>
                            <Flex justify="between" align="center" mb="2">
                                <Text size="2" weight="bold">
                                    Credential #{index + 1}
                                </Text>
                                <Badge color="green">✓ Valid</Badge>
                            </Flex>

                            {cred.vc && cred.vc.credentialSubject && (
                                <Box mb="2">
                                    <Text size="2" weight="bold" color="gray" mb="1">
                                        Subject Information:
                                    </Text>
                                    <Box
                                        p="2"
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
                                </Box>
                            )}

                            <Box mb="2">
                                <Text size="2" weight="bold" color="gray">
                                    Type:
                                </Text>
                                <Text size="2" style={{ marginTop: "4px" }}>
                                    {cred.vc?.type?.join(", ") || "VerifiableCredential"}
                                </Text>
                            </Box>

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

                            {cred.nbf && (
                                <Box mb="2">
                                    <Text size="2" weight="bold" color="gray">
                                        Issued on:
                                    </Text>
                                    <Text size="2" style={{ marginTop: "4px" }}>
                                        {new Date(cred.nbf * 1000).toLocaleString()}
                                    </Text>
                                </Box>
                            )}

                            {cred.exp && (
                                <Box mb="2">
                                    <Text size="2" weight="bold" color="gray">
                                        Expires on:
                                    </Text>
                                    <Text size="2" style={{ marginTop: "4px" }}>
                                        {new Date(cred.exp * 1000).toLocaleString()}
                                    </Text>
                                </Box>
                            )}

                            <Button
                                size="1"
                                variant="ghost"
                                onClick={() => toggleCredentialDetails(index)}
                                style={{ marginTop: "8px" }}
                            >
                                {showCredentialDetails[index] ? "Hide" : "Show"} Full Credential JSON
                            </Button>

                            {showCredentialDetails[index] && (
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
        </>
    );
}
