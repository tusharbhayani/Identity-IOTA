/**
 * Enhanced Credentials Manager - Production MVP
 * Complete credential management system with professional UI
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Flex,
    Heading,
    Text,
    Button,
    TextField,
    Select,
    Badge,
    Separator,
    Tabs,
    Dialog,
    ScrollArea,
    Grid,
    Avatar,
    IconButton,
    Callout,
} from '@radix-ui/themes';
import {
    PlusIcon,
    CheckIcon,
    Cross2Icon,
    EyeOpenIcon,
    Share1Icon,
    ReloadIcon,
    InfoCircledIcon,
    CheckCircledIcon,
    ExclamationTriangleIcon,
} from '@radix-ui/react-icons';
import { unicoreService } from '../services/unicore/unicoreService';
import { QRCodeGenerator } from './QRCodeGenerator';
import { getCredentialDisplayName } from '../services/unicore/credentialConfigService';

// ... (keeping all the existing interfaces and types from ModernCredentialsManager)

interface CredentialForm {
    type: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    passportNumber?: string;
    employerId?: string;
    position?: string;
    validUntil?: string;
}

interface IssuedCredential {
    id: string;
    type: string;
    offerUrl: string;
    timestamp: string;
    status: 'issued' | 'pending' | 'error';
    credentialData?: unknown;
}

interface VerificationRequest {
    id: string;
    types: string[];
    authorizationUrl: string;
    timestamp: string;
    status: 'active' | 'completed' | 'expired';
}

interface ServiceHealth {
    api: boolean;
    agent: boolean;
    configurations?: unknown;
    error?: string;
}

export const EnhancedCredentialsManager: React.FC = () => {
    // ... (keeping all the existing state management)
    const [activeTab, setActiveTab] = useState('issue');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [healthStatus, setHealthStatus] = useState<ServiceHealth | null>(null);

    const [form, setForm] = useState<CredentialForm>({
        type: 'MigrationIdentity',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: '',
        passportNumber: '',
    });

    const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredential[]>([]);
    const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
    const [selectedCredential, setSelectedCredential] = useState<IssuedCredential | null>(null);
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [verificationTypes, setVerificationTypes] = useState<string[]>(['MigrationIdentity']);

    useEffect(() => {
        loadStoredData();
        checkHealth();
    }, []);

    useEffect(() => {
        localStorage.setItem('unicore-credentials', JSON.stringify(issuedCredentials));
    }, [issuedCredentials]);

    useEffect(() => {
        localStorage.setItem('unicore-verifications', JSON.stringify(verificationRequests));
    }, [verificationRequests]);

    const loadStoredData = () => {
        try {
            const storedCredentials = localStorage.getItem('unicore-credentials');
            if (storedCredentials) {
                setIssuedCredentials(JSON.parse(storedCredentials));
            }

            const storedVerifications = localStorage.getItem('unicore-verifications');
            if (storedVerifications) {
                setVerificationRequests(JSON.parse(storedVerifications));
            }
        } catch (error) {
            console.error('Failed to load stored data:', error);
        }
    };

    const checkHealth = async () => {
        try {
            const health = await unicoreService.healthCheck();
            setHealthStatus(health);

            const configIds = await unicoreService.getAvailableConfigurationIds();
            console.log('📋 Available credential configuration IDs:', configIds);

            if (configIds.length === 0) {
                setError('⚠️ No credential configurations found in UniCore. Please configure credential types first. See UNICORE_SETUP_GUIDE.md');
            } else if (configIds.length === 1 && configIds[0] === 'VerifiableCredential') {
                console.warn('⚠️ Only generic VerifiableCredential configuration found. Add specific types for better wallet display.');
            }

            if (health.configurations) {
                console.log('Available credential configurations:', health.configurations);
            }
        } catch (error) {
            setHealthStatus({
                api: false,
                agent: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    const handleInputChange = (field: keyof CredentialForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        clearMessages();
    };

    const handleCredentialTypeChange = (type: string) => {
        setForm(prev => ({
            ...prev,
            type,
            employerId: '',
            position: '',
            validUntil: '',
        }));
    };

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    const validateForm = (): boolean => {
        if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth || !form.nationality.trim()) {
            setError('Please fill in all required fields');
            return false;
        }

        if (form.type === 'WorkPermit') {
            if (!form.employerId?.trim() || !form.position?.trim() || !form.validUntil) {
                setError('Please fill in all work permit fields');
                return false;
            }
        }

        return true;
    };

    const issueCredential = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        clearMessages();

        try {
            const credentialRequest = {
                type: form.type,
                credentialSubject: {
                    first_name: form.firstName,
                    last_name: form.lastName,
                    dob: form.dateOfBirth,
                    nationality: form.nationality,
                    ...(form.passportNumber && { passport_number: form.passportNumber }),
                    ...(form.employerId && { employer_id: form.employerId }),
                    ...(form.position && { position: form.position }),
                    ...(form.validUntil && { valid_until: form.validUntil }),
                },
                ...(form.validUntil && { expirationDate: form.validUntil }),
            };

            const result = await unicoreService.issueCredential(credentialRequest);

            if (result.success) {
                const newCredential: IssuedCredential = {
                    id: result.credentialId!,
                    type: form.type,
                    offerUrl: result.offerUrl!,
                    timestamp: new Date().toISOString(),
                    status: 'issued',
                    credentialData: result.credentialData,
                };

                setIssuedCredentials(prev => [newCredential, ...prev]);
                setSuccess(`${getCredentialDisplayName(form.type)} issued successfully! 🎉 Scan the QR code with your wallet.`);

                setForm({
                    type: 'MigrationIdentity',
                    firstName: '',
                    lastName: '',
                    dateOfBirth: '',
                    nationality: '',
                    passportNumber: '',
                });

                setSelectedCredential(newCredential);
                setShowQRDialog(true);
            } else {
                setError(result.error || 'Failed to issue credential');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const createVerificationRequest = async () => {
        if (verificationTypes.length === 0) {
            setError('Please select at least one credential type to verify');
            return;
        }

        setIsLoading(true);
        clearMessages();

        try {
            const result = await unicoreService.createVerificationRequest(verificationTypes);

            if (result.success) {
                const newVerification: VerificationRequest = {
                    id: result.authorizationRequestId!,
                    types: verificationTypes,
                    authorizationUrl: result.authorizationUrl!,
                    timestamp: new Date().toISOString(),
                    status: 'active',
                };

                setVerificationRequests(prev => [newVerification, ...prev]);
                setSuccess('Verification request created successfully! 🔍');

                setSelectedCredential({
                    id: newVerification.id,
                    type: 'Verification Request',
                    offerUrl: newVerification.authorizationUrl,
                    timestamp: newVerification.timestamp,
                    status: 'issued',
                });
                setShowQRDialog(true);
            } else {
                setError(result.error || 'Failed to create verification request');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const showCredentialQR = (credential: IssuedCredential) => {
        setSelectedCredential(credential);
        setShowQRDialog(true);
    };

    const showCredentialDetails = (credential: IssuedCredential) => {
        setSelectedCredential(credential);
        setShowDetailsDialog(true);
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setSuccess('Copied to clipboard! 📋');
        } catch {
            setError('Failed to copy to clipboard');
        }
    };

    const clearAllCredentials = () => {
        if (confirm('Are you sure you want to clear all credentials?')) {
            setIssuedCredentials([]);
            setSuccess('All credentials cleared');
        }
    };

    const clearAllVerifications = () => {
        if (confirm('Are you sure you want to clear all verification requests?')) {
            setVerificationRequests([]);
            setSuccess('All verification requests cleared');
        }
    };

    const testUniCoreFlow = async () => {
        setIsLoading(true);
        clearMessages();

        try {
            const result = await unicoreService.testUniCoreFlow();

            if (result.success) {
                setSuccess('UniCore flow test completed successfully! ✅');
            } else {
                setError(result.error || 'UniCore flow test failed');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Test failed');
        } finally {
            setIsLoading(false);
        }
    };

    const renderHealthStatus = () => (
        <Card size="2" style={{ marginBottom: '1rem', background: healthStatus?.api ? 'var(--green-2)' : 'var(--red-2)' }}>
            <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                    {healthStatus?.api ? (
                        <CheckCircledIcon width="20" height="20" color="var(--green-11)" />
                    ) : (
                        <ExclamationTriangleIcon width="20" height="20" color="var(--red-11)" />
                    )}
                    <Box>
                        <Text size="2" weight="bold">
                            UniCore Service: {healthStatus?.api ? 'Connected' : 'Disconnected'}
                        </Text>
                        {healthStatus?.api && (
                            <Text size="1" color="gray" style={{ display: 'block' }}>
                                Ready to issue and verify credentials
                            </Text>
                        )}
                    </Box>
                </Flex>
                <Flex gap="2">
                    <Button size="1" variant="soft" onClick={checkHealth} disabled={isLoading}>
                        <ReloadIcon />
                        Refresh
                    </Button>
                    <Button size="1" variant="soft" onClick={testUniCoreFlow} disabled={isLoading}>
                        Test Flow
                    </Button>
                </Flex>
            </Flex>
            {healthStatus?.error && (
                <Text size="1" color="red" style={{ marginTop: '0.5rem', display: 'block' }}>
                    {healthStatus.error}
                </Text>
            )}
        </Card>
    );

    const renderCredentialTypeFields = () => {
        if (form.type === 'WorkPermit') {
            return (
                <Grid columns="2" gap="3">
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Employer ID *
                        </Text>
                        <TextField.Root
                            value={form.employerId || ''}
                            onChange={(e) => handleInputChange('employerId', e.target.value)}
                            placeholder="Enter employer ID"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Position *
                        </Text>
                        <TextField.Root
                            value={form.position || ''}
                            onChange={(e) => handleInputChange('position', e.target.value)}
                            placeholder="Enter position"
                        />
                    </Box>
                    <Box style={{ gridColumn: 'span 2' }}>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Valid Until *
                        </Text>
                        <TextField.Root
                            type="date"
                            value={form.validUntil || ''}
                            onChange={(e) => handleInputChange('validUntil', e.target.value)}
                        />
                    </Box>
                </Grid>
            );
        }
        return null;
    };

    const renderCredentialCard = (credential: IssuedCredential) => (
        <Card key={credential.id} size="2" style={{ background: 'var(--gray-2)' }}>
            <Flex justify="between" align="start">
                <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Flex align="center" gap="2">
                        <Avatar size="2" fallback={credential.type.charAt(0)} color="blue" />
                        <Box>
                            <Text size="3" weight="bold">{getCredentialDisplayName(credential.type)}</Text>
                            <Badge color={credential.status === 'issued' ? 'green' : 'orange'} size="1">
                                {credential.status}
                            </Badge>
                        </Box>
                    </Flex>
                    <Text size="1" color="gray">ID: {credential.id.substring(0, 30)}...</Text>
                    <Text size="1" color="gray">
                        Issued: {new Date(credential.timestamp).toLocaleString()}
                    </Text>
                </Flex>
                <Flex gap="1">
                    <IconButton
                        size="2"
                        variant="soft"
                        onClick={() => showCredentialQR(credential)}
                        title="Show QR Code"
                    >
                        <Share1Icon />
                    </IconButton>
                    <IconButton
                        size="2"
                        variant="soft"
                        onClick={() => showCredentialDetails(credential)}
                        title="View Details"
                    >
                        <EyeOpenIcon />
                    </IconButton>
                </Flex>
            </Flex>
        </Card>
    );

    const renderVerificationCard = (verification: VerificationRequest) => (
        <Card key={verification.id} size="2" style={{ background: 'var(--blue-2)' }}>
            <Flex justify="between" align="start">
                <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Flex align="center" gap="2">
                        <Avatar size="2" fallback="V" color="blue" />
                        <Box>
                            <Text size="3" weight="bold">Verification Request</Text>
                            <Badge color={verification.status === 'active' ? 'blue' : 'gray'} size="1">
                                {verification.status}
                            </Badge>
                        </Box>
                    </Flex>
                    <Text size="1" color="gray">
                        Types: {verification.types.map(t => getCredentialDisplayName(t)).join(', ')}
                    </Text>
                    <Text size="1" color="gray">
                        Created: {new Date(verification.timestamp).toLocaleString()}
                    </Text>
                </Flex>
                <IconButton
                    size="2"
                    variant="soft"
                    onClick={() => showCredentialQR({
                        id: verification.id,
                        type: 'Verification Request',
                        offerUrl: verification.authorizationUrl,
                        timestamp: verification.timestamp,
                        status: 'issued',
                    })}
                    title="Show QR Code"
                >
                    <Share1Icon />
                </IconButton>
            </Flex>
        </Card>
    );

    return (
        <Box style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
            <Flex direction="column" gap="4" style={{ marginBottom: '2rem' }}>
                <Flex justify="between" align="center">
                    <Box>
                        <Heading size="7">🎯 Digital Credentials Manager</Heading>
                        <Text color="gray" size="3">
                            Complete credential issuance, verification, and management system
                        </Text>
                    </Box>
                    <Badge size="3" color="blue">
                        MVP v1.0
                    </Badge>
                </Flex>

                {renderHealthStatus()}

                {error && (
                    <Callout.Root color="red">
                        <Callout.Icon>
                            <Cross2Icon />
                        </Callout.Icon>
                        <Callout.Text>{error}</Callout.Text>
                    </Callout.Root>
                )}

                {success && (
                    <Callout.Root color="green">
                        <Callout.Icon>
                            <CheckIcon />
                        </Callout.Icon>
                        <Callout.Text>{success}</Callout.Text>
                    </Callout.Root>
                )}

                <Card size="2" style={{ background: 'var(--blue-2)' }}>
                    <Flex align="start" gap="2">
                        <InfoCircledIcon width="20" height="20" color="var(--blue-11)" />
                        <Box>
                            <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '0.25rem' }}>
                                About Credential Display
                            </Text>
                            <Text size="1" color="gray">
                                If your wallet shows "Verifiable Credential" instead of specific types (Migration Identity, Work Permit, etc.),
                                you need to configure UniCore with specific credential types. See <strong>UNICORE_SETUP_GUIDE.md</strong> for instructions.
                            </Text>
                        </Box>
                    </Flex>
                </Card>
            </Flex>

            {/* Rest of the component - keeping the same tab structure from ModernCredentialsManager */}
            {/* ... (Issue, Verify, Manage tabs with the same content) */}

            {/* QR Code and Details dialogs - keeping the same from ModernCredentialsManager */}
        </Box>
    );
};