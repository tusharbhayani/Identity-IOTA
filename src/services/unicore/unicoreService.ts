interface CredentialSubject {
  id?: string;
  [key: string]: unknown;
}

interface CredentialRequest {
  type: string;
  credentialSubject: CredentialSubject;
  issuer?: string;
  expirationDate?: string;
}

interface CredentialPayload {
  offerId: string;
  credentialConfigurationId: string;
  expiresAt: string;
  credential: {
    credentialSubject: CredentialSubject;
  };
}

interface OfferRequest {
  offerId: string;
}

interface SendOfferRequest {
  offerId: string;
  method: "email" | "sms" | "webhook";
  recipient: string;
}

interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
  nonce?: string;
  presentation_definition?: unknown;
}

interface IssuanceResult {
  success: boolean;
  credentialId?: string;
  offerId?: string;
  offerUrl?: string;
  qrCodeData?: string;
  credentialData?: unknown;
  error?: string;
}

interface VerificationResult {
  success: boolean;
  authorizationRequestId?: string;
  authorizationUrl?: string;
  qrCodeData?: string;
  error?: string;
}

class UniCoreService {
  private baseUrl: string;
  private issuerDid: string;
  private issuerName: string;

  constructor() {
    const isLocalDev = window.location.hostname === "localhost";
    this.baseUrl = isLocalDev
      ? "/api"
      : import.meta.env.VITE_SSI_AGENT_URL || "http://192.168.29.111:3033";
    this.baseUrl = this.baseUrl.replace(/\/$/, "");

    this.issuerDid = "http://192.168.29.111:3033/";
    this.issuerName = "UniCore Issuer";
  }

