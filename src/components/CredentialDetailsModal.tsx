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
    Tabs
} from "@radix-ui/themes";
import {
    Cross2Icon,
    EyeOpenIcon,
    Share1Icon,
    DownloadIcon
} from "@radix-ui/react-icons";
import { CredentialQRCode } from './CredentialQRCode';
import { StoredCredential } from './CreatePresentationForm';
import { migrationIdentityService } from '../services/migrationIdentityService';

interface CredentialDetailsModalProps {
    credential: StoredCredential;
    didDocument: import("@iota/identity-wasm/web").IotaDocument | null;
    identityStorage: import("@iota/identity-wasm/web").Storage | null;
    verificationFragment: string;
    onClose: () => void;
}

export const CredentialDetailsModal: React.FC<CredentialDetailsModalProps> = ({
    credential,
    didDocument,
    identityStorage,
    verificationFragment,
    onClose
}) => {
    const [showQRCode, setShowQRCode] = useState(false);
    const [qrCodeData, setQRCodeData] = useState<{
        credentialOffer: unknown;
        qrCodeUrl: string;
        httpUrl: string;
    } | null>(null);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);

    const handleGenerateQRCode = async () => {
        setIsGeneratingQR(true);
        try {
            if (didDocument && identityStorage) {
                const result = await migrationIdentityService.issueMigrationCredential(
                    didDocument,
                    identityStorage,
                    verificationFragment,
                    {
                        type: credential.type,
                        holder: {
                            name: credential.claims?.name as string || 'Unknown',
                            dateOfBirth: credential.claims?.dateOfBirth as string || '1990-01-01',
                            nationality: credential.claims?.nationality as string || 'Unknown',
                            passportNumber: credential.claims?.passportNumber as string,
                            occupation: credential.claims?.occupation as string,
                            employerId: credential.claims?.employerId as string,
                        },
                        claims: credential.claims || {},
                        issuanceDate: credential.issuedAt,
                        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    }
                );

                if (result.qrCodeUrl) {
                    setQRCodeData({
                        credentialOffer: result.credentialOffer || {},
                        qrCodeUrl: result.qrCodeUrl,
                        httpUrl: result.httpUrl || ''
                    });
                    setShowQRCode(true);
                } else {
                    throw new Error('No QR code URL returned from service');
                }
            } else {
                const simpleQRUrl = `credential-jwt://${credential.jwt}`;
                const mockCredentialOffer = {
                    credential_issuer: credential.issuer,
                    credentials: [{
                        format: 'jwt_vc' as const,
                        types: [credential.type]
                    }]
                };

                setQRCodeData({
                    credentialOffer: mockCredentialOffer,
                    qrCodeUrl: simpleQRUrl,
                    httpUrl: simpleQRUrl
                });
                setShowQRCode(true);
            }
        } catch (error) {
            console.error('❌ Failed to generate QR code:', error);
            alert(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsGeneratingQR(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
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

    return (
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
            onClick={onClose}
        >
            <Box
                style={{
                    background: 'var(--color-panel-solid)',
                    borderRadius: '12px',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    border: '1px solid var(--gray-6)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <Box p="6">
                    <Flex justify="between" align="center" mb="4">
                        <Flex align="center" gap="3">
                            <Text style={{ fontSize: '32px' }}>
                                {getCredentialEmoji(credential.type)}
                            </Text>
                            <Box>
                                <Heading size="4">Credential Details</Heading>
                                <Badge color={getCredentialTypeColor(credential.type)} size="2">
                                    {credential.type}
                                </Badge>
                            </Box>
                        </Flex>
                        <Button
                            variant="soft"
                            color="gray"
                            onClick={onClose}
                        >
                            <Cross2Icon width="16" height="16" />
                            Close
                        </Button>
                    </Flex>

                    <Separator mb="4" />

                    {showQRCode && qrCodeData ? (
                        <Box mb="6">
                            <CredentialQRCode
                                credentialOffer={qrCodeData.credentialOffer as import('../services/unicore/openid4vci').CredentialOffer}
                                qrCodeUrl={qrCodeData.qrCodeUrl}
                                httpUrl={qrCodeData.httpUrl}
                                credentialType={credential.type}
                                onClose={() => setShowQRCode(false)}
                            />
                        </Box>
                    ) : (
                        <Card mb="6" style={{ border: '2px dashed var(--gray-6)' }}>
                            <Box p="6" style={{ textAlign: 'center' }}>
                                <Text style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📱</Text>
                                <Heading size="3" mb="2">Generate QR Code</Heading>
                                <Text color="gray" mb="4">
                                    Create a QR code to share this credential with your mobile wallet
                                </Text>
                                <Button
                                    onClick={handleGenerateQRCode}
                                    loading={isGeneratingQR}
                                    size="3"
                                >
                                    <Share1Icon width="16" height="16" />
                                    Generate QR Code
                                </Button>
                                {!didDocument || !identityStorage ? (
                                    <Text size="1" color="orange" mt="2" style={{ display: 'block' }}>
                                        ⚠️ Will use fallback mode (create identity for full features)
                                    </Text>
                                ) : null}
                            </Box>
                        </Card>
                    )}

                    <Tabs.Root defaultValue="overview">
                        <Tabs.List>
                            <Tabs.Trigger value="overview">
                                <EyeOpenIcon width="14" height="14" />
                                Overview
                            </Tabs.Trigger>
                            <Tabs.Trigger value="claims">
                                📋 Claims
                            </Tabs.Trigger>
                            <Tabs.Trigger value="jwt">
                                🔐 JWT
                            </Tabs.Trigger>
                        </Tabs.List>

                        <Box pt="4">
                            <Tabs.Content value="overview">
                                <Card>
                                    <Box p="4">
                                        <Flex direction="column" gap="4">
                                            <Box>
                                                <Text size="2" weight="bold" color="gray" mb="2">Credential Type:</Text>
                                                <Text size="3" weight="bold">{credential.type}</Text>
                                            </Box>

                                            <Box>
                                                <Text size="2" weight="bold" color="gray" mb="2">Issued At:</Text>
                                                <Text size="3">{new Date(credential.issuedAt).toLocaleString()}</Text>
                                            </Box>

                                            <Box>
                                                <Text size="2" weight="bold" color="gray" mb="2">Issuer:</Text>
                                                <Flex gap="2" align="center">
                                                    <Box
                                                        style={{
                                                            background: 'var(--gray-3)',
                                                            padding: '8px 12px',
                                                            borderRadius: '6px',
                                                            fontFamily: 'monospace',
                                                            fontSize: '12px',
                                                            wordBreak: 'break-all',
                                                            flex: 1,
                                                            border: '1px solid var(--gray-5)'
                                                        }}
                                                    >
                                                        <Text size="1">{credential.issuer}</Text>
                                                    </Box>
                                                    <Button
                                                        size="1"
                                                        variant="soft"
                                                        onClick={() => copyToClipboard(credential.issuer)}
                                                    >
                                                        📋
                                                    </Button>
                                                </Flex>
                                            </Box>

                                            <Box>
                                                <Text size="2" weight="bold" color="gray" mb="2">Subject:</Text>
                                                <Flex gap="2" align="center">
                                                    <Box
                                                        style={{
                                                            background: 'var(--gray-3)',
                                                            padding: '8px 12px',
                                                            borderRadius: '6px',
                                                            fontFamily: 'monospace',
                                                            fontSize: '12px',
                                                            wordBreak: 'break-all',
                                                            flex: 1,
                                                            border: '1px solid var(--gray-5)'
                                                        }}
                                                    >
                                                        <Text size="1">{credential.subject}</Text>
                                                    </Box>
                                                    <Button
                                                        size="1"
                                                        variant="soft"
                                                        onClick={() => copyToClipboard(credential.subject)}
                                                    >
                                                        📋
                                                    </Button>
                                                </Flex>
                                            </Box>
                                        </Flex>
                                    </Box>
                                </Card>
                            </Tabs.Content>

                            <Tabs.Content value="claims">
                                <Card>
                                    <Box p="4">
                                        <Flex direction="column" gap="3">
                                            {credential.claims && Object.keys(credential.claims).length > 0 ? (
                                                Object.entries(credential.claims).map(([key, value]) => (
                                                    <Box key={key}>
                                                        <Text size="2" weight="bold" color="gray" mb="1">{key}:</Text>
                                                        <Text size="2">{String(value)}</Text>
                                                    </Box>
                                                ))
                                            ) : (
                                                <Text color="gray" style={{ textAlign: 'center', padding: '2rem' }}>
                                                    No additional claims available
                                                </Text>
                                            )}
                                        </Flex>
                                    </Box>
                                </Card>
                            </Tabs.Content>

                            <Tabs.Content value="jwt">
                                <Card>
                                    <Box p="4">
                                        <Flex justify="between" align="center" mb="3">
                                            <Text size="2" weight="bold">JSON Web Token:</Text>
                                            <Flex gap="2">
                                                <Button
                                                    size="1"
                                                    variant="soft"
                                                    onClick={() => copyToClipboard(credential.jwt)}
                                                >
                                                    📋 Copy JWT
                                                </Button>
                                                <Button
                                                    size="1"
                                                    variant="soft"
                                                    onClick={() => {
                                                        const blob = new Blob([credential.jwt], { type: 'text/plain' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `${credential.type}-credential.jwt`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                >
                                                    <DownloadIcon width="12" height="12" />
                                                    Download
                                                </Button>
                                            </Flex>
                                        </Flex>
                                        <Box
                                            style={{
                                                background: 'var(--gray-2)',
                                                borderRadius: '8px',
                                                fontFamily: 'monospace',
                                                fontSize: '11px',
                                                wordBreak: 'break-all',
                                                maxHeight: '300px',
                                                overflow: 'auto',
                                                border: '1px solid var(--gray-4)',
                                                padding: '12px'
                                            }}
                                        >
                                            <Text size="1" style={{ whiteSpace: 'pre-wrap' }}>
                                                {credential.jwt}
                                            </Text>
                                        </Box>
                                    </Box>
                                </Card>
                            </Tabs.Content>
                        </Box>
                    </Tabs.Root>
                </Box>
            </Box>
        </Box>
    );
};