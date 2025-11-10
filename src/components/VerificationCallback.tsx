import React, { useEffect, useState } from 'react';
import { Box, Card, Flex, Heading, Text, Button, Badge } from '@radix-ui/themes';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface PresentationResponse {
    vp_token?: string;
    presentation_submission?: unknown;
    state?: string;
    error?: string;
    error_description?: string;
}

export const VerificationCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [response, setResponse] = useState<PresentationResponse | null>(null);
    const [isProcessing, setIsProcessing] = useState(true);
    const [verificationResult, setVerificationResult] = useState<{
        success: boolean;
        message: string;
        details?: Record<string, unknown>;
    } | null>(null);

    useEffect(() => {
        processCallback();
    }, [searchParams]);

    const processCallback = async () => {
        try {
            const vpToken = searchParams.get('vp_token');
            const presentationSubmission = searchParams.get('presentation_submission');
            const state = searchParams.get('state');
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            const callbackResponse: PresentationResponse = {
                vp_token: vpToken || undefined,
                presentation_submission: presentationSubmission
                    ? JSON.parse(presentationSubmission)
                    : undefined,
                state: state || undefined,
                error: error || undefined,
                error_description: errorDescription || undefined,
            };

            setResponse(callbackResponse);

            if (error) {
                setVerificationResult({
                    success: false,
                    message: errorDescription || error,
                });
                setIsProcessing(false);
                return;
            }

            if (vpToken) {

                try {
                    const decoded = decodeJWT(vpToken);

                    setVerificationResult({
                        success: true,
                        message: 'Credential presentation received and verified successfully!',
                        details: decoded,
                    });
                } catch {
                    setVerificationResult({
                        success: false,
                        message: 'Failed to decode presentation',
                    });
                }
            } else {
                setVerificationResult({
                    success: false,
                    message: 'No presentation token received',
                });
            }
        } catch (err) {
            console.error('Failed to process callback:', err);
            setVerificationResult({
                success: false,
                message: err instanceof Error ? err.message : 'Unknown error',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const decodeJWT = (token: string) => {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format');
            }

            const payload = parts[1];
            const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
            return decoded;
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            throw error;
        }
    };

    const goBack = () => {
        navigate('/');
    };

    if (isProcessing) {
        return (
            <Box style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
                <Card size="3">
                    <Flex direction="column" align="center" gap="4" style={{ padding: '2rem' }}>
                        <Heading size="5">Processing Verification...</Heading>
                        <Text color="gray">Please wait while we process the credential presentation</Text>
                    </Flex>
                </Card>
            </Box>
        );
    }

    return (
        <Box style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
            <Card size="3">
                <Flex direction="column" gap="4">
                    <Flex align="center" gap="3">
                        {verificationResult?.success ? (
                            <CheckIcon width="32" height="32" color="var(--green-11)" />
                        ) : (
                            <Cross2Icon width="32" height="32" color="var(--red-11)" />
                        )}
                        <Heading size="5">
                            {verificationResult?.success ? 'Verification Successful' : 'Verification Failed'}
                        </Heading>
                    </Flex>

                    <Badge
                        size="2"
                        color={verificationResult?.success ? 'green' : 'red'}
                        style={{ alignSelf: 'flex-start' }}
                    >
                        {verificationResult?.success ? 'Verified' : 'Failed'}
                    </Badge>

                    <Text size="3">{verificationResult?.message}</Text>

                    {response && (
                        <Box>
                            <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                Response Details:
                            </Text>
                            <Box
                                style={{
                                    padding: '1rem',
                                    backgroundColor: 'var(--gray-2)',
                                    borderRadius: '8px',
                                    maxHeight: '300px',
                                    overflow: 'auto',
                                }}
                            >
                                <pre style={{ fontSize: '12px', margin: 0 }}>
                                    {JSON.stringify(response, null, 2)}
                                </pre>
                            </Box>
                        </Box>
                    )}

                    {verificationResult?.details && (
                        <Box>
                            <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                Verified Credential Data:
                            </Text>
                            <Box
                                style={{
                                    padding: '1rem',
                                    backgroundColor: 'var(--green-2)',
                                    borderRadius: '8px',
                                    maxHeight: '300px',
                                    overflow: 'auto',
                                }}
                            >
                                <pre style={{ fontSize: '12px', margin: 0 }}>
                                    {JSON.stringify(verificationResult.details, null, 2)}
                                </pre>
                            </Box>
                        </Box>
                    )}

                    <Flex gap="3" justify="end">
                        <Button onClick={goBack}>Back to Dashboard</Button>
                    </Flex>
                </Flex>
            </Card>
        </Box>
    );
};