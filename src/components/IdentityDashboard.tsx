import React from 'react';
import {
    Box,
    Card,
    Flex,
    Heading,
    Text,
    Button,
    Badge,
    Grid,
    Separator
} from "@radix-ui/themes";
import {
    PersonIcon,
    IdCardIcon,
    CheckCircledIcon,
    PlusIcon,
    CopyIcon
} from "@radix-ui/react-icons";
import { StoredCredential } from './CreatePresentationForm';

interface StoredPresentation {
    jwt: string;
    holder: string;
    credentialCount: number;
    createdAt: string;
}

interface IdentityDashboardProps {
    didDocument: import("@iota/identity-wasm/web").IotaDocument | null;
    credentials: StoredCredential[];
    presentations: StoredPresentation[];
    status: string;
    onCreateIdentity: () => void;
    isLoading: boolean;
}

export const IdentityDashboard: React.FC<IdentityDashboardProps> = ({
    didDocument,
    credentials,
    presentations,
    status,
    onCreateIdentity,
    isLoading
}) => {
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    const getStatusColor = (status: string) => {
        if (status.includes('✅')) return 'green';
        if (status.includes('❌')) return 'red';
        if (status.includes('Creating') || status.includes('Initializing')) return 'blue';
        return 'gray';
    };

    const getCredentialTypeStats = () => {
        const stats: Record<string, number> = {};
        credentials.forEach(cred => {
            stats[cred.type] = (stats[cred.type] || 0) + 1;
        });
        return stats;
    };

    const credentialStats = getCredentialTypeStats();

    return (
        <Box>
            <Flex direction="column" gap="6">
                <Box>
                    <Heading size="5">📊 Identity Dashboard</Heading>
                    <Text color="gray">Overview of your digital identity and credentials</Text>
                </Box>

                <Card style={{ border: `2px solid var(--${getStatusColor(status)}-6)` }}>
                    <Box p="4">
                        <Flex align="center" gap="3">
                            <Text style={{ fontSize: '24px' }}>
                                {status.includes('✅') ? '✅' : status.includes('❌') ? '❌' : '⏳'}
                            </Text>
                            <Box style={{ flex: 1 }}>
                                <Text weight="bold" size="3">System Status</Text>
                                <Text size="2" color={getStatusColor(status)}>{status}</Text>
                            </Box>
                        </Flex>
                    </Box>
                </Card>

                <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4">
                    <Card>
                        <Box p="4">
                            <Flex direction="column" gap="2">
                                <Flex align="center" gap="2">
                                    <PersonIcon width="20" height="20" />
                                    <Text weight="bold">Identity</Text>
                                </Flex>
                                <Text size="6" weight="bold" color={didDocument ? 'green' : 'gray'}>
                                    {didDocument ? '1' : '0'}
                                </Text>
                                <Badge color={didDocument ? 'green' : 'gray'} size="1">
                                    {didDocument ? 'Created' : 'Not Created'}
                                </Badge>
                            </Flex>
                        </Box>
                    </Card>

                    <Card>
                        <Box p="4">
                            <Flex direction="column" gap="2">
                                <Flex align="center" gap="2">
                                    <IdCardIcon width="20" height="20" />
                                    <Text weight="bold">Credentials</Text>
                                </Flex>
                                <Text size="6" weight="bold" color={credentials.length > 0 ? 'blue' : 'gray'}>
                                    {credentials.length}
                                </Text>
                                <Badge color={credentials.length > 0 ? 'blue' : 'gray'} size="1">
                                    {credentials.length === 0 ? 'None' : credentials.length === 1 ? 'Single' : 'Multiple'}
                                </Badge>
                            </Flex>
                        </Box>
                    </Card>

                    <Card>
                        <Box p="4">
                            <Flex direction="column" gap="2">
                                <Flex align="center" gap="2">
                                    <CheckCircledIcon width="20" height="20" />
                                    <Text weight="bold">Presentations</Text>
                                </Flex>
                                <Text size="6" weight="bold" color={presentations.length > 0 ? 'purple' : 'gray'}>
                                    {presentations.length}
                                </Text>
                                <Badge color={presentations.length > 0 ? 'purple' : 'gray'} size="1">
                                    {presentations.length === 0 ? 'None' : presentations.length === 1 ? 'Single' : 'Multiple'}
                                </Badge>
                            </Flex>
                        </Box>
                    </Card>

                    <Card>
                        <Box p="4">
                            <Flex direction="column" gap="2">
                                <Flex align="center" gap="2">
                                    <Text style={{ fontSize: '20px' }}>📱</Text>
                                    <Text weight="bold">Wallet Ready</Text>
                                </Flex>
                                <Text size="6" weight="bold" color="green">
                                    ✓
                                </Text>
                                <Badge color="green" size="1">
                                    Compatible
                                </Badge>
                            </Flex>
                        </Box>
                    </Card>
                </Grid>

                {didDocument ? (
                    <Card>
                        <Box p="6">
                            <Flex direction="column" gap="4">
                                <Flex align="center" gap="2">
                                    <Text style={{ fontSize: '24px' }}>🆔</Text>
                                    <Heading size="4">Your Digital Identity</Heading>
                                    <Badge color="green">Active</Badge>
                                </Flex>

                                <Separator />

                                <Box>
                                    <Text size="2" weight="bold" color="gray" mb="2">Decentralized Identifier (DID):</Text>
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
                                            <Text size="1">{didDocument.id().toString()}</Text>
                                        </Box>
                                        <Button
                                            size="2"
                                            variant="soft"
                                            onClick={() => copyToClipboard(didDocument.id().toString())}
                                        >
                                            <CopyIcon width="14" height="14" />
                                            Copy
                                        </Button>
                                    </Flex>
                                </Box>

                                {Object.keys(credentialStats).length > 0 && (
                                    <Box>
                                        <Text size="2" weight="bold" color="gray" mb="2">Credential Types:</Text>
                                        <Flex gap="2" wrap="wrap">
                                            {Object.entries(credentialStats).map(([type, count]) => (
                                                <Badge key={type} color="blue" size="2">
                                                    {type}: {count}
                                                </Badge>
                                            ))}
                                        </Flex>
                                    </Box>
                                )}
                            </Flex>
                        </Box>
                    </Card>
                ) : (
                    <Card style={{ textAlign: 'center' }}>
                        <Box p="8">
                            <Text style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>🆔</Text>
                            <Heading size="4" mb="2">Create Your Digital Identity</Heading>
                            <Text color="gray" mb="4">
                                Start by creating a decentralized identifier (DID) to manage your verifiable credentials
                            </Text>
                            <Button
                                onClick={onCreateIdentity}
                                loading={isLoading}
                                size="3"
                            >
                                <PlusIcon width="16" height="16" />
                                Create Identity
                            </Button>
                        </Box>
                    </Card>
                )}

                {didDocument && (
                    <Card>
                        <Box p="6">
                            <Flex direction="column" gap="4">
                                <Flex align="center" gap="2">
                                    <Text style={{ fontSize: '24px' }}>⚡</Text>
                                    <Heading size="4">Quick Actions</Heading>
                                </Flex>

                                <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="3">
                                    <Button variant="soft" size="3">
                                        <IdCardIcon width="16" height="16" />
                                        Issue Credential
                                    </Button>
                                    <Button variant="soft" size="3">
                                        <CheckCircledIcon width="16" height="16" />
                                        Create Presentation
                                    </Button>
                                    <Button variant="soft" size="3">
                                        <Text style={{ fontSize: '16px' }}>📱</Text>
                                        Connect Wallet
                                    </Button>
                                </Grid>
                            </Flex>
                        </Box>
                    </Card>
                )}

                <Card>
                    <Box p="6">
                        <Flex direction="column" gap="4">
                            <Flex align="center" gap="2">
                                <Text style={{ fontSize: '24px' }}>🏆</Text>
                                <Heading size="4">Standards Compliance</Heading>
                            </Flex>

                            <Grid columns={{ initial: "2", sm: "4" }} gap="3">
                                <Flex direction="column" align="center" gap="1">
                                    <Badge color="green" size="2">W3C VC</Badge>
                                    <Text size="1" color="gray">Verifiable Credentials</Text>
                                </Flex>
                                <Flex direction="column" align="center" gap="1">
                                    <Badge color="blue" size="2">OpenID4VCI</Badge>
                                    <Text size="1" color="gray">Credential Issuance</Text>
                                </Flex>
                                <Flex direction="column" align="center" gap="1">
                                    <Badge color="purple" size="2">JWT-VC</Badge>
                                    <Text size="1" color="gray">JSON Web Token</Text>
                                </Flex>
                                <Flex direction="column" align="center" gap="1">
                                    <Badge color="orange" size="2">DID Core</Badge>
                                    <Text size="1" color="gray">Decentralized ID</Text>
                                </Flex>
                            </Grid>
                        </Flex>
                    </Box>
                </Card>
            </Flex>
        </Box>
    );
};