import { openid4vciService } from "./openid4vci";

interface CredentialRequest {
  type: string;
  holder: {
    id?: string;
    name: string;
    dateOfBirth?: string;
    nationality?: string;
    passportNumber?: string;
    occupation?: string;
    employerId?: string;
    [key: string]: any;
  };
  issuer?: string;
  expirationDate?: string;
  claims?: Record<string, unknown>;
}

class UnicoreService {
  async issueCredential(credentialData: CredentialRequest) {
    try {
      const preAuthCode = `pre_auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const credentialOffer = await openid4vciService.createCredentialOffer(
        [credentialData.type],
        preAuthCode,
      );

      const qrCodeUrl =
        await openid4vciService.generateQRCodeUrl(credentialOffer);

      return {
        success: true,
        credentialOffer,
        qrCodeUrl,
        preAuthCode,
        offerId: `offer_${Date.now()}`,
        credentialJwt: null,
      };
    } catch (error) {
      console.error("❌ Failed to issue credential:", error);
      throw error;
    }
  }

  async testCredentialFlow() {
    try {
      return await openid4vciService.testCredentialFlow("MigrationIdentity");
    } catch (error) {
      console.error("❌ Test credential flow failed:", error);
      throw error;
    }
  }

  async getOpenIDIssuer() {
    try {
      return await openid4vciService.getIssuerMetadata();
    } catch (error) {
      console.error("❌ Failed to get issuer metadata:", error);
      throw error;
    }
  }

  async request(endpoint: string, method: string = "GET") {
    try {
      const baseUrl =
        import.meta.env.VITE_NGROK_URL ||
        import.meta.env.VITE_UNICORE_API_URL ||
        "http://localhost:3000";

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  async getDIDConfiguration() {
    return this.request("/.well-known/did-configuration.json");
  }

  async getOffers() {
    return this.request("/credential-offers");
  }

  async createOffer(offerData: unknown) {
    return this.issueCredential(offerData);
  }

  async createAuthorizationRequest(authData: unknown) {
    return this.issueCredential(authData);
  }
}

export const unicoreService = new UnicoreService();
