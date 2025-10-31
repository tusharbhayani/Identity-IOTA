import { Badge, Box, Button, Card, Flex, Heading, Text, Separator } from "@radix-ui/themes";
import { useState } from "react";
import QRCode from "react-qr-code";
import { StoredInvitation } from "../services/invitationService";

export interface InvitationDisplayProps {
    invitation: StoredInvitation;
    onClose?: () => void;
}

export function InvitationDisplay({ invitation, onClose }: InvitationDisplayProps) {
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    const getStatusColor = (status: StoredInvitation["status"]) => {
        switch (status) {
            case "pending":
                return "orange";
            case "accepted":
                return "green";
            case "rejected":
                return "red";
            case "expired":
                return "gray";
            default:
                return "gray";
        }
    };

    const getStatusIcon = (status: StoredInvitation["status"]) => {
        switch (status) {
            case "pending":
                return "⏳";
            case "accepted":
                return "✅";
            case "rejected":
                return "❌";
            case "expired":
                return "⏰";
            default:
                return "❓";
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const isExpired = new Date(invitation.expiresAt) < new Date();

    return (
        <Card size="3" style={{ width: "100%", maxWidth: "600px" }}>
            <Flex direction="column" gap="4">
                <Flex justify="between" align="center">
                    <Heading size="5">🎫 Credential Invitation</Heading>
                    {onClose && (
                        <Button variant="ghost" size="1" onClick={onClose}>
                            ✕
                        </Button>
                    )}
                </Flex>

                <Flex gap="2" align="center">
                    <Badge color={getStatusColor(invitation.status)} size="2">
                        {getStatusIcon(invitation.status)} {invitation.status.toUpperCase()}
                    </Badge>
                    <Text size="1" color="gray">
                        ID: {invitation.id}
                    </Text>
                </Flex>

                <Box>
                    <Text size="2" weight="bold" mb="3">
                        📱 QR Code for Mobile Wallets
                    </Text>
                    <Flex justify="center" mb="3">
                        <Box
                            p="3"
                            style={{
                                background: "white",
                                borderRadius: "8px",
                                display: "inline-block",
                                border: "2px solid var(--gray-4)",
                            }}
                        >
                            <QRCode
                                value={invitation.httpUrl}
                                size={220}
                                level="M"
                            />
                        </Box>
                    </Flex>
                    <Text size="1" color="gray" style={{ textAlign: "center", display: "block" }}>
                        Scan with your SSI wallet to receive the credential
                    </Text>
                </Box>

                <Separator size="4" />

                <Box>
                    <Text size="2" weight="bold" mb="2">
                        🔗 Manual Entry URLs
                    </Text>

                    <Box mb="3">
                        <Text size="1" weight="bold" color="gray" mb="1">
                            HTTP URL (for manual wallet entry or testing):
                        </Text>
                        <Box
                            p="2"
                            style={{
                                background: "var(--gray-3)",
                                borderRadius: "6px",
                                fontFamily: "monospace",
                                fontSize: "11px",
                                wordBreak: "break-all",
                                maxHeight: "80px",
                                overflow: "auto",
                            }}
                        >
                            {invitation.httpUrl}
                        </Box>
                        <Button
                            size="2"
                            variant="soft"
                            onClick={() => copyToClipboard(invitation.httpUrl, "HTTP URL")}
                            style={{ marginTop: "6px" }}
                        >
                            {copied === "HTTP URL" ? "✅ Copied!" : "📋 Copy URL"}
                        </Button>
                    </Box>

                    <Box>
                        <Text size="1" weight="bold" color="gray" mb="1">
                            Deep Link (for direct app routing):
                        </Text>
                        <Box
                            p="2"
                            style={{
                                background: "var(--gray-3)",
                                borderRadius: "6px",
                                fontFamily: "monospace",
                                fontSize: "10px",
                                wordBreak: "break-all",
                                maxHeight: "60px",
                                overflow: "auto",
                            }}
                        >
                            {invitation.invitationUrl}
                        </Box>
                        <Button
                            size="2"
                            variant="soft"
                            onClick={() => copyToClipboard(invitation.invitationUrl, "Deep Link")}
                            style={{ marginTop: "6px" }}
                        >
                            {copied === "Deep Link" ? "✅ Copied!" : "📋 Copy Link"}
                        </Button>
                    </Box>
                </Box>

                <Separator size="4" />

                {/* Timeline */}
                <Box>
                    <Text size="2" weight="bold" mb="2">
                        ⏱️ Expiration
                    </Text>
                    <Flex direction="column" gap="2">
                        <Flex justify="between" align="center">
                            <Text size="2">Created:</Text>
                            <Text size="2" color="gray">{formatDate(invitation.createdAt)}</Text>
                        </Flex>
                        <Flex justify="between" align="center">
                            <Text size="2">Expires:</Text>
                            <Text size="2" color={isExpired ? "red" : "gray"}>
                                {formatDate(invitation.expiresAt)}
                                {isExpired && " (Expired)"}
                            </Text>
                        </Flex>
                    </Flex>
                </Box>

                <Box>
                    <Text size="2" weight="bold" mb="2">
                        🏷️ Credential Details
                    </Text>
                    <Box
                        p="3"
                        style={{
                            background: "var(--gray-3)",
                            borderRadius: "8px",
                        }}
                    >
                        <Flex direction="column" gap="2">
                            <Flex justify="between">
                                <Text size="2" weight="bold">Type:</Text>
                                <Text size="2">{invitation.credentialType}</Text>
                            </Flex>
                            <Flex justify="between">
                                <Text size="2" weight="bold">Issuer:</Text>
                                <Text size="2" style={{ fontFamily: "monospace", fontSize: "11px" }}>
                                    {invitation.issuerDID ? invitation.issuerDID.substring(0, 35) + "..." : "Unknown"}
                                </Text>
                            </Flex>
                        </Flex>
                    </Box>
                </Box>

                {invitation.credentialJwt && (
                    <>
                        <Separator size="4" />
                        <Box>
                            <Text size="2" weight="bold" mb="2">
                                📄 Credential JWT
                            </Text>
                            <Box
                                p="2"
                                style={{
                                    background: "var(--gray-3)",
                                    borderRadius: "6px",
                                    fontFamily: "monospace",
                                    fontSize: "10px",
                                    wordBreak: "break-all",
                                    maxHeight: "100px",
                                    overflow: "auto",
                                }}
                            >
                                {invitation.credentialJwt}
                            </Box>
                            <Button
                                size="2"
                                variant="soft"
                                onClick={() => copyToClipboard(invitation.credentialJwt!, "Credential JWT")}
                                style={{ marginTop: "6px" }}
                            >
                                {copied === "Credential JWT" ? "✅ Copied!" : "📋 Copy JWT"}
                            </Button>
                        </Box>
                    </>
                )}
            </Flex>
        </Card>
    );
}
