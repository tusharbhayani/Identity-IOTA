import React from 'react';
import { Box, Card, Flex, Heading, Text, Button, Badge, Separator } from '@radix-ui/themes';
import QRCode from 'react-qr-code';
import { CredentialOffer } from '../services/unicore/openid4vci';

interface CredentialQRCodeProps {
    credentialOffer: CredentialOffer;
    qrCodeUrl: string;
    httpUrl: string;
    credentialType: string;
    onClose: () => void;
}

export const CredentialQRCode: React.FC<CredentialQRCodeProps> = ({
    credentialOffer,
    qrCodeUrl,
    httpUrl,
    credentialType,
    onClose
}) => {
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };


    const credentialIssuer = String(credentialOffer?.credential_issuer || 'Unknown Issuer');
    const supportedTypes = credentialOffer?.credentials?.[0]?.types || [credentialType];
    const credentialId = String(credentialOffer?.id || 'Unknown ID');

    const safeTypes = Array.isArray(supportedTypes)
        ? supportedTypes.map(type => String(type))
        : [String(credentialType)];

    return (
        <Card style={{ border: '2px solid var(--green-6)' }}>
            <Box p="6">
                <Flex direction="column" gap="5">
                    <Flex justify="between" align="center">
                        <Flex align="center" gap="2">
                            <Text style={{ fontSize: '24px' }}>📱</Text>
                            <Heading size="4">Scan with Unime Wallet</Heading>
                        </Flex>
                        <Button variant="soft" color="gray" onClick={onClose}>
                            ✕ Close
                        </Button>
                    </Flex>

                    <Separator />

                    <Flex direction="column" align="center" gap="4">
                        <Flex align="center" gap="2">
                            <Badge color="green" size="2">{credentialType}</Badge>
                            <Badge color="blue" size="1">OpenID4VCI</Badge>
                            <Badge color="purple" size="1">W3C VC</Badge>
                        </Flex>

                        <Box
                            style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '12px',
                                border: '2px solid var(--gray-4)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <QRCode
                                size={220}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={qrCodeUrl}
                                viewBox={`0 0 220 220`}
                            />
                        </Box>

                        <Text size="2" color="gray" align="center" style={{ maxWidth: '300px' }}>
                            📲 Scan this QR code with your Unime wallet to receive the W3C Verifiable Credential
                        </Text>
                    </Flex>

                    <Separator />

                    <Flex direction="column" gap="4">
                        <Box>
                            <Flex align="center" gap="2" mb="2">
                                <Text style={{ fontSize: '16px' }}>🔗</Text>
                                <Text size="2" weight="bold">OpenID4VCI URL:</Text>
                            </Flex>
                            <Flex gap="2">
                                <Box
                                    style={{
                                        wordBreak: 'break-all',
                                        background: 'var(--gray-3)',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        flex: 1,
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        border: '1px solid var(--gray-5)'
                                    }}
                                >
                                    <Text size="1">{qrCodeUrl}</Text>
                                </Box>
                                <Button
                                    size="2"
                                    variant="soft"
                                    onClick={() => copyToClipboard(qrCodeUrl)}
                                >
                                    📋 Copy
                                </Button>
                            </Flex>
                        </Box>

                        <Box>
                            <Flex align="center" gap="2" mb="2">
                                <Text style={{ fontSize: '16px' }}>🌐</Text>
                                <Text size="2" weight="bold">HTTP URL:</Text>
                            </Flex>
                            <Flex gap="2">
                                <Box
                                    style={{
                                        wordBreak: 'break-all',
                                        background: 'var(--gray-3)',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        flex: 1,
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        border: '1px solid var(--gray-5)'
                                    }}
                                >
                                    <Text size="1">{httpUrl}</Text>
                                </Box>
                                <Button
                                    size="2"
                                    variant="soft"
                                    onClick={() => copyToClipboard(httpUrl)}
                                >
                                    📋 Copy
                                </Button>
                            </Flex>
                        </Box>
                    </Flex>

                    <Separator />

                    <Box p="4" style={{ background: 'var(--blue-2)', borderRadius: '8px', border: '1px solid var(--blue-4)' }}>
                        <Flex direction="column" gap="3">
                            <Flex align="center" gap="2">
                                <Text style={{ fontSize: '16px' }}>🏛️</Text>
                                <Text size="2" weight="bold" color="blue">Credential Information</Text>
                            </Flex>

                            <Flex direction="column" gap="2">
                                <Flex justify="between">
                                    <Text size="2" color="gray">Issuer:</Text>
                                    <Text size="2" style={{ wordBreak: 'break-all', maxWidth: '200px', textAlign: 'right' }}>
                                        {credentialIssuer}
                                    </Text>
                                </Flex>

                                <Flex justify="between">
                                    <Text size="2" color="gray">Type:</Text>
                                    <Text size="2" weight="bold">{credentialType}</Text>
                                </Flex>

                                <Flex justify="between">
                                    <Text size="2" color="gray">Supported Types:</Text>
                                    <Text size="2">{safeTypes.join(', ')}</Text>
                                </Flex>

                                <Flex justify="between">
                                    <Text size="2" color="gray">Credential ID:</Text>
                                    <Text size="1" style={{ fontFamily: 'monospace', maxWidth: '150px', wordBreak: 'break-all' }}>
                                        {credentialId}
                                    </Text>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Box>

                    <Box p="4" style={{ background: 'var(--green-2)', borderRadius: '8px', border: '1px solid var(--green-4)' }}>
                        <Flex align="center" gap="2" mb="2">
                            <Text style={{ fontSize: '16px' }}>💡</Text>
                            <Text size="2" weight="bold" color="green">How to use:</Text>
                        </Flex>
                        <Flex direction="column" gap="1">
                            <Text size="2" color="green">1. Open your Unime wallet app</Text>
                            <Text size="2" color="green">2. Tap "Scan QR Code" or similar option</Text>
                            <Text size="2" color="green">3. Point your camera at the QR code above</Text>
                            <Text size="2" color="green">4. Follow the prompts to accept the credential</Text>
                        </Flex>
                    </Box>
                </Flex>
            </Box>
        </Card>
    );
};