export interface W3CCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: string | { id: string; [key: string]: unknown };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id?: string;
    [key: string]: unknown;
  };
  credentialStatus?: {
    id: string;
    type: string;
  };
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws: string;
  };
}

export interface JWTVCPayload {
  iss: string;
  sub: string;
  vc: W3CCredential;
  iat: number;
  exp?: number;
  jti?: string;
}

export interface MigrationCredentialSubject {
  id?: string;
  name: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber?: string;
  occupation?: string;
  employerId?: string;
  [key: string]: unknown;
}

class W3CCredentialsService {
  createCredential(
    id: string,
    type: string[],
    issuer: string,
    credentialSubject: MigrationCredentialSubject,
    expirationDate?: string,
  ): W3CCredential {
    const now = new Date();

    return {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1",
      ],
      id,
      type: ["VerifiableCredential", ...type],
      issuer,
      issuanceDate: now.toISOString(),
      ...(expirationDate && { expirationDate }),
      credentialSubject: {
        id: credentialSubject.id,
        ...credentialSubject,
      },
    };
  }

  createJWTVCPayload(
    credential: W3CCredential,
    issuer: string,
    subject?: string,
  ): JWTVCPayload {
    const now = Math.floor(Date.now() / 1000);
    const exp = credential.expirationDate
      ? Math.floor(new Date(credential.expirationDate).getTime() / 1000)
      : undefined;

    return {
      iss: issuer,
      sub: subject || credential.credentialSubject.id || issuer,
      vc: credential,
      iat: now,
      ...(exp && { exp }),
      jti: credential.id,
    };
  }

  createMigrationIdentityCredential(
    issuer: string,
    holder: MigrationCredentialSubject,
    expirationDate?: string,
  ): W3CCredential {
    const id = `urn:uuid:migration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return this.createCredential(
      id,
      ["MigrationIdentity"],
      issuer,
      {
        id: holder.id,
        name: holder.name,
        dateOfBirth: holder.dateOfBirth,
        nationality: holder.nationality,
        ...(holder.passportNumber && { passportNumber: holder.passportNumber }),
      },
      expirationDate,
    );
  }

  createWorkPermitCredential(
    issuer: string,
    holder: MigrationCredentialSubject,
    expirationDate?: string,
  ): W3CCredential {
    const id = `urn:uuid:work-permit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return this.createCredential(
      id,
      ["WorkPermit"],
      issuer,
      {
        id: holder.id,
        name: holder.name,
        dateOfBirth: holder.dateOfBirth,
        nationality: holder.nationality,
        occupation: holder.occupation,
        employerId: holder.employerId,
      },
      expirationDate,
    );
  }

  createHealthRecordCredential(
    issuer: string,
    holder: MigrationCredentialSubject,
    healthData: Record<string, unknown>,
    expirationDate?: string,
  ): W3CCredential {
    const id = `urn:uuid:health-record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return this.createCredential(
      id,
      ["HealthRecord"],
      issuer,
      {
        id: holder.id,
        name: holder.name,
        dateOfBirth: holder.dateOfBirth,
        nationality: holder.nationality,
        ...healthData,
      },
      expirationDate,
    );
  }

  createSkillCertificationCredential(
    issuer: string,
    holder: MigrationCredentialSubject,
    skillData: Record<string, unknown>,
    expirationDate?: string,
  ): W3CCredential {
    const id = `urn:uuid:skill-cert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return this.createCredential(
      id,
      ["SkillCertification"],
      issuer,
      {
        id: holder.id,
        name: holder.name,
        dateOfBirth: holder.dateOfBirth,
        nationality: holder.nationality,
        ...skillData,
      },
      expirationDate,
    );
  }
  validateCredential(credential: W3CCredential): boolean {
    const requiredFields = [
      "@context",
      "id",
      "type",
      "issuer",
      "issuanceDate",
      "credentialSubject",
    ];

    for (const field of requiredFields) {
      if (!(field in credential)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    if (!credential.type.includes("VerifiableCredential")) {
      console.error("Credential must include VerifiableCredential type");
      return false;
    }

    return true;
  }
}

export const w3cCredentialsService = new W3CCredentialsService();
