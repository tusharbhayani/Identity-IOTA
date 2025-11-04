import { unicoreService } from "./unicore/unicoreService";
import { IotaDocument, Storage } from "@iota/identity-wasm/web";

interface MigrationCredentialData {
  type: string;
  holder: {
    name: string;
    dateOfBirth: string;
    nationality: string;
    passportNumber?: string;
    occupation?: string;
    employerId?: string;
  };
  claims: Record<string, unknown>;
  issuanceDate: string;
  expirationDate: string;
}

class MigrationIdentityService {
  async issueMigrationCredential(
    document: IotaDocument,
    _storage: Storage,
    _fragment: string,
    data: MigrationCredentialData,
  ) {
    try {
      const credentialRequest = {
        type: data.type,
        issuer: document.id().toString(),
        holder: {
          id: document.id().toString(),
          name: data.holder.name,
          dateOfBirth: data.holder.dateOfBirth,
          nationality: data.holder.nationality,
          ...(data.holder.passportNumber && {
            passportNumber: data.holder.passportNumber,
          }),
          ...(data.holder.occupation && {
            occupation: data.holder.occupation,
          }),
          ...(data.holder.employerId && {
            employerId: data.holder.employerId,
          }),
        },
        expirationDate: data.expirationDate,
      };

      const result = await unicoreService.issueCredential(credentialRequest);

      return {
        credentialJwt: result.credentialJwt,
        credentialOffer: result.credentialOffer,
        qrCodeUrl: result.qrCodeUrl,
        httpUrl: result.httpUrl,
        preAuthorizedCode: result.preAuthorizedCode,
        w3cCredential: result.w3cCredential,
        type: data.type,
        holder: data.holder,
        issuedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to issue migration credential:", error);
      throw new Error(
        `Failed to issue migration credential: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async formatCredentialData(data: MigrationCredentialData) {
    const baseData = {
      holder: {
        name: data.holder.name,
        dateOfBirth: data.holder.dateOfBirth,
        nationality: data.holder.nationality,
      },
      issuanceDate: data.issuanceDate,
      expirationDate: data.expirationDate,
      issuer: "Migration Authority",
    };

    switch (data.type) {
      case "MigrationIdentity":
        return {
          ...baseData,
          type: "MigrationIdentity",
          holder: {
            ...baseData.holder,
            passportNumber: data.holder.passportNumber,
          },
        };

      case "WorkPermit":
        return {
          ...baseData,
          type: "WorkPermit",
          holder: {
            ...baseData.holder,
            occupation: data.holder.occupation,
            employerId: data.holder.employerId,
          },
          ...data.claims,
        };

      case "HealthRecord":
        return {
          ...baseData,
          type: "HealthRecord",
          ...data.claims,
        };

      case "SkillCertification":
        return {
          ...baseData,
          type: "SkillCertification",
          ...data.claims,
        };

      default:
        throw new Error(`Unsupported credential type: ${data.type}`);
    }
  }

  async verifyMigrationCredential() {
    try {
      return await unicoreService.createAuthorizationRequest({
        type: "VerificationRequest",
        scope: [
          "MigrationIdentity",
          "WorkPermit",
          "HealthRecord",
          "SkillCertification",
        ],
        claims: {
          name: "required",
          dateOfBirth: "required",
          nationality: "required",
          passportNumber: "optional",
        },
      });
    } catch (error) {
      console.error("Failed to verify migration credential:", error);
      throw error;
    }
  }
}

export const migrationIdentityService = new MigrationIdentityService();
