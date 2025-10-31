import { useEffect, useState } from "react";
import { Badge, Box, Button, Card, Flex, Heading, Text, Separator } from "@radix-ui/themes";
import { InvitationDisplay } from "./InvitationDisplay";
import { invitationService, StoredInvitation } from "../services/invitationService";

export function InvitationsTab() {
    const [invitations, setInvitations] = useState<StoredInvitation[]>([]);
    const [selectedInvitation, setSelectedInvitation] = useState<StoredInvitation | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        refreshInvitations();
        const interval = setInterval(refreshInvitations, 30000);
        return () => clearInterval(interval);
    }, []);

    const refreshInvitations = () => {
        setIsRefreshing(true);
        try {
            invitationService.clearExpiredInvitations();
            const allInvitations = invitationService.getAllInvitations();
            setInvitations(allInvitations);
        } catch (error) {
            console.error("Failed to refresh invitations:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleClearInvitations = async () => {
        if (!window.confirm("Are you sure you want to clear all invitations? This action cannot be undone.")) {
            return;
        }

        setIsClearing(true);
        try {
            await invitationService.clearAllInvitations();
            setInvitations([]);
            setSelectedInvitation(null);
        } catch (error) {
            console.error("Failed to clear invitations:", error);
        } finally {
            setIsClearing(false);
        }
    };

    const getStatusBadgeColor = (status: StoredInvitation["status"]) => {
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

    const isInvitationExpired = (expiresAt: string) => {
        return new Date(expiresAt) < new Date();
    };

    if (selectedInvitation) {
        return (
            <Box>
                <InvitationDisplay
                    invitation={selectedInvitation}
                    onClose={() => setSelectedInvitation(null)}
                />
            </Box>
        );
    }

    return (
        <Flex direction="column" gap="4">
            <Flex justify="between" align="center">
                <Heading size="4">📨 Credential Invitations</Heading>
                <Flex gap="2">
                    <Button
                        size="2"
                        variant="soft"
                        onClick={refreshInvitations}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? "🔄 Refreshing..." : "🔄 Refresh"}
                    </Button>
                    {invitations.length > 0 && (
                        <Button
                            size="2"
                            variant="soft"
                            color="red"
                            onClick={handleClearInvitations}
                            disabled={isClearing}
                        >
                            {isClearing ? "🗑️ Clearing..." : "🗑️ Clear All"}
                        </Button>
                    )}
                </Flex>
            </Flex>

            {invitations.length === 0 ? (
                <Box
                    p="4"
                    style={{
                        background: "var(--gray-3)",
                        borderRadius: "8px",
                        textAlign: "center",
                    }}
                >
                    <Text size="3" color="gray">
                        No invitations yet. Issue a credential to generate invitations.
                    </Text>
                </Box>
            ) : (
                <Flex direction="column" gap="3">
                    {invitations.map((invitation) => (
                        <Card
                            key={invitation.id}
                            style={{
                                cursor: "pointer",
                                background:
                                    invitation.status === "expired"
                                        ? "var(--gray-2)"
                                        : "var(--gray-1)",
                            }}
                        >
                            <Flex
                                direction="column"
                                gap="3"
                                onClick={() => setSelectedInvitation(invitation)}
                            >
                                <Flex justify="between" align="center">
                                    <Flex direction="column" gap="1" style={{ flex: 1 }}>
                                        <Flex gap="2" align="center">
                                            <Heading size="3">
                                                {invitation.credentialType}
                                            </Heading>
                                            <Badge
                                                color={getStatusBadgeColor(invitation.status)}
                                                size="2"
                                            >
                                                {getStatusIcon(invitation.status)}{" "}
                                                {invitation.status.toUpperCase()}
                                            </Badge>
                                        </Flex>
                                        <Text size="1" color="gray">
                                            ID: {invitation.id}
                                        </Text>
                                    </Flex>
                                    <Button
                                        size="2"
                                        variant="solid"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedInvitation(invitation);
                                        }}
                                    >
                                        📋 View Details
                                    </Button>
                                </Flex>

                                <Separator size="3" />

                                <Flex gap="4" wrap="wrap">
                                    <Box>
                                        <Text size="1" weight="bold" color="gray">
                                            Created
                                        </Text>
                                        <Text size="2">
                                            {formatDate(invitation.createdAt)}
                                        </Text>
                                    </Box>

                                    <Box>
                                        <Text size="1" weight="bold" color="gray">
                                            Expires
                                        </Text>
                                        <Text
                                            size="2"
                                            color={isInvitationExpired(invitation.expiresAt) ? "red" : "gray"}
                                        >
                                            {formatDate(invitation.expiresAt)}
                                            {isInvitationExpired(invitation.expiresAt) && " (Expired)"}
                                        </Text>
                                    </Box>

                                    <Box>
                                        <Text size="1" weight="bold" color="gray">
                                            Issuer
                                        </Text>
                                        <Text size="1" style={{ fontFamily: "monospace" }}>
                                            {invitation.issuerDID ? invitation.issuerDID.substring(0, 40) + "..." : "Unknown"}
                                        </Text>
                                    </Box>
                                </Flex>

                                <Box>
                                    <Text size="1" weight="bold" color="gray" mb="1">
                                        Invitation URL:
                                    </Text>
                                    <Box
                                        p="2"
                                        style={{
                                            background: "var(--gray-3)",
                                            borderRadius: "6px",
                                            fontFamily: "monospace",
                                            fontSize: "10px",
                                            wordBreak: "break-all",
                                            maxHeight: "40px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {invitation.httpUrl}
                                    </Box>
                                </Box>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            )}

            {invitations.length > 0 && (
                <Box
                    p="3"
                    style={{
                        background: "var(--gray-3)",
                        borderRadius: "8px",
                        marginTop: "1rem",
                    }}
                >
                    <Flex gap="4" wrap="wrap">
                        <Box>
                            <Text size="1" weight="bold" color="gray">
                                Total
                            </Text>
                            <Text size="3" weight="bold">
                                {invitations.length}
                            </Text>
                        </Box>
                        <Box>
                            <Text size="1" weight="bold" color="gray">
                                Pending
                            </Text>
                            <Text size="3" weight="bold" color="orange">
                                {invitations.filter((i) => i.status === "pending").length}
                            </Text>
                        </Box>
                        <Box>
                            <Text size="1" weight="bold" color="gray">
                                Accepted
                            </Text>
                            <Text size="3" weight="bold" color="green">
                                {invitations.filter((i) => i.status === "accepted").length}
                            </Text>
                        </Box>
                        <Box>
                            <Text size="1" weight="bold" color="gray">
                                Expired
                            </Text>
                            <Text size="3" weight="bold" color="gray">
                                {invitations.filter((i) => i.status === "expired").length}
                            </Text>
                        </Box>
                    </Flex>
                </Box>
            )}
        </Flex>
    );
}
