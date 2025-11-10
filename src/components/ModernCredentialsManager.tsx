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
    Callout
} from '@radix-ui/themes';
import {
    PlusIcon,
    CheckIcon,
    Cross2Icon,
    EyeOpenIcon,
    Share1Icon,
    ReloadIcon,
    InfoCircledIcon
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
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    employerName?: string;
    position?: string;
    workCountry?: string;
    validFrom?: string;
    validUntil?: string;
    skillName?: string;
    skillLevel?: string;
    certificationBody?: string;
    certificationNumber?: string;
    healthRecordId?: string;
    bloodType?: string;
    vaccinationStatus?: string;
    allergies?: string;
    degree?: string;
    institution?: string;
    graduationYear?: string;
    fieldOfStudy?: string;
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
        type: 'TravelDocument',
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

    const [verificationTypes, setVerificationTypes] = useState<string[]>(['TravelDocument']);

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
            setError('Please fill in all required fields (Name, Date of Birth, Nationality)');
            return false;
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
                    ...(form.documentNumber && { document_number: form.documentNumber }),
                    ...(form.issueDate && { issue_date: form.issueDate }),
                    ...(form.expiryDate && { expiry_date: form.expiryDate }),
                    ...(form.employerName && { employer_name: form.employerName }),
                    ...(form.position && { position: form.position }),
                    ...(form.workCountry && { work_country: form.workCountry }),
                    ...(form.validFrom && { valid_from: form.validFrom }),
                    ...(form.validUntil && { valid_until: form.validUntil }),
                    ...(form.skillName && { skill_name: form.skillName }),
                    ...(form.skillLevel && { skill_level: form.skillLevel }),
                    ...(form.certificationBody && { certification_body: form.certificationBody }),
                    ...(form.certificationNumber && { certification_number: form.certificationNumber }),
                    ...(form.healthRecordId && { health_record_id: form.healthRecordId }),
                    ...(form.bloodType && { blood_type: form.bloodType }),
                    ...(form.vaccinationStatus && { vaccination_status: form.vaccinationStatus }),
                    ...(form.allergies && { allergies: form.allergies }),
                    ...(form.degree && { degree: form.degree }),
                    ...(form.institution && { institution: form.institution }),
                    ...(form.graduationYear && { graduation_year: form.graduationYear }),
                    ...(form.fieldOfStudy && { field_of_study: form.fieldOfStudy }),
                },
                ...(form.validUntil && { expirationDate: form.validUntil }),
                ...(form.expiryDate && { expirationDate: form.expiryDate }),
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
                    type: 'TravelDocument',
                    firstName: '',
                    lastName: '',
                    dateOfBirth: '',
                    nationality: '',
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

    const getCredentialColor = (type: string): 'blue' | 'green' | 'purple' | 'red' | 'orange' => {
        const colorMap: Record<string, 'blue' | 'green' | 'purple' | 'red' | 'orange'> = {
            'TravelDocument': 'blue',
            'WorkAuthorization': 'green',
            'ProfessionalSkills': 'purple',
            'HealthRecord': 'red',
            'EducationCredential': 'orange'
        };
        return colorMap[type] || 'blue';
    };

    const getCredentialEmoji = (type: string): string => {
        const emojiMap: Record<string, string> = {
            'TravelDocument': '🛂',
            'WorkAuthorization': '💼',
            'ProfessionalSkills': '🎓',
            'HealthRecord': '🏥',
            'EducationCredential': '📚'
        };
        return emojiMap[type] || '📄';
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
        if (form.type === 'TravelDocument') {
            return (
                <Grid columns="2" gap="3">
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Document Number
                        </Text>
                        <TextField.Root
                            value={form.documentNumber || ''}
                            onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                            placeholder="Travel document number"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Issue Date
                        </Text>
                        <TextField.Root
                            type="date"
                            value={form.issueDate || ''}
                            onChange={(e) => handleInputChange('issueDate', e.target.value)}
                        />
                    </Box>
                    <Box style={{ gridColumn: 'span 2' }}>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Expiry Date
                        </Text>
                        <TextField.Root
                            type="date"
                            value={form.expiryDate || ''}
                            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                        />
                    </Box>
                </Grid>
            );
        }

        if (form.type === 'WorkAuthorization') {
            return (
                <Grid columns="2" gap="3">
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Employer Name
                        </Text>
                        <TextField.Root
                            value={form.employerName || ''}
                            onChange={(e) => handleInputChange('employerName', e.target.value)}
                            placeholder="Company or organization name"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Position
                        </Text>
                        <TextField.Root
                            value={form.position || ''}
                            onChange={(e) => handleInputChange('position', e.target.value)}
                            placeholder="Job title or role"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Work Country
                        </Text>
                        <TextField.Root
                            value={form.workCountry || ''}
                            onChange={(e) => handleInputChange('workCountry', e.target.value)}
                            placeholder="Country of employment"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Valid From
                        </Text>
                        <TextField.Root
                            type="date"
                            value={form.validFrom || ''}
                            onChange={(e) => handleInputChange('validFrom', e.target.value)}
                        />
                    </Box>
                    <Box style={{ gridColumn: 'span 2' }}>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Valid Until
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

        if (form.type === 'ProfessionalSkills') {
            return (
                <Grid columns="2" gap="3">
                    <Box style={{ gridColumn: 'span 2' }}>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Skill Name
                        </Text>
                        <TextField.Root
                            value={form.skillName || ''}
                            onChange={(e) => handleInputChange('skillName', e.target.value)}
                            placeholder="e.g., Software Development, Nursing"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Skill Level
                        </Text>
                        <Select.Root
                            value={form.skillLevel || 'Intermediate'}
                            onValueChange={(value) => handleInputChange('skillLevel', value)}
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
                            Certification Body
                        </Text>
                        <TextField.Root
                            value={form.certificationBody || ''}
                            onChange={(e) => handleInputChange('certificationBody', e.target.value)}
                            placeholder="Issuing organization"
                        />
                    </Box>
                    <Box style={{ gridColumn: 'span 2' }}>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Certification Number
                        </Text>
                        <TextField.Root
                            value={form.certificationNumber || ''}
                            onChange={(e) => handleInputChange('certificationNumber', e.target.value)}
                            placeholder="Certificate ID or number"
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

        if (form.type === 'EducationCredential') {
            return (
                <Grid columns="2" gap="3">
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Degree
                        </Text>
                        <TextField.Root
                            value={form.degree || ''}
                            onChange={(e) => handleInputChange('degree', e.target.value)}
                            placeholder="e.g., Bachelor of Science"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Field of Study
                        </Text>
                        <TextField.Root
                            value={form.fieldOfStudy || ''}
                            onChange={(e) => handleInputChange('fieldOfStudy', e.target.value)}
                            placeholder="e.g., Computer Science"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Institution
                        </Text>
                        <TextField.Root
                            value={form.institution || ''}
                            onChange={(e) => handleInputChange('institution', e.target.value)}
                            placeholder="University or college name"
                        />
                    </Box>
                    <Box>
                        <Text size="2" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Graduation Year
                        </Text>
                        <TextField.Root
                            value={form.graduationYear || ''}
                            onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                            placeholder="e.g., 2020"
                        />
                    </Box>
                </Grid>
            );
        }

        return null;
    };

    const renderCredentialCard = (credential: IssuedCredential) => (
        <Card key={credential.id} size="2" style={{
            borderLeft: `4px solid var(--${getCredentialColor(credential.type)}-9)`,
            background: `linear-gradient(135deg, var(--${getCredentialColor(credential.type)}-2) 0%, var(--gray-2) 100%)`
        }}>
            <Flex justify="between" align="start">
                <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Flex align="center" gap="2">
                        <Text size="4">{getCredentialEmoji(credential.type)}</Text>
                        <Text size="3" weight="bold">{credential.type}</Text>
                        <Badge color={getCredentialColor(credential.type)}>
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
                <Flex direction="column" gap="2">
                    <Heading size="8" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        🌍 Borderless Identity
                    </Heading>
                    <Text size="4" color="gray">
                        Decentralized credentials for migrants, nomads, and global workers
                    </Text>
                    <Callout.Root size="1" style={{ marginTop: '0.5rem' }}>
                        <Callout.Icon>
                            <InfoCircledIcon />
                        </Callout.Icon>
                        <Callout.Text>
                            Maintain and authenticate your identity across borders without relying on traditional state-based IDs
                        </Callout.Text>
                    </Callout.Root>
                </Flex>

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
                    <Tabs.Trigger value="issue">🌍 Issue Credentials</Tabs.Trigger>
                    <Tabs.Trigger value="verify">✅ Verify Credentials</Tabs.Trigger>
                    <Tabs.Trigger value="manage">📋 My Credentials</Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="issue">
                    <Card size="4" style={{ marginTop: '1.5rem', padding: '2rem' }}>
                        <Flex direction="column" gap="6">
                            <Heading size="6" style={{ color: 'var(--blue-11)' }}>Issue New Credential</Heading>

                            <Box>
                                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '1rem' }}>
                                    Select Credential Type
                                </Text>
                                <Grid columns="1" gap="3" style={{ marginBottom: '1rem' }}>
                                    <Card
                                        style={{
                                            cursor: 'pointer',
                                            border: form.type === 'TravelDocument' ? '2px solid var(--blue-9)' : '1px solid var(--gray-6)',
                                            background: form.type === 'TravelDocument' ? 'var(--blue-3)' : 'var(--gray-2)'
                                        }}
                                        onClick={() => handleCredentialTypeChange('TravelDocument')}
                                    >
                                        <Flex gap="3" align="center">
                                            <Text size="6">🛂</Text>
                                            <Flex direction="column" gap="1">
                                                <Text size="3" weight="bold">Travel Document</Text>
                                                <Text size="2" color="gray">International travel authorization - passport, visas, border crossing</Text>
                                            </Flex>
                                        </Flex>
                                    </Card>
                                    <Card
                                        style={{
                                            cursor: 'pointer',
                                            border: form.type === 'WorkAuthorization' ? '2px solid var(--green-9)' : '1px solid var(--gray-6)',
                                            background: form.type === 'WorkAuthorization' ? 'var(--green-3)' : 'var(--gray-2)'
                                        }}
                                        onClick={() => handleCredentialTypeChange('WorkAuthorization')}
                                    >
                                        <Flex gap="3" align="center">
                                            <Text size="6">💼</Text>
                                            <Flex direction="column" gap="1">
                                                <Text size="3" weight="bold">Work Authorization</Text>
                                                <Text size="2" color="gray">Legal right to work internationally - work permits, employment verification</Text>
                                            </Flex>
                                        </Flex>
                                    </Card>
                                    <Card
                                        style={{
                                            cursor: 'pointer',
                                            border: form.type === 'ProfessionalSkills' ? '2px solid var(--purple-9)' : '1px solid var(--gray-6)',
                                            background: form.type === 'ProfessionalSkills' ? 'var(--purple-3)' : 'var(--gray-2)'
                                        }}
                                        onClick={() => handleCredentialTypeChange('ProfessionalSkills')}
                                    >
                                        <Flex gap="3" align="center">
                                            <Text size="6">🎓</Text>
                                            <Flex direction="column" gap="1">
                                                <Text size="3" weight="bold">Professional Skills</Text>
                                                <Text size="2" color="gray">Verified skills and certifications - professional licenses, training certificates</Text>
                                            </Flex>
                                        </Flex>
                                    </Card>
                                    <Card
                                        style={{
                                            cursor: 'pointer',
                                            border: form.type === 'HealthRecord' ? '2px solid var(--red-9)' : '1px solid var(--gray-6)',
                                            background: form.type === 'HealthRecord' ? 'var(--red-3)' : 'var(--gray-2)'
                                        }}
                                        onClick={() => handleCredentialTypeChange('HealthRecord')}
                                    >
                                        <Flex gap="3" align="center">
                                            <Text size="6">🏥</Text>
                                            <Flex direction="column" gap="1">
                                                <Text size="3" weight="bold">Health Record</Text>
                                                <Text size="2" color="gray">Medical history for travel - vaccinations, blood type, health requirements</Text>
                                            </Flex>
                                        </Flex>
                                    </Card>
                                    <Card
                                        style={{
                                            cursor: 'pointer',
                                            border: form.type === 'EducationCredential' ? '2px solid var(--orange-9)' : '1px solid var(--gray-6)',
                                            background: form.type === 'EducationCredential' ? 'var(--orange-3)' : 'var(--gray-2)'
                                        }}
                                        onClick={() => handleCredentialTypeChange('EducationCredential')}
                                    >
                                        <Flex gap="3" align="center">
                                            <Text size="6">📚</Text>
                                            <Flex direction="column" gap="1">
                                                <Text size="3" weight="bold">Education Credential</Text>
                                                <Text size="2" color="gray">Academic qualifications - degrees, diplomas, transcripts</Text>
                                            </Flex>
                                        </Flex>
                                    </Card>
                                </Grid>
                            </Box>

                            <Box>
                                <Text size="4" weight="bold" style={{ display: 'block', marginBottom: '1rem', color: 'var(--gray-12)' }}>
                                    Personal Information
                                </Text>
                                <Grid columns="2" gap="4">
                                    <Box>
                                        <Text size="3" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                            First Name *
                                        </Text>
                                        <TextField.Root
                                            size="3"
                                            value={form.firstName}
                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                            placeholder="Enter first name"
                                        />
                                    </Box>

                                    <Box>
                                        <Text size="3" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                            Last Name *
                                        </Text>
                                        <TextField.Root
                                            size="3"
                                            value={form.lastName}
                                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            placeholder="Enter last name"
                                        />
                                    </Box>

                                    <Box>
                                        <Text size="3" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                            Date of Birth *
                                        </Text>
                                        <TextField.Root
                                            size="3"
                                            type="date"
                                            value={form.dateOfBirth}
                                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                        />
                                    </Box>

                                    <Box>
                                        <Text size="3" weight="medium" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                            Nationality *
                                        </Text>
                                        <TextField.Root
                                            size="3"
                                            value={form.nationality}
                                            onChange={(e) => handleInputChange('nationality', e.target.value)}
                                            placeholder="Enter nationality"
                                        />
                                    </Box>
                                </Grid>
                            </Box>

                            {form.type === 'TravelDocument' && (
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
                                size="4"
                                onClick={issueCredential}
                                disabled={isLoading || !healthStatus?.api}
                                style={{
                                    alignSelf: 'flex-start',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    fontSize: '1.1rem',
                                    padding: '1.5rem 2rem'
                                }}
                            >
                                <PlusIcon width="20" height="20" />
                                {isLoading ? 'Issuing Credential...' : `Issue ${form.type.replace(/([A-Z])/g, ' $1').trim()}`}
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
                                        value={verificationTypes[0] || 'TravelDocument'}
                                        onValueChange={(value) => setVerificationTypes([value])}
                                    >
                                        <Select.Trigger />
                                        <Select.Content>
                                            <Select.Item value="TravelDocument">🛂 Travel Document</Select.Item>
                                            <Select.Item value="WorkAuthorization">💼 Work Authorization</Select.Item>
                                            <Select.Item value="ProfessionalSkills">🎓 Professional Skills</Select.Item>
                                            <Select.Item value="HealthRecord">🏥 Health Record</Select.Item>
                                            <Select.Item value="EducationCredential">📚 Education Credential</Select.Item>
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