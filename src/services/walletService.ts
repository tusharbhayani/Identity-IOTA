import { Jwt } from "@iota/identity-wasm/web";

function generateUUID(): string {
  return crypto.randomUUID();
}

export interface CredentialOffer {
  credential_issuer: string;
  credentials: Array<{
    format: "jwt_vc" | "json-ld";
    credential_definition?: {
      type: string[];
      credentialSubject?: Record<string, unknown>;
    };
  }>;
  grants?: {
    "urn:ietf:params:oauth:grant-type:pre-authorized_code"?: {
      "pre-authorized_code": string;
      user_pin_required?: boolean;
    };
  };
}

export interface StoredCredential {
  id: string;
  type: "credential-offer" | "verifiable-credential";
  credential: Record<string, unknown> | Jwt | CredentialOffer;
  credentialType: string;
  issuer: string;
  state: "pending" | "accepted" | "rejected";
  storedAt: string;
  expiresAt?: string;
  metadata?: {
    sourceUrl?: string;
    displayName?: string;
    credentialJwt?: string;
  };
}

class WalletService {
  private readonly storageKey = "wallet_credentials";

  async parseCredentialOfferFromUrl(
    invitationUrl: string,
  ): Promise<CredentialOffer> {
    try {
      console.log("📱 Parsing invitation URL:", invitationUrl);

      const url = new URL(invitationUrl);

      let oobParam = url.searchParams.get("oob");

      if (!oobParam && url.hash) {
        const hashParts = url.hash.split("?");
        if (hashParts.length > 1) {
          const hashParams = new URLSearchParams(hashParts[1]);
          oobParam = hashParams.get("oob");
        }
      }

      if (oobParam) {
        console.log("✅ Found OOB parameter with embedded credential");

        try {
          const offerJson = atob(decodeURIComponent(oobParam));
          const credentialOffer = JSON.parse(offerJson);

          console.log(
            "✅ Successfully parsed embedded credential offer:",
            credentialOffer,
          );
          return credentialOffer;
        } catch (decodeError) {
          console.error("❌ Failed to decode OOB parameter:", decodeError);
          throw new Error("Invalid OOB credential offer format");
        }
      }

      const credentialOfferUri = url.searchParams.get("credential_offer_uri");

      if (!credentialOfferUri) {
        throw new Error(
          "No credential offer found in invitation URL. Expected 'oob' or 'credential_offer_uri' parameter",
        );
      }

      console.log("🔗 Fetching credential offer from:", credentialOfferUri);

      const response = await fetch(credentialOfferUri, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch credential offer: ${response.statusText}`,
        );
      }

      const credentialOffer = await response.json();

      console.log("✅ Credential offer fetched:", credentialOffer);

      return credentialOffer;
    } catch (error) {
      console.error("❌ Error parsing credential offer:", error);
      throw error;
    }
  }

  async verifyCredential(
    credential: unknown,
    issuerDID: string,
  ): Promise<boolean> {
    try {
      console.log("🔍 Verifying credential...");

      if (!credential || typeof credential !== "object") {
        throw new Error("Invalid credential structure");
      }

      if (!issuerDID || !issuerDID.startsWith("did:")) {
        throw new Error("Invalid issuer DID format");
      }

      const cred = credential as {
        issuer?: string | { id: string };
        expirationDate?: string;
        issuanceDate?: string;
      };

      const credentialIssuer =
        typeof cred.issuer === "string" ? cred.issuer : cred.issuer?.id;

      if (credentialIssuer && credentialIssuer !== issuerDID) {
        console.warn(
          `⚠️ Issuer mismatch: ${credentialIssuer} !== ${issuerDID}`,
        );
      }

      if (cred.expirationDate) {
        const expirationTime = new Date(cred.expirationDate).getTime();
        if (expirationTime < Date.now()) {
          throw new Error("Credential has expired");
        }
      }

      if (cred.issuanceDate) {
        const issuanceTime = new Date(cred.issuanceDate).getTime();
        if (issuanceTime > Date.now()) {
          throw new Error("Credential issuance date is in the future");
        }
      }

      console.log("✅ Credential verification passed");
      return true;
    } catch (error) {
      console.error("❌ Credential verification failed:", error);
      return false;
    }
  }

  async acceptCredentialOffer(
    credentialOffer: CredentialOffer,
    invitationData: {
      invitationUrl: string;
      displayName?: string;
    },
  ): Promise<StoredCredential> {
    try {
      console.log("🎯 Accepting credential offer...");

      const credentialIssuer = credentialOffer.credential_issuer;
      const credentialFormats = credentialOffer.credentials[0];

      if (!credentialFormats) {
        throw new Error("No credential formats available in offer");
      }

      const credentialType =
        credentialFormats.credential_definition?.type?.[1] ||
        credentialFormats.credential_definition?.type?.[0] ||
        "VerifiableCredential";

      const credentialSubject = credentialFormats.credential_definition
        ?.credentialSubject as Record<string, unknown> | undefined;
      const credentialJwtString = credentialSubject?.credential as
        | string
        | undefined;

      if (!credentialJwtString || typeof credentialJwtString !== "string") {
        console.warn(
          "⚠️  No JWT found in credentialSubject, storing credential definition",
        );
      } else {
        console.log("✅ Found embedded credential JWT");
      }

      const isValid = await this.verifyCredential(
        credentialFormats.credential_definition,
        credentialIssuer,
      );

      if (!isValid) {
        throw new Error("Credential verification failed");
      }

      const storedCredential: StoredCredential = {
        id: generateUUID(),
        type: "verifiable-credential",
        credential: (credentialJwtString
          ? credentialJwtString
          : credentialFormats.credential_definition ||
            credentialOffer) as StoredCredential["credential"],
        credentialType,
        issuer: credentialIssuer,
        state: "accepted",
        storedAt: new Date().toISOString(),
        metadata: {
          sourceUrl: invitationData.invitationUrl,
          displayName:
            invitationData.displayName ||
            `${credentialType} from ${credentialIssuer}`,
          credentialJwt: credentialJwtString,
        },
      };

      this.storeCredential(storedCredential);

      console.log("✅ Credential accepted and stored:", storedCredential.id);

      return storedCredential;
    } catch (error) {
      console.error("❌ Error accepting credential offer:", error);
      throw error;
    }
  }

  private storeCredential(credential: StoredCredential): void {
    try {
      console.log("💾 Storing credential in localStorage...");
      console.log("📋 Storage key:", this.storageKey);
      console.log("🎫 Credential to store:", credential);

      const stored = localStorage.getItem(this.storageKey);
      console.log(
        "📦 Existing storage:",
        stored ? `${stored.length} bytes` : "empty",
      );

      const credentials: StoredCredential[] = stored ? JSON.parse(stored) : [];
      console.log("📊 Existing credentials count:", credentials.length);

      credentials.push(credential);
      console.log("➕ Added credential, new count:", credentials.length);

      const jsonString = JSON.stringify(credentials);
      localStorage.setItem(this.storageKey, jsonString);
      console.log(
        "💾 Saved to localStorage, size:",
        jsonString.length,
        "bytes",
      );

      const verification = localStorage.getItem(this.storageKey);
      if (verification) {
        console.log(
          "✅ Verified: Credential successfully stored in localStorage",
        );
        console.log(
          "✅ Total credentials now:",
          JSON.parse(verification).length,
        );
      } else {
        console.error("❌ WARNING: Could not verify storage!");
      }

      console.log(`✅ Stored credential: ${credential.id}`);
    } catch (error) {
      console.error("❌ Error storing credential:", error);
      throw error;
    }
  }

  getStoredCredentials(): StoredCredential[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const credentials: StoredCredential[] = stored ? JSON.parse(stored) : [];

      return credentials.filter((cred) => {
        if (cred.expiresAt) {
          const expireTime = new Date(cred.expiresAt).getTime();
          return expireTime > Date.now();
        }
        return true;
      });
    } catch (error) {
      console.error("❌ Error retrieving credentials:", error);
      return [];
    }
  }

  getCredentialById(id: string): StoredCredential | undefined {
    const credentials = this.getStoredCredentials();
    return credentials.find((c) => c.id === id);
  }

  deleteCredential(id: string): boolean {
    try {
      const stored = localStorage.getItem(this.storageKey);
      let credentials: StoredCredential[] = stored ? JSON.parse(stored) : [];

      credentials = credentials.filter((c) => c.id !== id);

      localStorage.setItem(this.storageKey, JSON.stringify(credentials));

      console.log(`✅ Deleted credential: ${id}`);
      return true;
    } catch (error) {
      console.error("❌ Error deleting credential:", error);
      return false;
    }
  }

  clearAllCredentials(): void {
    try {
      localStorage.removeItem(this.storageKey);
      console.log("✅ All credentials cleared");
    } catch (error) {
      console.error("❌ Error clearing credentials:", error);
    }
  }

  getCredentialsByIssuer(issuer: string): StoredCredential[] {
    return this.getStoredCredentials().filter((c) => c.issuer === issuer);
  }

  getCredentialsByType(type: string): StoredCredential[] {
    return this.getStoredCredentials().filter((c) => c.credentialType === type);
  }
}

export const walletService = new WalletService();
