import React, { useState } from 'react';
import { Box, Button, Card, Flex, Heading, Text, Badge } from '@radix-ui/themes';
import { unicoreService } from '../services/unicore/unicoreService';
import { UNICORE_CONFIG } from '../services/unicore/config';

export const UnicoreTestPanel: React.FC = () => {
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [isTestingCredential, setIsTestingCredential] = useState(false);
    const [connectionResult, setConnectionResult] = useState<string | null>(null);
    const [credentialResult, setCredentialResult] = useState<string | null>(null);

    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        setConnectionResult(null);

        try {
            await unicoreService.request('/health');
            setConnectionResult('Connection successful!');
        } catch (error) {
            setConnectionResult(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleTestCredential = async () => {
        setIsTestingCredential(true);
        setCredentialResult(null);

        try {
            const result = await unicoreService.issueCredential({
                type: 'TestCredential',
                holder: {
                    id: 'did:key:test-holder',
                    name: 'Test User'
                }
            });
            setCredentialResult(`Credential issued successfully! ID: ${result.offerId || 'N/A'}`);
        } catch (error) {
            setCredentialResult(`Credential issuance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsTestingCredential(false);
        }
    };

    return (
        <Card>
            <Box p="4">
                <Heading size="4" mb="3">Unicore API Test Panel</Heading>

                <Box mb="4">
                    <Text size="2" color="gray">
                        <strong>API URL:</strong> {UNICORE_CONFIG.BASE_URL}
                    </Text>
                </Box>

                <Flex direction="column" gap="3">
                    <Flex align="center" gap="3">
                        <Button
                            onClick={handleTestConnection}
                            disabled={isTestingConnection}
                            variant="soft"
                        >
                            {isTestingConnection ? 'Testing Connection...' : 'Test API Connection'}
                        </Button>

                        {connectionResult && (
                            <Badge color={connectionResult.includes('successful') ? 'green' : 'red'}>
                                {connectionResult}
                            </Badge>
                        )}
                    </Flex>

                    <Flex align="center" gap="3">
                        <Button
                            onClick={handleTestCredential}
                            disabled={isTestingCredential}
                            variant="soft"
                            color="blue"
                        >
                            {isTestingCredential ? 'Testing Credential...' : 'Test Credential Issuance'}
                        </Button>

                        {credentialResult && (
                            <Badge color={credentialResult.includes('successfully') ? 'green' : 'red'}>
                                {credentialResult}
                            </Badge>
                        )}
                    </Flex>
                </Flex>

                <Box mt="4">
                    <Text size="1" color="gray">
                        Use these tests to verify your Unicore API connection before issuing real credentials.
                        Check the browser console for detailed logs.
                    </Text>
                </Box>
            </Box>
        </Card>
    );
};