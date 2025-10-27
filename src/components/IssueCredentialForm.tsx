import { Box, Button, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";

export interface CustomFieldValue {
    key: string;
    value: string;
}

export interface IssueCredentialFormProps {
    subjectDID: string;
    onIssue: (data: {
        type: string;
        id: string;
        customFields: Record<string, string>;
    }) => Promise<void>;
    onCancel: () => void;
}

export function IssueCredentialForm({
    subjectDID,
    onIssue,
    onCancel,
}: IssueCredentialFormProps) {
    const [credentialType, setCredentialType] = useState("");
    const [credentialId, setCredentialId] = useState("");
    const [customFields, setCustomFields] = useState<CustomFieldValue[]>([
        { key: "", value: "" },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addField = () => {
        setCustomFields([...customFields, { key: "", value: "" }]);
    };

    const removeField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const updateField = (index: number, field: "key" | "value", value: string) => {
        const newFields = [...customFields];
        newFields[index][field] = value;
        setCustomFields(newFields);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!credentialType.trim()) {
            setError("Credential type is required");
            return;
        }

        if (!credentialId.trim()) {
            setError("Credential ID is required");
            return;
        }

        const customFieldsObj: Record<string, string> = {};
        for (const field of customFields) {
            if (field.key.trim() && field.value.trim()) {
                customFieldsObj[field.key.trim()] = field.value.trim();
            }
        }

        if (Object.keys(customFieldsObj).length === 0) {
            setError("At least one custom field is required");
            return;
        }

        setIsLoading(true);

        try {
            await onIssue({
                type: credentialType,
                id: credentialId,
                customFields: customFieldsObj,
            });

            setCredentialType("");
            setCredentialId("");
            setCustomFields([{ key: "", value: "" }]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to issue credential");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card size="3">
            <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="4">
                    <Heading size="5">📝 Issue New Credential</Heading>

                    <Box>
                        <Text size="2" weight="bold" mb="2">
                            Subject DID
                        </Text>
                        <TextField.Root
                            value={subjectDID}
                            readOnly
                            size="2"
                            style={{ background: "var(--gray-3)" }}
                        />
                    </Box>

                    <Box>
                        <Text size="2" weight="bold" mb="2">
                            Credential Type *
                        </Text>
                        <TextField.Root
                            placeholder="e.g., UniversityDegreeCredential"
                            value={credentialType}
                            onChange={(e) => setCredentialType(e.target.value)}
                            size="2"
                            required
                        />
                    </Box>

                    <Box>
                        <Text size="2" weight="bold" mb="2">
                            Credential ID *
                        </Text>
                        <TextField.Root
                            placeholder="e.g., https://example.edu/credentials/123"
                            value={credentialId}
                            onChange={(e) => setCredentialId(e.target.value)}
                            size="2"
                            required
                        />
                    </Box>

                    <Box>
                        <Flex justify="between" align="center" mb="2">
                            <Text size="2" weight="bold">
                                Custom Fields *
                            </Text>
                            <Button type="button" variant="soft" size="1" onClick={addField}>
                                + Add Field
                            </Button>
                        </Flex>

                        <Flex direction="column" gap="2">
                            {customFields.map((field, index) => (
                                <Flex key={index} gap="2" align="center">
                                    <TextField.Root
                                        placeholder="Field name"
                                        value={field.key}
                                        onChange={(e) => updateField(index, "key", e.target.value)}
                                        size="2"
                                        style={{ flex: 1 }}
                                    />
                                    <TextField.Root
                                        placeholder="Value"
                                        value={field.value}
                                        onChange={(e) => updateField(index, "value", e.target.value)}
                                        size="2"
                                        style={{ flex: 1 }}
                                    />
                                    {customFields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            color="red"
                                            size="2"
                                            onClick={() => removeField(index)}
                                        >
                                            ✕
                                        </Button>
                                    )}
                                </Flex>
                            ))}
                        </Flex>
                    </Box>

                    {error && (
                        <Box
                            p="3"
                            style={{
                                background: "var(--red-3)",
                                borderRadius: "8px",
                                border: "1px solid var(--red-6)",
                            }}
                        >
                            <Text size="2" color="red">
                                {error}
                            </Text>
                        </Box>
                    )}

                    <Flex gap="2">
                        <Button
                            type="button"
                            variant="soft"
                            size="3"
                            onClick={onCancel}
                            disabled={isLoading}
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            size="3"
                            disabled={isLoading}
                            style={{ flex: 1 }}
                        >
                            {isLoading ? "⏳ Issuing..." : "✓ Issue Credential"}
                        </Button>
                    </Flex>
                </Flex>
            </form>
        </Card>
    );
}
