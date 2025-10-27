import { Box, Card, Flex, Text, Badge, Button, Separator } from "@radix-ui/themes";
import { useState } from "react";

export interface StoredCredential {
    jwt: string;
    type: string;
    issuer: string;
    subject: string;
    claims: Record<string, string | number | boolean | undefined>;
    issuedAt: string;
}

export interface CredentialCardProps {
    credential: StoredCredential;
    onVerify?: () => void;
    onCreatePresentation?: () => void;
}

export function CredentialCard({
    credential,
    onVerify,
    onCreatePresentation,
}: CredentialCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [showJWT, setShowJWT] = useState(false);
    const [showFullIds, setShowFullIds] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
    };

    const decodeJWT = () => {
        try {
            const parts = credential.jwt.split('.');
            if (parts.length !== 3) return null;

            const decode = (str: string) => {
                const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
                const padding = '='.repeat((4 - base64.length % 4) % 4);
                return JSON.parse(atob(base64 + padding));
            };

            return {
                header: decode(parts[0]),
                payload: decode(parts[1]),
            };
        } catch {
            return null;
        }
    };

    return (
        <Card size="3">
            <Flex direction="column" gap="3">
                {/* Header */}
                <Flex justify="between" align="center">
                    <Flex align="center" gap="2">
                        <Badge color="blue" size="2">
                            {credential.type}
                        </Badge>
                        {decodeJWT()?.header?.alg === "none" && (
                            <Badge color="orange" size="1">
                                Unsigned Demo
                            </Badge>
                        )}
                    </Flex>
                    <Text size="1" color="gray">
                        {formatDate(credential.issuedAt)}
                    </Text>
                </Flex>

                <Separator size="4" />

                <Flex direction="column" gap="2">
                    <Box>
                        <Flex justify="between" align="center">
                            <Text size="2" weight="bold">
                                Issuer
                            </Text>
                            <Button
                                variant="ghost"
                                size="1"
                                onClick={() => setShowFullIds(!showFullIds)}
                            >
                                {showFullIds ? "Hide" : "Show"} Full
                            </Button>
                        </Flex>
                        <Text
                            size="2"
                            style={{
                                wordBreak: "break-all",
                                fontFamily: showFullIds ? "monospace" : "inherit",
                                fontSize: showFullIds ? "11px" : "inherit"
                            }}
                        >
                            {showFullIds ? credential.issuer : `${credential.issuer.substring(0, 40)}...`}
                        </Text>
                    </Box>

                    <Box>
                        <Text size="2" weight="bold">
                            Subject
                        </Text>
                        <Text
                            size="2"
                            style={{
                                wordBreak: "break-all",
                                fontFamily: showFullIds ? "monospace" : "inherit",
                                fontSize: showFullIds ? "11px" : "inherit"
                            }}
                        >
                            {showFullIds ? credential.subject : `${credential.subject.substring(0, 40)}...`}
                        </Text>
                    </Box>
                </Flex>

                {Object.keys(credential.claims).length > 0 && (
                    <Box>
                        <Button
                            variant="ghost"
                            size="2"
                            onClick={() => setShowDetails(!showDetails)}
                        >
                            {showDetails ? "▼" : "▶"} Claims ({Object.keys(credential.claims).length})
                        </Button>
                        {showDetails && (
                            <Box
                                mt="2"
                                p="3"
                                style={{
                                    background: "var(--gray-3)",
                                    borderRadius: "8px",
                                }}
                            >
                                <Flex direction="column" gap="2">
                                    {Object.entries(credential.claims).map(([key, value]) => (
                                        <Box key={key}>
                                            <Text size="1" weight="bold" color="gray">{key}</Text>
                                            <Text size="2" style={{ display: "block", marginTop: "2px" }}>
                                                {String(value)}
                                            </Text>
                                        </Box>
                                    ))}
                                </Flex>
                            </Box>
                        )}
                    </Box>
                )}

                <Box>
                    <Button
                        variant="ghost"
                        size="2"
                        onClick={() => setShowJWT(!showJWT)}
                    >
                        {showJWT ? "▼" : "▶"} JWT Token
                    </Button>
                    {showJWT && (
                        <Box mt="2">
                            <Box
                                p="3"
                                style={{
                                    background: "var(--gray-3)",
                                    borderRadius: "8px",
                                    maxHeight: "200px",
                                    overflow: "auto",
                                }}
                            >
                                <Text
                                    size="1"
                                    style={{
                                        fontFamily: "monospace",
                                        wordBreak: "break-all",
                                        fontSize: "10px"
                                    }}
                                >
                                    {credential.jwt}
                                </Text>
                            </Box>
                            <Flex gap="2" mt="2">
                                <Button
                                    variant="soft"
                                    size="1"
                                    onClick={() => copyToClipboard(credential.jwt, "JWT")}
                                >
                                    📋 Copy JWT
                                </Button>
                                <Button
                                    variant="soft"
                                    size="1"
                                    onClick={() => {
                                        const decoded = decodeJWT();
                                        if (decoded) {
                                            copyToClipboard(
                                                JSON.stringify(decoded.payload, null, 2),
                                                "Credential JSON"
                                            );
                                        }
                                    }}
                                >
                                    📋 Copy JSON
                                </Button>
                            </Flex>
                        </Box>
                    )}
                </Box>

                <Separator size="4" />

                <Flex gap="2">
                    {onVerify && (
                        <Button variant="soft" size="2" onClick={onVerify} style={{ flex: 1 }}>
                            🔍 Verify
                        </Button>
                    )}
                    {onCreatePresentation && (
                        <Button
                            variant="solid"
                            size="2"
                            onClick={onCreatePresentation}
                            style={{ flex: 1 }}
                        >
                            🎯 Create Presentation
                        </Button>
                    )}
                </Flex>
            </Flex>
        </Card>
    );
}
