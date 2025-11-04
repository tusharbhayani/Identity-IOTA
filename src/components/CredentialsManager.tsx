import React, { useState } from 'react';
import {
    Box,
    Card,
    Flex,
    Heading,
    Text,
    Button,
    Badge,
    Separator,
    Grid
} from "@radix-ui/themes";
import {
    PlusIcon,
    EyeOpenIcon,
    Share1Icon,
    CalendarIcon,
    TrashIcon
} from "@radix-ui/react-icons";
import { MigrationCredentialForm } from './MigrationCredentialForm';
import { CredentialQRCode } from './CredentialQRCode';
import { StoredCredential } from './CreatePresentationForm';

interface CredentialIssuanceData {
    type: string;
    id: string;
    customFields: Record<string, string>;
}

interface CredentialIssuanceResult {
    credentialJwt?: string;
    credentialOffer?: unknown;
    qrCodeUrl?: string;
    httpUrl?: string;
    preAuthorizedCode?: string;
    w3cCredential?: unknown;
}

interface CredentialsManagerProps {
    didDocument: import("@iota/identity-wasm/web").IotaDocument | null;
    credentials: StoredCredential[];
    showMigrationForm: boolean;
    onShowMigrationForm: () => void;
    onHideMigrationForm: () => void;
    onIssueCredential: (data: CredentialIssuanceData) => Promise<CredentialIssuanceResult>;
    onCredentialSelect: (cred: StoredCredential) => void;
    onCredentialDelete: (cred: StoredCredential) => void;
}

