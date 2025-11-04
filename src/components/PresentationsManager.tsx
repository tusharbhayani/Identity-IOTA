import React from 'react';
import {
    Box,
    Card,
    Flex,
    Heading,
    Text,
    Button,
    Badge,
    Grid
} from "@radix-ui/themes";
import {
    PlusIcon,
    Share1Icon,
    EyeOpenIcon,
    CalendarIcon,
    CheckCircledIcon
} from "@radix-ui/react-icons";
import { CreatePresentationForm, StoredCredential } from './CreatePresentationForm';

interface StoredPresentation {
    jwt: string;
    holder: string;
    credentialCount: number;
    createdAt: string;
}

interface PresentationsManagerProps {
    didDocument: any;
    credentials: StoredCredential[];
    presentations: StoredPresentation[];
    showPresentationForm: boolean;
    onShowPresentationForm: () => void;
    onHidePresentationForm: () => void;
    onCreatePresentation: (data: any) => Promise<void>;
    onPresentationSelect: (presentation: StoredPresentation) => void;
}

export const PresentationsManager: React.FC<PresentationsManagerProps> = ({
    didDocument,
    credentials,
    presentations,
    showPresentationForm,
    onShowPresentationForm,
    onHidePresentationForm,
    onCreatePresentation,
    onPresentationSelect
}) => {
    return (
        <Box>
            <Flex direction="column" gap="6">
                <Flex justify="between" align="center">
                    <Box>
                        <Heading size="5">Presentations Manager</Heading>
                        <Text color="gray">Create and manage verifiable presentations</Text>
                    </Box>
                    <Button
                        onClick={onShowPresentationForm}
                        disabled={!didDocument || credentials.length === 0}
                    >
                        <PlusIcon width="16" height="16" />
                        Create Presentation
                    </Button>
                </Flex>

                {showPresentationForm && (
                    <Card>
                        <Box p="6">
                            <CreatePresentationForm
                                credentials={credentials}
                                onCreatePresentation={onCreatePresentation}
                                onCancel={onHidePresentationForm}
                            />
                        </Box>
                    </Card>
                )}

                {presentations.length > 0 ? (
                    <Box>
                        <Heading size="4" mb="4">Your Presentations ({presentations.length})</Heading>
                        <Grid columns="2" gap="4">
                            {presentations.map((presentation, index) => (
                                <Card key={index} style={{ cursor: 'pointer' }}>
                                    <Box p="4">
                                        <Flex direction="column" gap="3">
                                            <Flex justify="between" align="start">
                                                <Flex align="center" gap="2">
                                                    <CheckCircledIcon width="20" height="20" />
                                                    <Box>
                                                        <Text weight="bold">Verifiable Presentation</Text>
                                                        <Badge color="green" size="1">
                                                            {presentation.credentialCount} Credential{presentation.credentialCount !== 1 ? 's' : ''}
                                                        </Badge>
                                                    </Box>
                                                </Flex>
                                                <Button
                                                    size="1"
                                                    variant="soft"
                                                    onClick={() => onPresentationSelect(presentation)}
                                                >
                                                    <EyeOpenIcon width="12" height="12" />
                                                </Button>
                                            </Flex>

                                            <Box>
                                                <Flex align="center" gap="2" mb="2">
                                                    <CalendarIcon width="14" height="14" />
                                                    <Text size="2" color="gray">
                                                        Created: {new Date(presentation.createdAt).toLocaleDateString()}
                                                    </Text>
                                                </Flex>
                                                <Text size="1" color="gray" style={{ wordBreak: 'break-all' }}>
                                                    Holder: {presentation.holder}
                                                </Text>
                                            </Box>

                                            <Flex gap="2">
                                                <Button size="1" variant="soft">
                                                    <Share1Icon width="12" height="12" />
                                                    Share
                                                </Button>
                                                <Button
                                                    size="1"
                                                    variant="outline"
                                                    onClick={() => onPresentationSelect(presentation)}
                                                >
                                                    View Details
                                                </Button>
                                            </Flex>
                                        </Flex>
                                    </Box>
                                </Card>
                            ))}
                        </Grid>
                    </Box>
                ) : (
                    <Card>
                        <Box p="8" style={{ textAlign: 'center' }}>
                            <CheckCircledIcon width="48" height="48" style={{ margin: '0 auto 16px' }} />
                            <Heading size="4" mb="2">No Presentations Yet</Heading>
                            <Text color="gray" mb="4">
                                Create a verifiable presentation from your credentials
                            </Text>
                            <Button
                                onClick={onShowPresentationForm}
                                disabled={!didDocument || credentials.length === 0}
                            >
                                <PlusIcon width="16" height="16" />
                                Create First Presentation
                            </Button>
                            {credentials.length === 0 && (
                                <Text size="2" color="gray" mt="2">
                                    You need at least one credential to create a presentation
                                </Text>
                            )}
                        </Box>
                    </Card>
                )}
            </Flex>
        </Box>
    );
};