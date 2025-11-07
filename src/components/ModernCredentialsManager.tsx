/**
 * Modern Credentials Manager with Complete UniCore Integration
 * Features: Issuance, Verification, QR Generation, and Presentation flows
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
    IconButton
} from '@radix-ui/themes';
import {
    PlusIcon,
    CheckIcon,
    Cross2Icon,
    EyeOpenIcon,
    Share1Icon,
    ReloadIcon,

} from '@radix-ui/react-icons';
import { unicoreService } from '../services/unicore/unicoreService';
import { QRCodeGenerator } from './QRCodeGenerator';

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
    healthRecordId?: string;
    vaccinationStatus?: string;
    bloodType?: string;
    allergies?: string;
    certificationName?: string;
    certificationLevel?: string;
    issuingOrganization?: string;
    certificationNumber?: string;
    issueDate?: string;
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

export const ModernCredentialsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState('issue');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [healthStatus, setHealthStatus] = useState<ServiceHealth | null>(null);

    const [form, setForm] = useState<CredentialForm>({
        type: 'VerifiableCredential',
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

    const [verificationTypes, setVerificationTypes] = useState<string[]>(['VerifiableCredential']);

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

            if (configIds.length === 0) {
                setError('No credential configurations found in UniCore. Please configure credential types first.');
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
            healthRecordId: '',
            vaccinationStatus: '',
            bloodType: '',
            allergies: '',
            certificationName: '',
            certificationLevel: '',
            issuingOrganization: '',
            certificationNumber: '',
            issueDate: '',
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

        if (form.type === 'HealthRecord') {
            if (!form.healthRecordId?.trim()) {
                setError('Please fill in health record ID');
                return false;
            }
        }

        if (form.type === 'SkillCertification') {
            if (!form.certificationName?.trim() || !form.issuingOrganization?.trim() || !form.issueDate) {
                setError('Please fill in all required skill certification fields');
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
                    ...(form.healthRecordId && { health_record_id: form.healthRecordId }),
                    ...(form.vaccinationStatus && { vaccination_status: form.vaccinationStatus }),
                    ...(form.bloodType && { blood_type: form.bloodType }),
                    ...(form.allergies && { allergies: form.allergies }),
                    ...(form.certificationName && { certification_name: form.certificationName }),
                    ...(form.certificationLevel && { certification_level: form.certificationLevel }),
                    ...(form.issuingOrganization && { issuing_organization: form.issuingOrganization }),
                    ...(form.certificationNumber && { certification_number: form.certificationNumber }),
                    ...(form.issueDate && { issue_date: form.issueDate }),
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
                setSuccess(`${form.type} credential issued successfully!`);

                setForm({
                    type: 'MigrationIdentity',
                    firstName: '',
                    lastName: '',
                    dateOfBirth: '',
                    nationality: '',
                    passportNumber: '',
                    employerId: '',
                    position: '',
                    validUntil: '',
                    healthRecordId: '',
                    vaccinationStatus: '',
                    bloodType: '',
                    allergies: '',
                    certificationName: '',
                    certificationLevel: '',
                    issuingOrganization: '',
                    certificationNumber: '',
                    issueDate: '',
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
                setSuccess('Verification request created successfully!');

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
            setSuccess('Copied to clipboard!');
        } catch {
            setError('Failed to copy to clipboard');
        }
    };

    const clearAllCredentials = () => {
        setIssuedCredentials([]);
        setSuccess('All credentials cleared');
    };

    const clearAllVerifications = () => {
        setVerificationRequests([]);
        setSuccess('All verification requests cleared');
    };

    const testUniCoreFlow = async () => {
        setIsLoading(true);
        clearMessages();

        try {
            const result = await unicoreService.testUniCoreFlow();

            if (result.success) {
                setSuccess('UniCore flow test completed successfully!');
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
        <Card size="2" style={{ marginBottom: '1rem' }}>
            <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: healthStatus?.api ? '#10b981' : '#ef4444'
                        }}
                    />
                    <Text size="2" weight="medium">
                        UniCore Service: {healthStatus?.api ? 'Connected' : 'Disconnected'}
                    </Text>
                </Flex>
                <Flex gap="2">
                    <Button size="1" variant="soft" onClick={checkHealth}>
                        <ReloadIcon />
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

        if (form.type === 'HealthRecord') {
            return (
                <Grid columns="2" gap="3">
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Health Record ID *
                        </Text>
                        <TextField.Root
                            value={form.healthRecordId || ''}
                            onChange={(e) => handleInputChange('healthRecordId', e.target.value)}
                            placeholder="Enter health record ID"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Blood Type
                        </Text>
                        <Select.Root
                            value={form.bloodType || 'Unknown'}
                            onValueChange={(value) => handleInputChange('bloodType', value)}
                        >
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="A+">A+</Select.Item>
                                <Select.Item value="A-">A-</Select.Item>
                                <Select.Item value="B+">B+</Select.Item>
                                <Select.Item value="B-">B-</Select.Item>
                                <Select.Item value="AB+">AB+</Select.Item>
                                <Select.Item value="AB-">AB-</Select.Item>
                                <Select.Item value="O+">O+</Select.Item>
                                <Select.Item value="O-">O-</Select.Item>
                                <Select.Item value="Unknown">Unknown</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Vaccination Status
                        </Text>
                        <Select.Root
                            value={form.vaccinationStatus || 'Unknown'}
                            onValueChange={(value) => handleInputChange('vaccinationStatus', value)}
                        >
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="Fully Vaccinated">Fully Vaccinated</Select.Item>
                                <Select.Item value="Partially Vaccinated">Partially Vaccinated</Select.Item>
                                <Select.Item value="Not Vaccinated">Not Vaccinated</Select.Item>
                                <Select.Item value="Unknown">Unknown</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Allergies
                        </Text>
                        <TextField.Root
                            value={form.allergies || ''}
                            onChange={(e) => handleInputChange('allergies', e.target.value)}
                            placeholder="Enter allergies (or 'None')"
                        />
                    </Box>
                </Grid>
            );
        }

        if (form.type === 'SkillCertification') {
            return (
                <Grid columns="2" gap="3">
                    <Box style={{ gridColumn: 'span 2' }}>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Certification Name *
                        </Text>
                        <TextField.Root
                            value={form.certificationName || ''}
                            onChange={(e) => handleInputChange('certificationName', e.target.value)}
                            placeholder="e.g., AWS Certified Solutions Architect"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Certification Level
                        </Text>
                        <Select.Root
                            value={form.certificationLevel || 'Intermediate'}
                            onValueChange={(value) => handleInputChange('certificationLevel', value)}
                        >
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="Beginner">Beginner</Select.Item>
                                <Select.Item value="Intermediate">Intermediate</Select.Item>
                                <Select.Item value="Advanced">Advanced</Select.Item>
                                <Select.Item value="Expert">Expert</Select.Item>
                                <Select.Item value="Professional">Professional</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Issuing Organization *
                        </Text>
                        <TextField.Root
                            value={form.issuingOrganization || ''}
                            onChange={(e) => handleInputChange('issuingOrganization', e.target.value)}
                            placeholder="e.g., Amazon Web Services"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Certification Number
                        </Text>
                        <TextField.Root
                            value={form.certificationNumber || ''}
                            onChange={(e) => handleInputChange('certificationNumber', e.target.value)}
                            placeholder="Enter certification number"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Issue Date *
                        </Text>
                        <TextField.Root
                            type="date"
                            value={form.issueDate || ''}
                            onChange={(e) => handleInputChange('issueDate', e.target.value)}
                        />
                    </Box>
                </Grid>
            );
        }

        return null;
    };

    const renderCredentialCard = (credential: IssuedCredential) => (
        <Card key={credential.id} size="2">
            <Flex justify="between" align="start">
                <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Flex align="center" gap="2">
                        <Avatar size="1" fallback={credential.type.charAt(0)} />
                        <Text size="3" weight="bold">{credential.type}</Text>
                        <Badge color={credential.status === 'issued' ? 'green' : 'orange'}>
                            {credential.status}
                        </Badge>
                    </Flex>
                    <Text size="1" color="gray">ID: {credential.id}</Text>
                    <Text size="1" color="gray">
                        Issued: {new Date(credential.timestamp).toLocaleString()}
                    </Text>
                </Flex>
                <Flex gap="1">
                    <IconButton
                        size="1"
                        variant="soft"
                        onClick={() => showCredentialQR(credential)}
                        title="Show QR Code"
                    >
                        <Share1Icon />
                    </IconButton>
                    <IconButton
                        size="1"
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
        <Card key={verification.id} size="2">
            <Flex justify="between" align="start">
                <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Flex align="center" gap="2">
                        <Avatar size="1" fallback="V" />
                        <Text size="3" weight="bold">Verification Request</Text>
                        <Badge color={verification.status === 'active' ? 'blue' : 'gray'}>
                            {verification.status}
                        </Badge>
                    </Flex>
                    <Text size="1" color="gray">Types: {verification.types.join(', ')}</Text>
                    <Text size="1" color="gray">
                        Created: {new Date(verification.timestamp).toLocaleString()}
                    </Text>
                </Flex>
                <IconButton
                    size="1"
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
                <Heading size="6">🎯 UniCore Credentials Manager</Heading>
                <Text color="gray">
                    Complete credential issuance, verification, and management with all 18 UniCore APIs
                </Text>

                {renderHealthStatus()}

                {error && (
                    <Card size="2" style={{ backgroundColor: 'var(--red-2)', border: '1px solid var(--red-6)' }}>
                        <Flex align="center" gap="2">
                            <Cross2Icon color="var(--red-11)" />
                            <Text color="red" size="2">{error}</Text>
                        </Flex>
                    </Card>
                )}

                {success && (
                    <Card size="2" style={{ backgroundColor: 'var(--green-2)', border: '1px solid var(--green-6)' }}>
                        <Flex align="center" gap="2">
                            <CheckIcon color="var(--green-11)" />
                            <Text color="green" size="2">{success}</Text>
                        </Flex>
                    </Card>
                )}
            </Flex>

            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                <Tabs.List size="2">
                    <Tabs.Trigger value="issue">Issue Credentials</Tabs.Trigger>
                    <Tabs.Trigger value="verify">Verify Credentials</Tabs.Trigger>
                    <Tabs.Trigger value="manage">Manage</Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="issue">
                    <Card size="3" style={{ marginTop: '1rem' }}>
                        <Flex direction="column" gap="4">
                            <Heading size="4">Issue New Credential</Heading>

                            <Box>
                                <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    Credential Type
                                </Text>
                                <Select.Root value={form.type} onValueChange={handleCredentialTypeChange}>
                                    <Select.Trigger />
                                    <Select.Content>
                                        <Select.Item value="VerifiableCredential">Verifiable Credential</Select.Item>
                                        <Select.Item value="MigrationIdentity">Migration Identity</Select.Item>
                                        <Select.Item value="WorkPermit">Work Permit</Select.Item>
                                        <Select.Item value="HealthRecord">Health Record</Select.Item>
                                        <Select.Item value="SkillCertification">Skill Certification</Select.Item>
                                    </Select.Content>
                                </Select.Root>
                            </Box>

                            <Grid columns="2" gap="3">
                                <Box>
                                    <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                        First Name *
                                    </Text>
                                    <TextField.Root
                                        value={form.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        placeholder="Enter first name"
                                    />
                                </Box>

                                <Box>
                                    <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                        Last Name *
                                    </Text>
                                    <TextField.Root
                                        value={form.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        placeholder="Enter last name"
                                    />
                                </Box>

                                <Box>
                                    <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                        Date of Birth *
                                    </Text>
                                    <TextField.Root
                                        type="date"
                                        value={form.dateOfBirth}
                                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                    />
                                </Box>

                                <Box>
                                    <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                        Nationality *
                                    </Text>
                                    <TextField.Root
                                        value={form.nationality}
                                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                                        placeholder="Enter nationality"
                                    />
                                </Box>
                            </Grid>

                            {(form.type === 'MigrationIdentity' || form.type === 'WorkPermit') && (
                                <Box>
                                    <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                        Passport Number
                                    </Text>
                                    <TextField.Root
                                        value={form.passportNumber || ''}
                                        onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                                        placeholder="Enter passport number"
                                    />
                                </Box>
                            )}

                            {renderCredentialTypeFields()}

                            <Button
                                size="3"
                                onClick={issueCredential}
                                disabled={isLoading || !healthStatus?.api}
                                style={{ alignSelf: 'flex-start' }}
                            >
                                <PlusIcon />
                                {isLoading ? 'Issuing...' : `Issue ${form.type}`}
                            </Button>
                        </Flex>
                    </Card>
                </Tabs.Content>

                <Tabs.Content value="verify">
                    <Card size="3" style={{ marginTop: '1rem' }}>
                        <Flex direction="column" gap="4">
                            <Heading size="4">Create Verification Request</Heading>

                            <Box>
                                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '1rem' }}>
                                    Option 1: Verify by Credential Type
                                </Text>
                                <Text size="2" color="gray" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    Request any credential of a specific type
                                </Text>
                                <Box style={{ marginBottom: '1rem' }}>
                                    <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                        Credential Type
                                    </Text>
                                    <Select.Root
                                        value={verificationTypes[0] || 'VerifiableCredential'}
                                        onValueChange={(value) => setVerificationTypes([value])}
                                    >
                                        <Select.Trigger />
                                        <Select.Content>
                                            <Select.Item value="VerifiableCredential">Verifiable Credential</Select.Item>
                                            <Select.Item value="MigrationIdentity">Migration Identity</Select.Item>
                                            <Select.Item value="WorkPermit">Work Permit</Select.Item>
                                            <Select.Item value="HealthRecord">Health Record</Select.Item>
                                            <Select.Item value="SkillCertification">Skill Certification</Select.Item>
                                        </Select.Content>
                                    </Select.Root>
                                </Box>
                                <Button
                                    size="2"
                                    onClick={createVerificationRequest}
                                    disabled={isLoading || !healthStatus?.api}
                                >
                                    <CheckIcon />
                                    {isLoading ? 'Creating...' : 'Create Verification Request'}
                                </Button>
                            </Box>

                            <Separator />

                            {issuedCredentials.length > 0 && (
                                <Box>
                                    <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '1rem' }}>
                                        Option 2: Verify Specific Issued Credential
                                    </Text>
                                    <Text size="2" color="gray" style={{ display: 'block', marginBottom: '1rem' }}>
                                        Request presentation of a specific credential you issued
                                    </Text>
                                    <Flex direction="column" gap="2">
                                        {issuedCredentials.slice(0, 5).map((credential) => (
                                            <Card key={credential.id} size="1">
                                                <Flex justify="between" align="center">
                                                    <Flex direction="column" gap="1">
                                                        <Text size="2" weight="bold">{credential.type}</Text>
                                                        <Text size="1" color="gray">ID: {credential.id.substring(0, 20)}...</Text>
                                                    </Flex>
                                                    <Button
                                                        size="1"
                                                        variant="soft"
                                                        onClick={async () => {
                                                            setIsLoading(true);
                                                            clearMessages();
                                                            try {
                                                                const result = await unicoreService.createVerificationForCredential(
                                                                    credential.type
                                                                );
                                                                if (result.success) {
                                                                    const newVerification: VerificationRequest = {
                                                                        id: result.authorizationRequestId!,
                                                                        types: [credential.type],
                                                                        authorizationUrl: result.authorizationUrl!,
                                                                        timestamp: new Date().toISOString(),
                                                                        status: 'active',
                                                                    };
                                                                    setVerificationRequests(prev => [newVerification, ...prev]);
                                                                    setSuccess(`Verification request created for ${credential.type}!`);
                                                                    setSelectedCredential({
                                                                        id: newVerification.id,
                                                                        type: 'Verification Request',
                                                                        offerUrl: newVerification.authorizationUrl,
                                                                        timestamp: newVerification.timestamp,
                                                                        status: 'issued',
                                                                    });
                                                                    setShowQRDialog(true);
                                                                } else {
                                                                    setError(result.error || 'Failed to create verification');
                                                                }
                                                            } catch (error) {
                                                                setError(error instanceof Error ? error.message : 'Unknown error');
                                                            } finally {
                                                                setIsLoading(false);
                                                            }
                                                        }}
                                                        disabled={isLoading}
                                                    >
                                                        Request Proof
                                                    </Button>
                                                </Flex>
                                            </Card>
                                        ))}
                                    </Flex>
                                </Box>
                            )}

                            {verificationRequests.length > 0 && (
                                <Box>
                                    <Separator style={{ margin: '1rem 0' }} />
                                    <Flex justify="between" align="center" style={{ marginBottom: '1rem' }}>
                                        <Heading size="3">Verification Requests ({verificationRequests.length})</Heading>
                                        <Button size="1" variant="soft" color="red" onClick={clearAllVerifications}>
                                            Clear All
                                        </Button>
                                    </Flex>
                                    <Flex direction="column" gap="2">
                                        {verificationRequests.map(renderVerificationCard)}
                                    </Flex>
                                </Box>
                            )}
                        </Flex>
                    </Card>
                </Tabs.Content>

                <Tabs.Content value="manage">
                    <Card size="3" style={{ marginTop: '1rem' }}>
                        <Flex direction="column" gap="4">
                            <Flex justify="between" align="center">
                                <Heading size="4">Issued Credentials ({issuedCredentials.length})</Heading>
                                {issuedCredentials.length > 0 && (
                                    <Button size="2" variant="soft" color="red" onClick={clearAllCredentials}>
                                        Clear All
                                    </Button>
                                )}
                            </Flex>

                            {issuedCredentials.length === 0 ? (
                                <Box style={{ textAlign: 'center', padding: '2rem' }}>
                                    <Text color="gray">No credentials issued yet</Text>
                                </Box>
                            ) : (
                                <Flex direction="column" gap="2">
                                    {issuedCredentials.map(renderCredentialCard)}
                                </Flex>
                            )}
                        </Flex>
                    </Card>
                </Tabs.Content>
            </Tabs.Root>

            <Dialog.Root open={showQRDialog} onOpenChange={setShowQRDialog}>
                <Dialog.Content style={{ maxWidth: '500px' }}>
                    <Dialog.Title>QR Code - {selectedCredential?.type}</Dialog.Title>
                    <Dialog.Description>
                        Scan this QR code with UniMe wallet or any compatible wallet
                    </Dialog.Description>

                    <Flex direction="column" align="center" gap="4" style={{ margin: '2rem 0' }}>
                        {selectedCredential && (
                            <>
                                <QRCodeGenerator
                                    data={selectedCredential.offerUrl}
                                    size={300}
                                />
                                <Button
                                    variant="soft"
                                    onClick={() => copyToClipboard(selectedCredential.offerUrl)}
                                >
                                    Copy Offer URL
                                </Button>
                            </>
                        )}
                    </Flex>

                    <Flex gap="3" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">Close</Button>
                        </Dialog.Close>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <Dialog.Content style={{ maxWidth: '700px' }}>
                    <Dialog.Title>Credential Details</Dialog.Title>

                    {selectedCredential && (
                        <Flex direction="column" gap="4" style={{ margin: '1rem 0' }}>
                            <Box style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                                <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '1rem' }}>
                                    Scan to Claim Credential
                                </Text>
                                <Flex justify="center" style={{ marginBottom: '1rem' }}>
                                    <QRCodeGenerator
                                        data={selectedCredential.offerUrl}
                                        size={200}
                                    />
                                </Flex>
                                <Button
                                    size="1"
                                    variant="soft"
                                    onClick={() => copyToClipboard(selectedCredential.offerUrl)}
                                >
                                    Copy Offer URL
                                </Button>
                            </Box>

                            <Box>
                                <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    Credential Information
                                </Text>
                                <ScrollArea style={{ maxHeight: '300px' }}>
                                    <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                                        <pre style={{ fontSize: '12px', overflow: 'auto', margin: 0 }}>
                                            {JSON.stringify(selectedCredential, null, 2)}
                                        </pre>
                                    </Box>
                                </ScrollArea>
                            </Box>
                        </Flex>
                    )}

                    <Flex gap="3" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">Close</Button>
                        </Dialog.Close>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </Box>
    );
};