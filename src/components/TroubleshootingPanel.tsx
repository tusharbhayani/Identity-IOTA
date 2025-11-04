import React, { useState } from 'react';
import { Box, Card, Flex, Text, Heading, Button, Badge, Separator } from '@radix-ui/themes';

interface DiagnosticResult {
    test: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    solution?: string;
}

export const TroubleshootingPanel: React.FC = () => {
    const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
    const [running, setRunning] = useState(false);

    const apiUrl = import.meta.env.VITE_NGROK_URL ||
        import.meta.env.VITE_UNICORE_API_URL ||
        'http://localhost:3002';

    const runDiagnostics = async () => {
        setRunning(true);
        const results: DiagnosticResult[] = [];

        // Test 1: Check if using HTTPS (required for mobile wallets)
        results.push({
            test: 'HTTPS Endpoint',
            status: apiUrl.startsWith('https://') ? 'pass' : 'fail',
            message: apiUrl.startsWith('https://')
                ? 'Using HTTPS endpoint - mobile wallets can connect'
                : 'Using HTTP endpoint - mobile wallets cannot connect',
            solution: apiUrl.startsWith('https://')
                ? undefined
                : 'Run: pnpm run setup:ngrok to enable HTTPS access'
        });

        // Test 2: Check server connectivity
        try {
            const response = await fetch(`${apiUrl}/health`);
            if (response.ok) {
                const data = await response.json();
                results.push({
                    test: 'Server Connectivity',
                    status: 'pass',
                    message: `Server is running and accessible (${data.status})`
                });

                // Test 3: Check IOTA Identity status
                results.push({
                    test: 'IOTA Identity',
                    status: data.iotaInitialized ? 'pass' : 'warning',
                    message: data.iotaInitialized
                        ? `IOTA Identity active with DID: ${data.issuerDID?.substring(0, 30)}...`
                        : 'IOTA Identity not initialized - using mock signatures',
                    solution: data.iotaInitialized
                        ? undefined
                        : 'Restart server: pnpm run iota-server'
                });
            } else {
                results.push({
                    test: 'Server Connectivity',
                    status: 'fail',
                    message: `Server returned error: ${response.status}`,
                    solution: 'Check if server is running: pnpm run iota-server'
                });
            }
        } catch (error) {
            results.push({
                test: 'Server Connectivity',
                status: 'fail',
                message: 'Cannot connect to server',
                solution: 'Start server: pnpm run iota-server'
            });
        }

        // Test 4: Check OpenID4VCI metadata
        try {
            const response = await fetch(`${apiUrl}/.well-known/openid-credential-issuer`);
            if (response.ok) {
                const metadata = await response.json();
                results.push({
                    test: 'OpenID4VCI Metadata',
                    status: 'pass',
                    message: `Metadata available with ${Object.keys(metadata.credential_configurations_supported || {}).length} credential types`
                });
            } else {
                results.push({
                    test: 'OpenID4VCI Metadata',
                    status: 'fail',
                    message: 'OpenID4VCI metadata not accessible',
                    solution: 'Check server configuration and restart'
                });
            }
        } catch (error) {
            results.push({
                test: 'OpenID4VCI Metadata',
                status: 'fail',
                message: 'Failed to fetch OpenID4VCI metadata',
                solution: 'Ensure server is running and accessible'
            });
        }

        // Test 5: Check ngrok status (if using ngrok)
        if (apiUrl.includes('ngrok')) {
            try {
                const response = await fetch('http://localhost:4040/api/tunnels');
                if (response.ok) {
                    const data = await response.json();
                    const tunnel = data.tunnels?.find((t: any) => t.public_url === apiUrl);
                    results.push({
                        test: 'ngrok Tunnel',
                        status: tunnel ? 'pass' : 'warning',
                        message: tunnel
                            ? 'ngrok tunnel is active and accessible'
                            : 'ngrok tunnel may not be properly configured',
                        solution: tunnel
                            ? undefined
                            : 'Restart ngrok: pnpm run setup:ngrok'
                    });
                }
            } catch (error) {
                results.push({
                    test: 'ngrok Tunnel',
                    status: 'warning',
                    message: 'Cannot check ngrok status (may be normal)',
                    solution: 'If having connection issues, restart: pnpm run setup:ngrok'
                });
            }
        }

        // Test 6: Mobile wallet compatibility check
        const isMobileCompatible = apiUrl.startsWith('https://') &&
            !apiUrl.includes('localhost') &&
            !apiUrl.includes('127.0.0.1');

        results.push({
            test: 'Mobile Wallet Compatibility',
            status: isMobileCompatible ? 'pass' : 'fail',
            message: isMobileCompatible
                ? 'Configuration is compatible with mobile wallets'
                : 'Configuration not suitable for mobile wallets',
            solution: isMobileCompatible
                ? undefined
                : 'Use ngrok for mobile testing: pnpm run setup:ngrok'
        });

        setDiagnostics(results);
        setRunning(false);
    };

    const getStatusColor = (status: DiagnosticResult['status']) => {
        switch (status) {
            case 'pass': return 'green';
            case 'fail': return 'red';
            case 'warning': return 'orange';
            default: return 'gray';
        }
    };

    const getStatusIcon = (status: DiagnosticResult['status']) => {
        switch (status) {
            case 'pass': return '✅';
            case 'fail': return '❌';
            case 'warning': return '⚠️';
            default: return '❓';
        }
    };

    return (
        <Card>
            <Box p="6">
                <Flex align="center" justify="between" mb="4">
                    <Flex align="center" gap="2">
                        <Text style={{ fontSize: '24px' }}>🔧</Text>
                        <Heading size="4">UniMe Wallet Troubleshooting</Heading>
                    </Flex>
                    <Button
                        variant="solid"
                        onClick={runDiagnostics}
                        disabled={running}
                    >
                        {running ? 'Running Diagnostics...' : 'Run Diagnostics'}
                    </Button>
                </Flex>

                <Text color="gray" mb="4">
                    Diagnose common issues with UniMe wallet connectivity and credential issuance.
                </Text>

                {diagnostics.length > 0 && (
                    <Box>
                        <Text size="2" weight="bold" color="gray" mb="3">Diagnostic Results</Text>

                        <Flex direction="column" gap="3">
                            {diagnostics.map((result, index) => (
                                <Box key={index} p="3" style={{
                                    backgroundColor: 'var(--gray-2)',
                                    borderRadius: '6px',
                                    borderLeft: `3px solid var(--${getStatusColor(result.status)}-9)`
                                }}>
                                    <Flex align="center" justify="between" mb="2">
                                        <Flex align="center" gap="2">
                                            <Text>{getStatusIcon(result.status)}</Text>
                                            <Text size="2" weight="bold">{result.test}</Text>
                                        </Flex>
                                        <Badge color={getStatusColor(result.status)}>
                                            {result.status.toUpperCase()}
                                        </Badge>
                                    </Flex>

                                    <Text size="2" color="gray" mb="2">
                                        {result.message}
                                    </Text>

                                    {result.solution && (
                                        <Box p="2" style={{
                                            backgroundColor: 'var(--blue-3)',
                                            borderRadius: '4px'
                                        }}>
                                            <Text size="2" color="blue" weight="bold">
                                                💡 Solution: {result.solution}
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </Flex>

                        <Separator size="4" my="4" />

                        <Box>
                            <Text size="2" weight="bold" color="gray" mb="2">Quick Fixes</Text>
                            <Flex direction="column" gap="1">
                                <Text size="2" color="gray">
                                    🔄 Server issues: <code>pnpm run iota-server</code>
                                </Text>
                                <Text size="2" color="gray">
                                    🌐 Mobile access: <code>pnpm run setup:ngrok</code>
                                </Text>
                                <Text size="2" color="gray">
                                    📱 Complete setup: <code>pnpm run mobile-setup</code>
                                </Text>
                                <Text size="2" color="gray">
                                    📋 Check logs: Browser console + server terminal
                                </Text>
                            </Flex>
                        </Box>
                    </Box>
                )}

                {diagnostics.length === 0 && !running && (
                    <Box p="4" style={{ backgroundColor: 'var(--gray-3)', borderRadius: '6px' }}>
                        <Text size="2" color="gray">
                            Click "Run Diagnostics" to check your UniMe wallet setup and identify potential issues.
                        </Text>
                    </Box>
                )}
            </Box>
        </Card>
    );
};