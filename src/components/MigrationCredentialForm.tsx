import React, { useState } from 'react';
import {
    Box,
    Card,
    Flex,
    Heading,
    Text,
    Button,
    TextField,
    Select,
    TextArea,
    Grid
} from "@radix-ui/themes";
interface MigrationCredentialFormProps {
    onSubmit: (data: {
        type: string;
        id: string;
        customFields: Record<string, string>;
    }) => Promise<unknown>;
    onCancel: () => void;
}

export const MigrationCredentialForm: React.FC<MigrationCredentialFormProps> = ({ onSubmit, onCancel }) => {
    const [credentialType, setCredentialType] = useState('MigrationIdentity');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        holder: {
            name: '',
            dateOfBirth: '',
            nationality: '',
            passportNumber: '',
            occupation: '',
            employerId: '',
        },
        issuanceDate: new Date().toISOString().split('T')[0],
        expirationDate: '',
        permittedRegions: '',
        skills: '',
        vaccinations: '',
        medicalConditions: '',
    });

    const handleChange = (field: string, value: string) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof typeof prev] as Record<string, string>),
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onSubmit({
                type: credentialType,
                id: `${credentialType}-${Date.now()}`,
                customFields: {
                    ...formData.holder,
                    expirationDate: formData.expirationDate,
                    issuanceDate: formData.issuanceDate,
                    ...(formData.permittedRegions ? { permittedRegions: formData.permittedRegions } : {}),
                    ...(formData.skills ? { skills: formData.skills } : {}),
                    ...(formData.vaccinations ? { vaccinations: formData.vaccinations } : {}),
                    ...(formData.medicalConditions ? { medicalConditions: formData.medicalConditions } : {})
                }
            });

            onCancel();
        } catch (error) {
            console.error('❌ Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="4">
                    <Box>
                        <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                            Credential Type
                        </Text>
                        <Select.Root value={credentialType} onValueChange={setCredentialType}>
                            <Select.Trigger style={{ width: '100%' }} />
                            <Select.Content>
                                <Select.Item value="MigrationIdentity">🛂 Migration Identity</Select.Item>
                                <Select.Item value="WorkPermit">💼 Work Permit</Select.Item>
                                <Select.Item value="HealthRecord">🏥 Health Record</Select.Item>
                                <Select.Item value="SkillCertification">🎓 Skill Certification</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Box>

                    <Card>
                        <Box p="4">
                            <Heading size="3" mb="3">👤 Personal Information</Heading>
                            <Grid columns="2" gap="3">
                                <Box>
                                    <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                        Full Name *
                                    </Text>
                                    <TextField.Root
                                        value={formData.holder.name}
                                        onChange={(e) => handleChange('holder.name', e.target.value)}
                                        placeholder="Enter full name"
                                        required
                                    />
                                </Box>
                                <Box>
                                    <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                        Date of Birth *
                                    </Text>
                                    <TextField.Root
                                        type="date"
                                        value={formData.holder.dateOfBirth}
                                        onChange={(e) => handleChange('holder.dateOfBirth', e.target.value)}
                                        required
                                    />
                                </Box>
                                <Box style={{ gridColumn: 'span 2' }}>
                                    <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                        Nationality *
                                    </Text>
                                    <TextField.Root
                                        value={formData.holder.nationality}
                                        onChange={(e) => handleChange('holder.nationality', e.target.value)}
                                        placeholder="Enter nationality"
                                        required
                                    />
                                </Box>
                            </Grid>
                        </Box>
                    </Card>

                    {credentialType === 'MigrationIdentity' && (
                        <Card>
                            <Box p="4">
                                <Heading size="3" mb="3">🛂 Migration Details</Heading>
                                <Box>
                                    <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                        Passport Number
                                    </Text>
                                    <TextField.Root
                                        value={formData.holder.passportNumber}
                                        onChange={(e) => handleChange('holder.passportNumber', e.target.value)}
                                        placeholder="Enter passport number"
                                    />
                                </Box>
                            </Box>
                        </Card>
                    )}

                    {credentialType === 'WorkPermit' && (
                        <Card>
                            <Box p="4">
                                <Heading size="3" mb="3">💼 Work Details</Heading>
                                <Grid columns="2" gap="3">
                                    <Box>
                                        <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                            Occupation
                                        </Text>
                                        <TextField.Root
                                            value={formData.holder.occupation}
                                            onChange={(e) => handleChange('holder.occupation', e.target.value)}
                                            placeholder="Enter occupation"
                                        />
                                    </Box>
                                    <Box>
                                        <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                            Employer ID
                                        </Text>
                                        <TextField.Root
                                            value={formData.holder.employerId}
                                            onChange={(e) => handleChange('holder.employerId', e.target.value)}
                                            placeholder="Enter employer ID"
                                        />
                                    </Box>
                                    <Box style={{ gridColumn: 'span 2' }}>
                                        <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                            Permitted Regions (comma-separated)
                                        </Text>
                                        <TextField.Root
                                            value={formData.permittedRegions}
                                            onChange={(e) => handleChange('permittedRegions', e.target.value)}
                                            placeholder="e.g., New York, California, Texas"
                                        />
                                    </Box>
                                </Grid>
                            </Box>
                        </Card>
                    )}

                    {credentialType === 'HealthRecord' && (
                        <Card>
                            <Box p="4">
                                <Heading size="3" mb="3">🏥 Health Information</Heading>
                                <Flex direction="column" gap="3">
                                    <Box>
                                        <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                            Vaccinations (name|date|provider, comma-separated)
                                        </Text>
                                        <TextArea
                                            value={formData.vaccinations}
                                            onChange={(e) => handleChange('vaccinations', e.target.value)}
                                            placeholder="COVID-19|2023-01-01|Hospital A, Flu|2023-02-01|Hospital B"
                                            rows={3}
                                        />
                                    </Box>
                                    <Box>
                                        <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                            Medical Conditions (comma-separated)
                                        </Text>
                                        <TextArea
                                            value={formData.medicalConditions}
                                            onChange={(e) => handleChange('medicalConditions', e.target.value)}
                                            placeholder="Enter any medical conditions"
                                            rows={2}
                                        />
                                    </Box>
                                </Flex>
                            </Box>
                        </Card>
                    )}

                    {credentialType === 'SkillCertification' && (
                        <Card>
                            <Box p="4">
                                <Heading size="3" mb="3">🎓 Skills Information</Heading>
                                <Box>
                                    <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                        Skills (name|level|verifier, comma-separated)
                                    </Text>
                                    <TextArea
                                        value={formData.skills}
                                        onChange={(e) => handleChange('skills', e.target.value)}
                                        placeholder="Programming|Expert|Tech Corp, Design|Intermediate|Design Studio"
                                        rows={3}
                                    />
                                </Box>
                            </Box>
                        </Card>
                    )}

                    <Card>
                        <Box p="4">
                            <Heading size="3" mb="3">📅 Validity Period</Heading>
                            <Grid columns="2" gap="3">
                                <Box>
                                    <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                        Issuance Date
                                    </Text>
                                    <TextField.Root
                                        type="date"
                                        value={formData.issuanceDate}
                                        onChange={(e) => handleChange('issuanceDate', e.target.value)}
                                        disabled
                                    />
                                </Box>
                                <Box>
                                    <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                        Expiration Date *
                                    </Text>
                                    <TextField.Root
                                        type="date"
                                        value={formData.expirationDate}
                                        onChange={(e) => handleChange('expirationDate', e.target.value)}
                                        required
                                    />
                                </Box>
                            </Grid>
                        </Box>
                    </Card>

                    <Flex gap="3" justify="end">
                        <Button
                            type="button"
                            variant="soft"
                            color="gray"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            Issue Credential
                        </Button>
                    </Flex>
                </Flex>
            </form>
        </Box>
    );
};