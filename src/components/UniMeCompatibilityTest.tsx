import React, { useState } from 'react';
import { Box, Card, Flex, Heading, Text, Button, Badge, Separator } from '@radix-ui/themes';
import { openid4vciService } from '../services/unicore/openid4vci';
import { CredentialQRCode } from './CredentialQRCode';

export const UniMeCompatibilityTest: React.FC = () => {
    const [testResult, setTestResult] = useState<{
        credentialOffer: unknown;
        qrCodeUrl: string;
        httpUrl: string;
        isValid: boolean;
    } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const generateTestCredentialOffer = async () => {
        setIsGenerating(true);
        try {

            const flowTest = await openid4vciService.testCredentialFlow('MigrationIdentity');

            if (!flowTest.success) {
                throw new Error(`Flow test failed: ${flowTest.error}`);
            }


            const preAuthCode = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const credentialOffer = await openid4vciService.createCredentialOffer(
                ['MigrationIdentity'],
                preAuthCode
            );

            const qrCodeUrl = await openid4vciService.generateQRCodeUrl(credentialOffer);
            const httpUrl = openid4vciService.generateHttpUrl(credentialOffer);

            const isValid = openid4vciService.validateCredentialOffer(credentialOffer);

            setTestResult({
                credentialOffer,
                qrCodeUrl,
                httpUrl,
                isValid
            });

        } catch (error) {
            console.error('❌ Failed to generate test credential offer:', error);
            alert(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const analyzeQRFormat = () => {
        if (!testResult) return null;

        const { qrCodeUrl, credentialOffer } = testResult;

        return (
            <Box>
                <Heading size="3" mb="3">🔍 QR Code Analysis</Heading>

                <Flex direction="column" gap="3">
                    <Box>
                        <Text size="2" weight="bold" color="gray">QR URL Format:</Text>
                        <Text size="1" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {qrCodeUrl}
                        </Text>
                        <Badge color={qrCodeUrl.startsWith('openid-credential-offer://') ? 'green' : 'red'} size="1" mt="1">
                            {qrCodeUrl.startsWith('openid-credential-offer://') ? '✅ Correct Protocol' : '❌ Wrong Protocol'}
                        </Badge>
                    </Box>

                    <Box>
                        <Text size="2" weight="bold" color="gray">Credential Offer Structure:</Text>
                        <Box p="3" style={{ background: 'var(--gray-2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px' }}>
                            <pre>{JSON.stringify(credentialOffer, null, 2)}</pre>
                        </Box>
                    </Box>

                    <Box>
                        <Text size="2" weight="bold" color="gray">UniMe Wallet Compatibility:</Text>
                        <Flex direction="column" gap="1">
                            <Flex align="center" gap="2">
                                <Badge color={credentialOffer.credential_issuer ? 'green' : 'red'} size="1">
                                    {credentialOffer.credential_issuer ? '✅' : '❌'}
                                </Badge>
                                <Text size="2">credential_issuer present</Text>
                            </Flex>
                            <Flex align="center" gap="2">
                                <Badge color={credentialOffer.credential_configuration_ids ? 'green' : 'red'} size="1">
                                    {credentialOffer.credential_configuration_ids ? '✅' : '❌'}
                                </Badge>
                                <Text size="2">credential_configuration_ids present (Draft 13)</Text>
                            </Flex>
                            <Flex align="center" gap="2">
                                <Badge color={credentialOffer.grants ? 'green' : 'red'} size="1">
                                    {credentialOffer.grants ? '✅' : '❌'}
                                </Badge>
                                <Text size="2">pre-authorized code grant present</Text>
                            </Flex>
                        </Flex>
                    </Box>
                </Flex>
            </Box>
        );
    };

    return (
        <Card>
            <Box p="6">
                <Flex direction="column" gap="4">
                    <Flex align="center" gap="2">
                        <Text style={{ fontSize: '24px' }}>🧪</Text>
                        <Heading size="4">UniMe Wallet Compatibility Test</Heading>
                    </Flex>

                    <Text color="gray">
                        Test OpenID4VCI credential offer format for UniMe wallet compatibility
                    </Text>

                    <Flex gap="3">
                        <Button
                            onClick={generateTestCredentialOffer}
                            loading={isGenerating}
                            variant="soft"
                            color="blue"
                        >
                            🔬 Generate Test Offer
                        </Button>

                        {testResult && (
                            <Button
                                onClick={() => setShowQR(!showQR)}
                                variant="soft"
                                color="green"
                            >
                                {showQR ? '🙈 Hide QR' : '👁️ Show QR'}
                            </Button>
                        )}
                    </Flex>

                    {testResult && (
                        <>
                            <Separator />

                            <Flex align="center" gap="2">
                                <Badge color={testResult.isValid ? 'green' : 'red'} size="2">
                                    {testResult.isValid ? '✅ Valid Format' : '❌ Invalid Format'}
                                </Badge>
                                <Text size="2" color="gray">
                                    OpenID4VCI Draft 13 Compliance
                                </Text>
                            </Flex>

                            {analyzeQRFormat()}

                            {showQR && (
                                <Box mt="4">
                                    <CredentialQRCode
                                        credentialOffer={testResult.credentialOffer}
                                        qrCodeUrl={testResult.qrCodeUrl}
                                        httpUrl={testResult.httpUrl}
                                        credentialType="MigrationIdentity"
                                        onClose={() => setShowQR(false)}
                                    />
                                </Box>
                            )}
                        </>
                    )}

                    <Box p="3" style={{ background: 'var(--blue-2)', borderRadius: '6px' }}>
                        <Text size="2" weight="bold" color="blue" mb="2">💡 Testing Instructions:</Text>
                        <Flex direction="column" gap="1">
                            <Text size="2" color="blue">1. Generate a test credential offer</Text>
                            <Text size="2" color="blue">2. Check the format analysis for compliance</Text>
                            <Text size="2" color="blue">3. Show QR code and test with UniMe wallet</Text>
                            <Text size="2" color="blue">4. UniMe should recognize and process the offer</Text>
                        </Flex>
                    </Box>
                </Flex>
            </Box>
        </Card>
    );
};