export const CredentialsManager: React.FC<CredentialsManagerProps> = ({
    didDocument,
    credentials,
    showMigrationForm,
    onShowMigrationForm,
    onHideMigrationForm,
    onIssueCredential,
    onCredentialSelect,
    onCredentialDelete
}) => {
    const [showQRCode, setShowQRCode] = useState<{
        credentialOffer: unknown;
        qrCodeUrl: string;
        httpUrl: string;
        credentialType: string;
    } | null>(null);
    const [isIssuing, setIsIssuing] = useState(false);
    const [credentialToDelete, setCredentialToDelete] = useState<StoredCredential | null>(null);

    const handleIssueCredential = async (data: CredentialIssuanceData) => {
        setIsIssuing(true);
        try {
            const result = await onIssueCredential(data);

            if (result && result.qrCodeUrl) {
                setShowQRCode({
                    credentialOffer: result.credentialOffer || {},
                    qrCodeUrl: result.qrCodeUrl,
                    httpUrl: result.httpUrl || '',
                    credentialType: data.type
                });
            } else {
                console.warn("⚠️ CredentialsManager: No QR code data in result:", result);
            }
        } catch (error) {
            console.error('❌ CredentialsManager: Failed to issue credential:', error);
            throw error;
        } finally {
            setIsIssuing(false);
        }
    };

    const getCredentialTypeColor = (type: string) => {
        switch (type) {
            case 'MigrationIdentity': return 'blue';
            case 'WorkPermit': return 'green';
            case 'HealthRecord': return 'red';
            case 'SkillCertification': return 'purple';
            default: return 'gray';
        }
    };

    const getCredentialEmoji = (type: string) => {
        switch (type) {
            case 'MigrationIdentity': return '🛂';
            case 'WorkPermit': return '💼';
            case 'HealthRecord': return '🏥';
            case 'SkillCertification': return '🎓';
            default: return '🎫';
        }
    };

    const handleDeleteCredential = (credential: StoredCredential) => {
        setCredentialToDelete(credential);
    };

    const confirmDelete = () => {
        if (credentialToDelete) {
            onCredentialDelete(credentialToDelete);
            setCredentialToDelete(null);
        }
    };

    const cancelDelete = () => {
        setCredentialToDelete(null);
    };

    return (
        <Box>
            <Flex direction="column" gap="6">
                <Flex justify="between" align="center">
                    <Box>
                        <Heading size="5">🎫 Credentials Manager</Heading>
                        <Text color="gray">Issue and manage your verifiable credentials</Text>
                    </Box>
                    <Button
                        onClick={onShowMigrationForm}
                        disabled={!didDocument || isIssuing}
                        loading={isIssuing}
                    >
                        <PlusIcon width="16" height="16" />
                        Issue New Credential
                    </Button>
                </Flex>

                {showMigrationForm && didDocument && (
                    <Card style={{ border: '2px solid var(--blue-6)' }}>
                        <Box p="6">
                            <Flex align="center" gap="2" mb="4">
                                <Text style={{ fontSize: '24px' }}>➕</Text>
                                <Heading size="4">Issue New Credential</Heading>
                            </Flex>
                            <MigrationCredentialForm
                                onSubmit={handleIssueCredential}
                                onCancel={onHideMigrationForm}
                            />
                        </Box>
                    </Card>
                )}

                {showQRCode && (
                    <Box>
                        <CredentialQRCode
                            credentialOffer={showQRCode.credentialOffer as import('../services/unicore/openid4vci').CredentialOffer}
                            qrCodeUrl={showQRCode.qrCodeUrl}
                            httpUrl={showQRCode.httpUrl}
                            credentialType={showQRCode.credentialType}
                            onClose={() => setShowQRCode(null)}
                        />
                    </Box>
                )}

                {credentials.length > 0 ? (
                    <Box>
                        <Flex align="center" gap="2" mb="4">
                            <Text style={{ fontSize: '24px' }}>📚</Text>
                            <Heading size="4">Your Credentials ({credentials.length})</Heading>
                        </Flex>
                        <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
                            {credentials.map((credential, index) => (
                                <Card key={index} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <Box p="4">
                                        <Flex direction="column" gap="3">
                                            <Flex justify="between" align="start">
                                                <Flex align="center" gap="3">
                                                    <Text style={{ fontSize: '32px' }}>
                                                        {getCredentialEmoji(credential.type)}
                                                    </Text>
                                                    <Box>
                                                        <Text weight="bold" size="3">{credential.type}</Text>
                                                        <Badge color={getCredentialTypeColor(credential.type)} size="1">
                                                            Verifiable Credential
                                                        </Badge>
                                                    </Box>
                                                </Flex>
                                                <Button
                                                    size="1"
                                                    variant="soft"
                                                    onClick={() => onCredentialSelect(credential)}
                                                >
                                                    <EyeOpenIcon width="12" height="12" />
                                                </Button>
                                            </Flex>

                                            <Separator />

                                            <Box>
                                                <Flex align="center" gap="2" mb="2">
                                                    <CalendarIcon width="14" height="14" />
                                                    <Text size="2" color="gray">
                                                        Issued: {new Date(credential.issuedAt).toLocaleDateString()}
                                                    </Text>
                                                </Flex>
                                                <Text size="1" color="gray" style={{ wordBreak: 'break-all' }}>
                                                    Issuer: {credential.issuer.substring(0, 30)}...
                                                </Text>
                                            </Box>

                                            <Flex gap="2">
                                                <Button size="1" variant="soft" style={{ flex: 1 }}>
                                                    <Share1Icon width="12" height="12" />
                                                    Share
                                                </Button>
                                                <Button
                                                    size="1"
                                                    variant="outline"
                                                    onClick={() => onCredentialSelect(credential)}
                                                    style={{ flex: 1 }}
                                                >
                                                    View Details
                                                </Button>
                                                <Button
                                                    size="1"
                                                    variant="soft"
                                                    color="red"
                                                    onClick={() => handleDeleteCredential(credential)}
                                                >
                                                    <TrashIcon width="12" height="12" />
                                                </Button>
                                            </Flex>
                                        </Flex>
                                    </Box>
                                </Card>
                            ))}
                        </Grid>
                    </Box>
                ) : (
                    <Card style={{ textAlign: 'center' }}>
                        <Box p="8">
                            <Text style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>🎫</Text>
                            <Heading size="4" mb="2">No Credentials Yet</Heading>
                            <Text color="gray" mb="4">
                                Issue your first verifiable credential to get started with your digital identity wallet
                            </Text>
                            <Button
                                onClick={onShowMigrationForm}
                                disabled={!didDocument}
                                size="3"
                            >
                                <PlusIcon width="16" height="16" />
                                Issue First Credential
                            </Button>
                            {!didDocument && (
                                <Text size="2" color="gray" mt="3" style={{ display: 'block' }}>
                                    💡 Create an identity first in the Dashboard tab
                                </Text>
                            )}
                        </Box>
                    </Card>
                )}

                {credentialToDelete && (
                    <Box
                        position="fixed"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        style={{
                            background: 'rgba(0, 0, 0, 0.8)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem'
                        }}
                        onClick={cancelDelete}
                    >
                        <Card
                            style={{
                                maxWidth: '400px',
                                width: '100%',
                                border: '2px solid var(--red-6)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Box p="6">
                                <Flex direction="column" gap="4">
                                    <Flex align="center" gap="3">
                                        <Text style={{ fontSize: '32px' }}>⚠️</Text>
                                        <Box>
                                            <Heading size="4" color="red">Delete Credential</Heading>
                                            <Text size="2" color="gray">This action cannot be undone</Text>
                                        </Box>
                                    </Flex>

                                    <Box p="3" style={{ background: 'var(--red-2)', borderRadius: '6px' }}>
                                        <Text size="2" weight="bold" mb="1">Credential to delete:</Text>
                                        <Text size="2">{credentialToDelete.type}</Text>
                                        <Text size="1" color="gray">
                                            Issued: {new Date(credentialToDelete.issuedAt).toLocaleDateString()}
                                        </Text>
                                    </Box>

                                    <Text size="2" color="red">
                                        Are you sure you want to delete this credential? This will permanently remove it from your wallet.
                                    </Text>

                                    <Flex gap="3" justify="end">
                                        <Button
                                            variant="soft"
                                            color="gray"
                                            onClick={cancelDelete}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="solid"
                                            color="red"
                                            onClick={confirmDelete}
                                        >
                                            <TrashIcon width="14" height="14" />
                                            Delete Credential
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Box>
                        </Card>
                    </Box>
                )}
            </Flex>
        </Box>
    );
};