/**
 * Credential Configuration Service
 * Manages credential type configurations and ensures proper display in wallets
 */

export interface CredentialTypeConfig {
  id: string;
  displayName: string;
  description: string;
  format: string;
  fields: {
    name: string;
    label: string;
    type: string;
    required: boolean;
  }[];
}

/**
 * Predefined credential type configurations
 * These define how credentials should be structured and displayed
 */
export const CREDENTIAL_TYPES: Record<string, CredentialTypeConfig> = {
  MigrationIdentity: {
    id: "MigrationIdentity",
    displayName: "Migration Identity",
    description: "Official migration and identity document",
    format: "jwt_vc_json",
    fields: [
      {
        name: "first_name",
        label: "First Name",
        type: "string",
        required: true,
      },
      { name: "last_name", label: "Last Name", type: "string", required: true },
      { name: "dob", label: "Date of Birth", type: "date", required: true },
      {
        name: "nationality",
        label: "Nationality",
        type: "string",
        required: true,
      },
      {
        name: "passport_number",
        label: "Passport Number",
        type: "string",
        required: false,
      },
    ],
  },
  WorkPermit: {
    id: "WorkPermit",
    displayName: "Work Permit",
    description: "Employment authorization document",
    format: "jwt_vc_json",
    fields: [
      {
        name: "first_name",
        label: "First Name",
        type: "string",
        required: true,
      },
      { name: "last_name", label: "Last Name", type: "string", required: true },
      {
        name: "employer_id",
        label: "Employer ID",
        type: "string",
        required: true,
      },
      { name: "position", label: "Position", type: "string", required: true },
      {
        name: "valid_until",
        label: "Valid Until",
        type: "date",
        required: true,
      },
    ],
  },
  HealthRecord: {
    id: "HealthRecord",
    displayName: "Health Record",
    description: "Medical and health certification",
    format: "jwt_vc_json",
    fields: [
      {
        name: "first_name",
        label: "First Name",
        type: "string",
        required: true,
      },
      { name: "last_name", label: "Last Name", type: "string", required: true },
      {
        name: "health_record_id",
        label: "Health Record ID",
        type: "string",
        required: true,
      },
      {
        name: "vaccination_status",
        label: "Vaccination Status",
        type: "string",
        required: false,
      },
    ],
  },
  SkillCertification: {
    id: "SkillCertification",
    displayName: "Skill Certification",
    description: "Professional skills and qualifications",
    format: "jwt_vc_json",
    fields: [
      {
        name: "first_name",
        label: "First Name",
        type: "string",
        required: true,
      },
      { name: "last_name", label: "Last Name", type: "string", required: true },
      {
        name: "certification_name",
        label: "Certification Name",
        type: "string",
        required: true,
      },
      {
        name: "certification_level",
        label: "Level",
        type: "string",
        required: false,
      },
    ],
  },
};

/**
 * Get credential type configuration
 */
export function getCredentialTypeConfig(
  type: string,
): CredentialTypeConfig | null {
  return CREDENTIAL_TYPES[type] || null;
}

/**
 * Get all available credential types
 */
export function getAllCredentialTypes(): CredentialTypeConfig[] {
  return Object.values(CREDENTIAL_TYPES);
}

/**
 * Get display name for credential type
 */
export function getCredentialDisplayName(type: string): string {
  const config = CREDENTIAL_TYPES[type];
  return config ? config.displayName : type;
}

/**
 * Create UniCore credential configuration payload
 * This creates the proper structure that UniCore expects
 */
export function createUniCoreCredentialConfig(type: string) {
  const config = CREDENTIAL_TYPES[type];
  if (!config) {
    throw new Error(`Unknown credential type: ${type}`);
  }

  return {
    format: config.format,
    cryptographic_binding_methods_supported: ["did"],
    credential_signing_alg_values_supported: ["EdDSA", "ES256"],
    display: [
      {
        name: config.displayName,
        description: config.description,
        locale: "en-US",
      },
    ],
    credential_definition: {
      type: ["VerifiableCredential", type],
      credentialSubject: config.fields.reduce(
        (acc, field) => {
          acc[field.name] = {
            mandatory: field.required,
            display: [
              {
                name: field.label,
                locale: "en-US",
              },
            ],
          };
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    },
  };
}