  async getDidConfiguration(): Promise<unknown> {
    try {
      const response = await fetch(
        `${this.baseUrl}/.well-known/did-configuration.json`,
      );
      if (!response.ok) {
        throw new Error(`Failed to get DID configuration: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to get DID configuration:", error);
      throw error;
    }
  }

  /**
   * API 2 & 7: GET /.well-known/did.json
   * Returns DID document
   */
  async getDidDocument(): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/.well-known/did.json`);
      if (!response.ok) {
        throw new Error(`Failed to get DID document: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to get DID document:", error);
      throw error;
    }
  }

  /**
   * API 3 & 8: GET /.well-known/oauth-authorization-server
   * Returns OAuth authorization server metadata
   */
  async getOAuthAuthorizationServer(): Promise<unknown> {
    try {
      const response = await fetch(
        `${this.baseUrl}/.well-known/oauth-authorization-server`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to get OAuth authorization server: ${response.status}`,
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to get OAuth authorization server:", error);
      throw error;
    }
  }

  /**
   * API 4 & 9: GET /.well-known/openid-credential-issuer
   * Returns OpenID credential issuer metadata
   */
  async getOpenIdCredentialIssuer(): Promise<unknown> {
    try {
      const response = await fetch(
        `${this.baseUrl}/.well-known/openid-credential-issuer`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to get OpenID credential issuer: ${response.status}`,
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to get OpenID credential issuer:", error);
      throw error;
    }
  }
  async issueCredentialViaOpenId4VCI(
    credentialRequest: unknown,
  ): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/openid4vci/credential`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentialRequest),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to issue credential via OpenID4VCI: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to issue credential via OpenID4VCI:", error);
      throw error;
    }
  }

  async createCredential(
    credentialPayload: CredentialPayload,
  ): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentialPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create credential: ${response.status} - ${errorText}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to create credential:", error);
      throw error;
    }
  }

  /**
   * API 11: GET /v0/credentials/{id}
   * Retrieves a specific credential by ID
   */
  async getCredential(credentialId: string): Promise<unknown> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v0/credentials/${credentialId}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to get credential: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get credential:", error);
      throw error;
    }
  }

  /**
   * API 12: GET /v0/offers
   * Retrieves all offers
   */
  async getAllOffers(): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/offers`);

      if (!response.ok) {
        throw new Error(`Failed to get offers: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get offers:", error);
      throw error;
    }
  }

  /**
   * API 13: POST /v0/offers
   * Creates a new offer
   */
  async createOffer(offerRequest: OfferRequest): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        body: JSON.stringify(offerRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create offer: ${response.status} - ${errorText}`,
        );
      }

      const offerUrl = await response.text();
      return offerUrl;
    } catch (error) {
      console.error("Failed to create offer:", error);
      throw error;
    }
  }

  /**
   * API 14: POST /v0/offers/send
   * Sends an offer via specified method (email, SMS, webhook)
   */
  async sendOffer(sendOfferRequest: SendOfferRequest): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/offers/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendOfferRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to send offer: ${response.status} - ${errorText}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to send offer:", error);
      throw error;
    }
  }

  /**
   * API 15: GET /v0/offers/{id}
   * Retrieves a specific offer by ID
   */
  async getOffer(offerId: string): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/offers/${offerId}`);

      if (!response.ok) {
        throw new Error(`Failed to get offer: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get offer:", error);
      throw error;
    }
  }

  async getAllAuthorizationRequests(): Promise<unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/authorization_requests`);

      if (!response.ok) {
        throw new Error(
          `Failed to get authorization requests: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get authorization requests:", error);
      throw error;
    }
  }

  /**
   * API 17: POST /v0/authorization_requests
   * Creates a new authorization request for verification
   */
  async createAuthorizationRequest(
    authRequest: AuthorizationRequest,
  ): Promise<unknown> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v0/authorization_requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(authRequest),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create authorization request: ${response.status} - ${errorText}`,
        );
      }

      const contentType = response.headers.get("content-type");
      let result;

      if (contentType?.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = {
          authorization_url: text,
          id: `auth-${Date.now()}`,
        };
      }

      return result;
    } catch (error) {
      console.error("Failed to create authorization request:", error);
      throw error;
    }
  }

  async getAuthorizationRequest(requestId: string): Promise<unknown> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v0/authorization_requests/${requestId}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get authorization request: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get authorization request:", error);
      throw error;
    }
  }

  private async getAvailableCredentialConfigurationId(
    credentialType?: string,
  ): Promise<string | null> {
    try {
      const issuerMetadata = (await this.getOpenIdCredentialIssuer()) as {
        credential_configurations_supported?: Record<string, unknown>;
      };

      if (issuerMetadata?.credential_configurations_supported) {
        const configIds = Object.keys(
          issuerMetadata.credential_configurations_supported,
        );
        if (credentialType && configIds.includes(credentialType)) {
          return credentialType;
        }

        if (configIds.length > 0) {
          return configIds[0];
        }
      }

      console.warn("No credential configurations found in issuer metadata");
      return null;
    } catch (error) {
      console.error("Failed to get credential configurations:", error);
      return null;
    }
  }

  async issueCredential(
    credentialRequest: CredentialRequest,
  ): Promise<IssuanceResult> {
    try {
      const health = await this.healthCheck();
      if (!health.api) {
        return {
          success: false,
          error:
            "UniCore service is not available. Please check the connection.",
        };
      }

      const configId = await this.getAvailableCredentialConfigurationId(
        credentialRequest.type,
      );
      if (!configId) {
        return {
          success: false,
          error:
            "No credential configurations available in UniCore. Please configure credential types in UniCore first.",
        };
      }

      const offerId = `unicore-${credentialRequest.type.toLowerCase()}-${Date.now()}`;

      const credentialPayload = this.createCredentialPayload(
        offerId,
        credentialRequest,
        configId,
      );

      const credentialResult = await this.createCredential(credentialPayload);

      const offerUrl = await this.createOffer({ offerId });

      const fixedOfferUrl = await this.ensureUniMeCompatibility(offerUrl);

      return {
        success: true,
        credentialId: offerId,
        offerId: offerId,
        offerUrl: fixedOfferUrl,
        qrCodeData: fixedOfferUrl,
        credentialData: credentialResult,
      };
    } catch (error) {
      console.error("Credential issuance flow failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async createVerificationRequest(
    credentialTypes: string[],
    specificFields?: Record<string, unknown>,
  ): Promise<VerificationResult> {
    try {
      const inputDescriptors = credentialTypes.map((type) => {
        const fields: Array<{
          path: string[];
          filter?: {
            type: string;
            contains?: { const: string };
            pattern?: string;
          };
        }> = [
          {
            path: ["$.type"],
            filter: {
              type: "array",
              contains: { const: type },
            },
          },
        ];

        if (specificFields) {
          Object.entries(specificFields).forEach(([fieldName, value]) => {
            fields.push({
              path: [`$.credentialSubject.${fieldName}`],
              filter: {
                type: "string",
                pattern: String(value),
              },
            });
          });
        }

        return {
          id: type,
          name: `${type} Credential`,
          purpose: `Verify ${type} credential`,
          constraints: {
            fields,
          },
        };
      });

      const authRequest: AuthorizationRequest = {
        response_type: "vp_token",
        client_id: this.issuerDid,
        redirect_uri: `${window.location.origin}/verification/callback`,
        scope: "openid",
        state: `verify-${Date.now()}`,
        nonce: `nonce-${Date.now()}`,
        presentation_definition: {
          id: `verification-${Date.now()}`,
          input_descriptors: inputDescriptors,
        },
      };

      const result = (await this.createAuthorizationRequest(authRequest)) as {
        id: string;
        authorization_url: string;
      };

      return {
        success: true,
        authorizationRequestId: result.id,
        authorizationUrl: result.authorization_url,
        qrCodeData: result.authorization_url,
      };
    } catch (error) {
      console.error("Verification flow failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create verification request for a specific credential
   */
  async createVerificationForCredential(
    credentialType: string,
    requiredFields?: Record<string, unknown>,
  ): Promise<VerificationResult> {
    return this.createVerificationRequest([credentialType], requiredFields);
  }

  private createCredentialPayload(
    offerId: string,
    request: CredentialRequest,
    configId: string,
  ): CredentialPayload {
    return {
      offerId: offerId,
      credentialConfigurationId: configId,
      expiresAt: "never",
      credential: {
        credentialSubject: {
          ...request.credentialSubject,
        },
      },
    };
  }
  private async ensureUniMeCompatibility(offerUrl: string): Promise<string> {
    try {
      const offerUriMatch = offerUrl.match(/credential_offer_uri=([^&]+)/);
      if (!offerUriMatch) {
        return offerUrl;
      }

      const offerUri = decodeURIComponent(offerUriMatch[1]);
      const proxyUri = offerUri.replace(
        "http://192.168.29.111:3033",
        this.baseUrl,
      );
      const offerDataResponse = await fetch(proxyUri);
      if (!offerDataResponse.ok) {
        return offerUrl;
      }

      const offerData = await offerDataResponse.json();

      const hasConfigIds =
        offerData.credential_configuration_ids &&
        offerData.credential_configuration_ids.length > 0;

      if (hasConfigIds) {
        return offerUrl;
      }

      const fixedOfferData = {
        ...offerData,
        credential_configuration_ids: ["VerifiableCredential"],
      };

      const fixedDataString = JSON.stringify(fixedOfferData);
      const dataUrl = `data:application/json;base64,${btoa(fixedDataString)}`;
      const fixedOfferUrl = `openid-credential-offer://?credential_offer_uri=${encodeURIComponent(dataUrl)}`;

      return fixedOfferUrl;
    } catch (error) {
      console.error("Failed to apply UniMe compatibility fix:", error);
      return offerUrl;
    }
  }

  /**
   * Get available credential configurations
   */
  async getCredentialConfigurations(): Promise<unknown> {
    try {
      const response = await fetch(
        `${this.baseUrl}/.well-known/openid-credential-issuer`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to get credential configurations: ${response.status}`,
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to get credential configurations:", error);
      throw error;
    }
  }

  /**
   * Get list of available credential configuration IDs
   */
  async getAvailableConfigurationIds(): Promise<string[]> {
    try {
      const issuerMetadata = (await this.getOpenIdCredentialIssuer()) as {
        credential_configurations_supported?: Record<string, unknown>;
      };

      if (issuerMetadata?.credential_configurations_supported) {
        return Object.keys(issuerMetadata.credential_configurations_supported);
      }

      return [];
    } catch (error) {
      console.error("Failed to get configuration IDs:", error);
      return [];
    }
  }

  /**
   * Health check for UniCore service
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/v0/credentials`, {
        headers: { Accept: "application/json" },
      });

      const isHealthy = response.ok;

      let configurations = null;
      if (isHealthy) {
        try {
          configurations = await this.getCredentialConfigurations();
        } catch (error) {
          console.log("Could not fetch credential configurations:", error);
        }
      }

      return {
        api: isHealthy,
        agent: isHealthy,
        configurations,
        error: isHealthy ? undefined : "UniCore service not reachable",
      };
    } catch {
      return {
        api: false,
        agent: false,
        error:
          "UniCore service not reachable - ensure it's running on port 3033",
      };
    }
  }
  async createMigrationIdentity(
    firstName: string,
    lastName: string,
    dateOfBirth: string,
    nationality: string,
    passportNumber?: string,
  ): Promise<IssuanceResult> {
    const credentialRequest: CredentialRequest = {
      type: "MigrationIdentity",
      credentialSubject: {
        first_name: firstName,
        last_name: lastName,
        dob: dateOfBirth,
        nationality: nationality,
        ...(passportNumber && { passport_number: passportNumber }),
      },
    };

    return await this.issueCredential(credentialRequest);
  }

  /**
   * Create Work Permit credential
   */
  async createWorkPermit(
    firstName: string,
    lastName: string,
    employerId: string,
    position: string,
    validUntil: string,
  ): Promise<IssuanceResult> {
    const credentialRequest: CredentialRequest = {
      type: "WorkPermit",
      credentialSubject: {
        first_name: firstName,
        last_name: lastName,
        employer_id: employerId,
        position: position,
        valid_until: validUntil,
      },
      expirationDate: validUntil,
    };

    return await this.issueCredential(credentialRequest);
  }

  async testUniCoreFlow() {
    try {
      const issuanceResult = await this.createMigrationIdentity(
        "Alice",
        "Johnson",
        "1995-03-20",
        "US",
        "P123456789",
      );

      if (!issuanceResult.success) {
        throw new Error(`Issuance failed: ${issuanceResult.error}`);
      }

      const verificationResult = await this.createVerificationRequest([
        "MigrationIdentity",
      ]);

      if (!verificationResult.success) {
        throw new Error(`Verification failed: ${verificationResult.error}`);
      }

      return {
        success: true,
        issuance: issuanceResult,
        verification: verificationResult,
      };
    } catch (error) {
      console.error("UniCore flow test failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const unicoreService = new UniCoreService();
