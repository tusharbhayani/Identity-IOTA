import React from 'react';
import {
    Box,
    Card,
    Flex,
    Heading,
    Text,
    Button,
    Separator,
    Badge
} from "@radix-ui/themes";
import {
    GearIcon,
    TrashIcon,
    InfoCircledIcon
} from "@radix-ui/react-icons";
import { UnicoreTestPanel } from './UnicoreTestPanel';
import { UniMeCompatibilityTest } from './UniMeCompatibilityTest';

interface SettingsPanelProps {
    credentials: unknown[];
    presentations: unknown[];
    onClearCredentials: () => void;
    onClearPresentations: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    credentials,
    presentations,
    onClearCredentials,
    onClearPresentations
}) => {
    const [showClearCredentialsDialog, setShowClearCredentialsDialog] = React.useState(false);
    const [showClearPresentationsDialog, setShowClearPresentationsDialog] = React.useState(false);

    const handleClearCredentials = () => {
        onClearCredentials();
        setShowClearCredentialsDialog(false);
    };

    const handleClearPresentations = () => {
        onClearPresentations();
        setShowClearPresentationsDialog(false);
    };
    return (
        <Box>
            <Flex direction="column" gap="6">
                <Box>
                    <Heading size="5">Settings & Testing</Heading>
                    <Text color="gray">Configure your wallet and test API connections</Text>
                </Box>

                <Card>
                    <Box p="6">
                        <Flex align="center" gap="2" mb="4">
                            <InfoCircledIcon width="20" height="20" />
                            <Heading size="4">API Connection Testing</Heading>
                        </Flex>
                        <UnicoreTestPanel />

                        <Separator my="4" />


                    </Box>
                </Card>

                <Card>
                    <Box p="6">
                        <UniMeCompatibilityTest />
                    </Box>
                </Card>

                <Card>
                    <Box p="6">
                        <Flex align="center" gap="2" mb="4">
                            <GearIcon width="20" height="20" />
                            <Heading size="4">Data Management</Heading>
                        </Flex>

                        <Flex direction="column" gap="4">
                            <Box>
                                <Flex justify="between" align="center" mb="2">
                                    <Box>
                                        <Text weight="bold">Stored Credentials</Text>
                                        <Text size="2" color="gray">Clear all locally stored credentials</Text>
                                    </Box>
                                    <Flex align="center" gap="2">
                                        <Badge color={credentials.length > 0 ? 'blue' : 'gray'}>
                                            {credentials.length} items
                                        </Badge>
                                        <Button
                                            size="2"
                                            variant="soft"
                                            color="red"
                                            onClick={() => setShowClearCredentialsDialog(true)}
                                            disabled={credentials.length === 0}
                                        >
                                            <TrashIcon width="14" height="14" />
                                            Clear All
                                        </Button>
                                    </Flex>
                                </Flex>
                                <Separator />
                            </Box>

                            <Box>
                                <Flex justify="between" align="center" mb="2">
                                    <Box>
                                        <Text weight="bold">Stored Presentations</Text>
                                        <Text size="2" color="gray">Clear all locally stored presentations</Text>
                                    </Box>
                                    <Flex align="center" gap="2">
                                        <Badge color={presentations.length > 0 ? 'green' : 'gray'}>
                                            {presentations.length} items
                                        </Badge>
                                        <Button
                                            size="2"
                                            variant="soft"
                                            color="red"
                                            onClick={() => setShowClearPresentationsDialog(true)}
                                            disabled={presentations.length === 0}
                                        >
                                            <TrashIcon width="14" height="14" />
                                            Clear All
                                        </Button>
                                    </Flex>
                                </Flex>
                                <Separator />
                            </Box>
                        </Flex>
                    </Box>
                </Card>

                <Card>
                    <Box p="6">
                        <Flex align="center" gap="2" mb="4">
                            <InfoCircledIcon width="20" height="20" />
                            <Heading size="4">System Information</Heading>
                        </Flex>

                        <Flex direction="column" gap="3">
                            <Flex justify="between">
                                <Text color="gray">Standards Compliance:</Text>
                                <Flex gap="2">
                                    <Badge color="green">W3C VC</Badge>
                                    <Badge color="blue">OpenID4VCI</Badge>
                                    <Badge color="purple">JWT-VC</Badge>
                                </Flex>
                            </Flex>

                            <Flex justify="between">
                                <Text color="gray">Wallet Compatibility:</Text>
                                <Badge color="green">Unime Wallet</Badge>
                            </Flex>

                            <Flex justify="between">
                                <Text color="gray">API Integration:</Text>
                                <Badge color="blue">Unicore API</Badge>
                            </Flex>

                            <Flex justify="between">
                                <Text color="gray">Credential Types:</Text>
                                <Flex gap="1">
                                    <Badge size="1" color="blue">Migration</Badge>
                                    <Badge size="1" color="green">Work</Badge>
                                    <Badge size="1" color="red">Health</Badge>
                                    <Badge size="1" color="purple">Skills</Badge>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Box>
                </Card>

                {showClearCredentialsDialog && (
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
                        onClick={() => setShowClearCredentialsDialog(false)}
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
                                            <Heading size="4" color="red">Clear All Credentials</Heading>
                                            <Text size="2" color="gray">This action cannot be undone</Text>
                                        </Box>
                                    </Flex>

                                    <Box p="3" style={{ background: 'var(--red-2)', borderRadius: '6px' }}>
                                        <Text size="2" weight="bold" mb="1">Items to delete:</Text>
                                        <Text size="3" weight="bold">{credentials.length} credentials</Text>
                                    </Box>

                                    <Text size="2" color="red">
                                        Are you sure you want to delete all stored credentials? This will permanently remove all credentials from your wallet.
                                    </Text>

                                    <Flex gap="3" justify="end">
                                        <Button
                                            variant="soft"
                                            color="gray"
                                            onClick={() => setShowClearCredentialsDialog(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="solid"
                                            color="red"
                                            onClick={handleClearCredentials}
                                        >
                                            <TrashIcon width="14" height="14" />
                                            Clear All Credentials
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Box>
                        </Card>
                    </Box>
                )}

                {showClearPresentationsDialog && (
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
                        onClick={() => setShowClearPresentationsDialog(false)}
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
                                            <Heading size="4" color="red">Clear All Presentations</Heading>
                                            <Text size="2" color="gray">This action cannot be undone</Text>
                                        </Box>
                                    </Flex>

                                    <Box p="3" style={{ background: 'var(--red-2)', borderRadius: '6px' }}>
                                        <Text size="2" weight="bold" mb="1">Items to delete:</Text>
                                        <Text size="3" weight="bold">{presentations.length} presentations</Text>
                                    </Box>

                                    <Text size="2" color="red">
                                        Are you sure you want to delete all stored presentations? This will permanently remove all presentations from your wallet.
                                    </Text>

                                    <Flex gap="3" justify="end">
                                        <Button
                                            variant="soft"
                                            color="gray"
                                            onClick={() => setShowClearPresentationsDialog(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="solid"
                                            color="red"
                                            onClick={handleClearPresentations}
                                        >
                                            <TrashIcon width="14" height="14" />
                                            Clear All Presentations
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