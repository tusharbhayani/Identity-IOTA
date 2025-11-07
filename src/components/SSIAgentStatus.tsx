import { useEffect, useState } from "react";
import { Box, Text, Flex, Badge, Button, Card } from "@radix-ui/themes";
import { unicoreService } from "../services/unicore/unicoreService";

interface SSIAgentStatus {
    api: boolean;
    agent: boolean;
    lastChecked?: string;
    error?: string;
}

export function SSIAgentStatus() {
    const [status, setStatus] = useState<SSIAgentStatus>({ api: false, agent: false });
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState<{
        success?: boolean;
        status?: string;
        qrCodeUrl?: string;
        error?: string;
    } | null>(null);

    const checkStatus = async () => {
        setIsLoading(true);
        try {
            const health = await unicoreService.healthCheck();
            setStatus({
                api: health.api,
                agent: health.agent,
                lastChecked: new Date().toLocaleTimeString(),
                error: health.error,
            });
        } catch {
            setStatus({
                api: false,
                agent: false,
                lastChecked: new Date().toLocaleTimeString(),
                error: "UniCore service not available",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const testCredentialFlow = async () => {
        setIsLoading(true);
        setTestResult(null);
        try {
            const result = await unicoreService.testUniCoreFlow();
            setTestResult({
                success: result.success,
                status: result.success ? "UniCore flow completed successfully" : "UniCore flow failed",
                error: result.success ? undefined : result.error,
            });
        } catch (error) {
            setTestResult({
                error: error instanceof Error ? error.message : "Test failed",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    return (
        <Card>
            <Flex direction="column" gap="4">
                <Flex justify="between" align="center">
                    <Text size="4" weight="bold">🚀 UniCore Service Status</Text>
                    <Button
                        size="2"
                        variant="soft"
                        onClick={checkStatus}
                        disabled={isLoading}
                    >
                        {isLoading ? "Checking..." : "Refresh"}
                    </Button>
                </Flex>

                <Flex direction="column" gap="2">
                    <Flex justify="between" align="center">
                        <Text size="2">UniCore Service (Port 3033):</Text>
                        <Badge color={status.api ? "green" : "red"}>
                            {status.api ? "✅ Connected" : "❌ Disconnected"}
                        </Badge>
                    </Flex>

                    {status.lastChecked && (
                        <Text size="1" color="gray">
                            Last checked: {status.lastChecked}
                        </Text>
                    )}

                    {status.error && (
                        <Box p="3" style={{ background: 'var(--red-3)', borderRadius: '4px' }}>
                            <Text size="2" color="red" weight="bold">❌ {status.error}</Text>
                            <Text size="1" color="red" style={{ display: 'block', marginTop: '4px' }}>
                                📖 Start UniCore service on port 3033
                            </Text>
                        </Box>
                    )}
                </Flex>

                <Flex direction="column" gap="2">
                    <Button
                        size="2"
                        onClick={testCredentialFlow}
                        disabled={isLoading}
                    >
                        {isLoading ? "Testing..." : "🧪 Test UniCore Flow"}
                    </Button>

                    {testResult && (
                        <Box p="3" style={{ background: testResult.success ? 'var(--green-3)' : 'var(--red-3)', borderRadius: '4px' }}>
                            {testResult.error ? (
                                <Text size="2" color="red">❌ Test failed: {testResult.error}</Text>
                            ) : (
                                <Flex direction="column" gap="1">
                                    <Text size="2" color="green">✅ Test successful!</Text>
                                    <Text size="1" color="gray">Status: {testResult.status}</Text>
                                    {testResult.qrCodeUrl && (
                                        <Text size="1" color="gray">QR Code generated</Text>
                                    )}
                                </Flex>
                            )}
                        </Box>
                    )}
                </Flex>

                <Box p="2" style={{ background: 'var(--gray-3)', borderRadius: '4px' }}>
                    <Text size="1" color="gray">
                        {status.api ?
                            "🔗 Connected to UniCore service - Ready for credentials!" :
                            "⚠️ Start UniCore service on port 3033"
                        }
                    </Text>
                </Box>
            </Flex>
        </Card>
    );
}