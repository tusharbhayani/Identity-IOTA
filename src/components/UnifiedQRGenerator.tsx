import React, { useState } from 'react';
import { Box, Button, Card, Flex, Heading, Text, TextField, Separator } from '@radix-ui/themes';
import { generateQRDataURL } from './QRCodeGenerator';

interface QRGeneratorProps {
    title?: string;
    defaultCredentialId?: string;
    onQRGenerated?: (qrCode: string, offerData: any) => void;
}

export const UnifiedQRGenerator: React.FC<QRGeneratorProps> = ({
    title = "🎯 UniMe Wallet QR Generator",
    defaultCredentialId = "",
    onQRGenerated
}) => {
    const [credentialId, setCredentialId] = useState(defaultCredentialId);
    const [isGenerating, setIsGenerating] = useState(false);
    const [qrResult, setQrResult] = useState<{
        qrCode: string;
        offerData: any;
        analysis: any;
    } | null>(null);

    const generateUniMeQR = async () => {
        setIsGenerating(true);
        setQrResult(null);

        try {
            console.log('🎯 Generating UniMe-compatible QR code...');
            console.log('📋 Credential ID:', credentialId);

            const baseUrl = '/api';

            // Step 1: Get credential details
            const credentialsResponse = await fetch(`${baseUrl}/v0/credentials`);
            const credentials = await credentialsResponse.json();

            const targetCredential = credentials.find((c: any) => c.id === credentialId);
            if (!targetCredential) {
                throw new Error(`Credential ${credentialId} not found`);
            }

            console.log('✅ Found credential:', targetCredential);

            // Step 2: Create offer using SSI Agent
            const offerResponse = await fetch(`${baseUrl}/v0/offers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/plain'
                },
                body: JSON.stringify({ offerId: credentialId })
            });

            if (!offerResponse.ok) {
                throw new Error(`Failed to create offer: ${offerResponse.status}`);
            }

            const originalOfferUrl = await offerResponse.text();
            console.log('📤 Original offer URL:', originalOfferUrl);

            // Step 3: Get offer data and analyze
            const offerUriMatch = originalOfferUrl.match(/credential_offer_uri=([^&]+)/);
            if (!offerUriMatch) {
                throw new Error('Could not extract offer URI');
            }

            const offerUri = decodeURIComponent(offerUriMatch[1]);
            const proxyUri = offerUri.replace('http://192.168.29.111:3033', baseUrl);

            const offerDataResponse = await fetch(proxyUri);
            if (!offerDataResponse.ok) {
                throw new Error('Could not fetch offer data');
            }

            const originalOfferData = await offerDataResponse.json();
            console.log('📋 Original offer data:', originalOfferData);

            // Step 4: Analyze and fix for UniMe wallet
            const analysis = {
                hasConfigIds: originalOfferData.credential_configuration_ids?.length > 0,
                hasPreAuthCode: !!originalOfferData.grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"],
                credentialIssuer: originalOfferData.credential_issuer,
                originalConfigIds: originalOfferData.credential_configuration_ids || [],
                needsFix: !originalOfferData.credential_configuration_ids || originalOfferData.credential_configuration_ids.length === 0
            };

            console.log('🔍 Analysis:', analysis);

            let finalOfferUrl = originalOfferUrl;
            let finalOfferData = originalOfferData;

            // Step 5: Apply UniMe wallet fix if needed
            if (analysis.needsFix) {
                console.log('🔧 Applying UniMe wallet fix...');

                // Determine correct configuration ID based on credential type
                let configId = "VerifiableCredential"; // Default

                if (targetCredential.credential_configuration?.credential_definition?.type) {
                    const types = targetCredential.credential_configuration.credential_definition.type;
                    configId = types[types.length - 1]; // Use the most specific type
                }

                console.log(`📋 Using configuration ID: ${configId}`);

                // Create fixed offer data
                const fixedOfferData = {
                    ...originalOfferData,
                    credential_configuration_ids: [configId]
                };

                // Create data URL with fixed data
                const fixedDataString = JSON.stringify(fixedOfferData);
                const dataUrl = `data:application/json;base64,${btoa(fixedDataString)}`;
                finalOfferUrl = `openid-credential-offer://?credential_offer_uri=${encodeURIComponent(dataUrl)}`;
                finalOfferData = fixedOfferData;

                console.log('✅ Created fixed offer with configuration IDs:', fixedOfferData.credential_configuration_ids);
            } else {
                console.log('✅ Offer already has configuration IDs, using original');
            }

            // Step 6: Store result
            const result = {
                qrCode: finalOfferUrl,
                offerData: finalOfferData,
                analysis: analysis
            };

            setQrResult(result);

            // Callback for parent components
            if (onQRGenerated) {
                onQRGenerated(finalOfferUrl, finalOfferData);
            }

            console.log('🎉 UniMe-compatible QR code generated successfully!');

        } catch (error) {
            console.error('❌ Failed to generate QR code:', error);
            alert(`Failed to generate QR code: ${error}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const openVisualQR = async () => {
        if (qrResult?.qrCode) {
            try {
                const dataUrl = await generateQRDataURL(qrResult.qrCode, 300);
                const newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write(`
                        <html>
                            <head><title>QR Code</title></head>
                            <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f3f4f6;">
                                <img src="${dataUrl}" alt="QR Code" style="max-width: 90%; height: auto;" />
                            </body>
                        </html>
                    `);
                }
            } catch (error) {
                console.error('Failed to generate QR code:', error);
                alert('Failed to generate QR code');
            }
        }
    };

    const copyQRCode = async () => {
        if (qrResult?.qrCode) {
            try {
                await navigator.clipboard.writeText(qrResult.qrCode);
                alert('✅ QR code copied to clipboard!');
            } catch (error) {
                console.error('Failed to copy:', error);
            }
        }
    };

    return (
        <Card size="3" style={{ maxWidth: '800px', margin: '20px auto' }}>
            <Flex direction="column" gap="4">
                <Heading size="5">{title}</Heading>
                <Text size="2" color="gray">
                    Generate UniMe wallet-compatible QR codes with proper configuration IDs
                </Text>

                {/* Input */}
                <Flex direction="column" gap="2">
                    <Text size="2" weight="bold">Credential ID:</Text>
                    <TextField.Root
                        value={credentialId}
                        onChange={(e) => setCredentialId(e.target.value)}
                        placeholder="Enter credential ID (e.g., a9b9bf5c-2d01-4ac2-9eef-ef94d6d807c1)"
                    />
                </Flex>

                {/* Generate Button */}
                <Button
                    size="3"
                    onClick={generateUniMeQR}
                    disabled={isGenerating || !credentialId}
                    color="green"
                >
                    {isGenerating ? 'Generating QR Code...' : '🎯 Generate UniMe QR Code'}
                </Button>

                {/* Results */}
                {qrResult && (
                    <Box>
                        <Separator my="4" />

                        {/* Analysis */}
                        <Box p="3" style={{
                            backgroundColor: qrResult.analysis.needsFix ? 'var(--yellow-2)' : 'var(--green-2)',
                            borderRadius: '8px',
                            marginBottom: '16px'
                        }}>
                            <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                                📊 Analysis:
                            </Text>
                            <Text size="1" style={{ display: 'block' }}>
                                {qrResult.analysis.needsFix ? (
                                    <>
                                        🔧 <strong>Fix Applied:</strong> Added configuration ID for UniMe compatibility<br />
                                        📋 Configuration IDs: {JSON.stringify(qrResult.offerData.credential_configuration_ids)}
                                    </>
                                ) : (
                                    <>
                                        ✅ <strong>Already Compatible:</strong> Configuration IDs present<br />
                                        📋 Configuration IDs: {JSON.stringify(qrResult.analysis.originalConfigIds)}
                                    </>
                                )}
                                <br />
                                🔑 Pre-auth code: {qrResult.analysis.hasPreAuthCode ? '✅ Present' : '❌ Missing'}
                            </Text>
                        </Box>

                        {/* QR Code Actions */}
                        <Box p="4" style={{ backgroundColor: 'var(--blue-2)', borderRadius: '8px' }}>
                            <Text size="3" weight="bold" color="blue" mb="3" style={{ display: 'block' }}>
                                📱 Ready for UniMe Wallet
                            </Text>

                            <Flex gap="2" mb="3">
                                <Button size="2" onClick={openVisualQR}>
                                    🖼️ Open Visual QR Code
                                </Button>
                                <Button size="2" variant="soft" onClick={copyQRCode}>
                                    📋 Copy QR Text
                                </Button>
                            </Flex>

                            <Text size="1" style={{ display: 'block' }}>
                                Click "🖼️ Open Visual QR Code" to get a scannable QR code image for UniMe wallet.
                            </Text>
                        </Box>

                        {/* Technical Details */}
                        <details style={{ marginTop: '16px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                🔧 Technical Details
                            </summary>
                            <Box mt="2" p="3" style={{ backgroundColor: 'var(--gray-1)', borderRadius: '8px' }}>
                                <Text size="1" style={{ display: 'block', marginBottom: '8px' }}>
                                    <strong>Credential Issuer:</strong> {qrResult.analysis.credentialIssuer}
                                </Text>
                                <Text size="1" style={{ display: 'block', marginBottom: '8px' }}>
                                    <strong>Fix Applied:</strong> {qrResult.analysis.needsFix ? 'Yes' : 'No'}
                                </Text>
                                <Text size="1" style={{ display: 'block', fontFamily: 'monospace', fontSize: '10px' }}>
                                    <strong>QR Code:</strong><br />
                                    {qrResult.qrCode.substring(0, 100)}...
                                </Text>
                            </Box>
                        </details>
                    </Box>
                )}
            </Flex>
        </Card>
    );
};