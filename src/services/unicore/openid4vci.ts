export interface CredentialOffer {
  credential_issuer: string;
  credential_configuration_ids: string[];
  grants?: {
    "urn:ietf:params:oauth:grant-type:pre-authorized_code"?: {
      "pre-authorized_code": string;
      user_pin_required?: boolean;
    };
  };
}

export interface CredentialConfiguration {
  format: "jwt_vc_json";
  credential_definition: {
    type: string[];
  };
  cryptographic_binding_methods_supported?: string[];
  credential_signing_alg_values_supported?: string[];
  proof_types_supported?: {
    jwt?: {
      proof_signing_alg_values_supported: string[];
    };
  };
  display?: {
    name: string;
    locale?: string;
    logo?: {
      url: string;
      alt_text: string;
    };
    background_color?: string;
    text_color?: string;
  }[];
}

export interface IssuerMetadata {
  credential_issuer: string;
  credential_endpoint: string;
  token_endpoint: string;
  authorization_servers?: string[];
  credential_configurations_supported: Record<string, CredentialConfiguration>;
  display?: {
    name: string;
    locale?: string;
    logo?: {
      url: string;
      alt_text: string;
    };
  }[];
}

export interface TokenRequest {
  grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code";
  "pre-authorized_code": string;
  user_pin?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  c_nonce?: string;
  c_nonce_expires_in?: number;
}

export interface CredentialRequest {
  format: "jwt_vc_json";
  credential_definition: {
    type: string[];
  };
  proof?: {
    proof_type: "jwt";
    jwt: string;
  };
}

export interface CredentialResponse {
  format: "jwt_vc_json";
  credential: string;
  c_nonce?: string;
  c_nonce_expires_in?: number;
}

class OpenID4VCIService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }

  async getIssuerMetadata(): Promise<IssuerMetadata> {
    try {
      const response = await fetch(
        `${this.baseUrl}/.well-known/openid-credential-issuer`,
        {
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get issuer metadata: ${response.status} ${response.statusText}`,
        );
      }

      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error("Failed to get issuer metadata:", error);
      throw error;
    }
  }

  async createCredentialOffer(
    credentialTypes: string[],
    preAuthorizedCode?: string,
  ): Promise<CredentialOffer> {
    const configurationId = credentialTypes[0] || "MigrationIdentity";

    const offer: CredentialOffer = {
      credential_issuer: this.baseUrl,
      credential_configuration_ids: [configurationId],
    };

    if (preAuthorizedCode) {
      offer.grants = {
        "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
          "pre-authorized_code": preAuthorizedCode,
          user_pin_required: false,
        },
      };
    }

    return offer;
  }

  async exchangePreAuthorizedCode(
    preAuthorizedCode: string,
  ): Promise<TokenResponse> {
    try {
      const tokenRequest: TokenRequest = {
        grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code",
        "pre-authorized_code": preAuthorizedCode,
      };

      const response = await fetch(`${this.baseUrl}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams(
          Object.entries(tokenRequest).map(([key, value]) => [
            key,
            String(value),
          ]),
        ),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Token request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`,
        );
      }

      const tokenResponse = await response.json();
      return tokenResponse;
    } catch (error) {
      console.error("Failed to exchange pre-authorized code:", error);
      throw error;
    }
  }

  async requestCredential(
    accessToken: string,
    credentialRequest: CredentialRequest,
  ): Promise<CredentialResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/credential`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(credentialRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Credential request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`,
        );
      }

      const credentialResponse = await response.json();
      return credentialResponse;
    } catch (error) {
      console.error("Failed to request credential:", error);
      throw error;
    }
  }

  private async createCredentialOfferUri(
    credentialOffer: CredentialOffer,
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/credential-offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentialOffer),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create credential offer: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();
      return result.uri;
    } catch (error) {
      console.warn("Failed to create hosted offer, using fallback:", error);
      const offerJson = JSON.stringify(credentialOffer);
      const offerBase64 = btoa(offerJson);
      return `data:application/json;base64,${offerBase64}`;
    }
  }

  async generateQRCodeUrl(credentialOffer: CredentialOffer): Promise<string> {
    try {
      const offerUri = await this.createCredentialOfferUri(credentialOffer);

      const qrUrl = `openid-credential-offer://?credential_offer_uri=${encodeURIComponent(offerUri)}`;

      return qrUrl;
    } catch (error) {
      console.error("Failed to generate QR URL:", error);
      return this.generateInlineQRCodeUrl(credentialOffer);
    }
  }

  private generateInlineQRCodeUrl(credentialOffer: CredentialOffer): string {
    const offerJson = JSON.stringify(credentialOffer);
    const offerBase64 = btoa(offerJson);
    return `openid-credential-offer://?credential_offer=${encodeURIComponent(offerBase64)}`;
  }

  generateHttpUrl(credentialOffer: CredentialOffer): string {
    const offerJson = JSON.stringify(credentialOffer);
    const offerBase64 = btoa(offerJson);
    return `${this.baseUrl}/credential-offer?offer=${encodeURIComponent(offerBase64)}`;
  }

  validateCredentialOffer(offer: CredentialOffer): boolean {
    const isValid = !!(
      offer.credential_issuer &&
      offer.credential_configuration_ids &&
      Array.isArray(offer.credential_configuration_ids) &&
      offer.credential_configuration_ids.length > 0
    );

    if (!isValid) {
      console.warn("❌ Invalid credential offer format:", offer);
    }

    return isValid;
  }

  async testCredentialFlow(
    credentialType: string = "MigrationIdentity",
  ): Promise<{
    success: boolean;
    steps: string[];
    error?: string;
  }> {
    const steps: string[] = [];

    try {
      steps.push("1. Getting issuer metadata...");
      await this.getIssuerMetadata();
      steps.push("✅ Issuer metadata retrieved");

      steps.push("2. Creating credential offer...");
      const preAuthCode = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const offer = await this.createCredentialOffer(
        [credentialType],
        preAuthCode,
      );
      steps.push("✅ Credential offer created");

      steps.push("3. Generating QR code...");
      const qrUrl = await this.generateQRCodeUrl(offer);
      steps.push(`✅ QR code generated: ${qrUrl.substring(0, 50)}...`);

      steps.push("4. Testing token exchange...");
      const tokenResponse = await this.exchangePreAuthorizedCode(preAuthCode);
      steps.push("✅ Access token obtained");

      steps.push("5. Testing credential request...");
      const credentialRequest: CredentialRequest = {
        format: "jwt_vc_json",
        credential_definition: {
          type: ["VerifiableCredential", credentialType],
        },
      };

      const credentialResponse = await this.requestCredential(
        tokenResponse.access_token,
        credentialRequest,
      );
      steps.push(`✅ Credential obtained: ${credentialResponse.format}`);

      steps.push("🎉 Complete OpenID4VCI flow test successful!");

      return {
        success: true,
        steps,
      };
    } catch (error) {
      steps.push(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );

      return {
        success: false,
        steps,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

const getApiUrl = () => {
  if (
    import.meta.env.VITE_NGROK_URL &&
    import.meta.env.VITE_NGROK_URL !== "https://your-ngrok-url.ngrok-free.dev"
  ) {
    return import.meta.env.VITE_NGROK_URL;
  }

  const fallbackUrl =
    import.meta.env.VITE_UNICORE_API_URL || "http://localhost:3000";
  return fallbackUrl;
};

export const openid4vciService = new OpenID4VCIService(getApiUrl());
