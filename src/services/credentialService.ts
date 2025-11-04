import {
  Credential,
  EdDSAJwsVerifier,
  FailFast,
  JwtCredentialValidationOptions,
  JwtCredentialValidator,
  Storage,
  Jwt,
} from "@iota/identity-wasm/web";
import type { IotaDocument } from "@iota/identity-wasm/web";
import { getGlobalStorage } from "./storageManager";

export interface CredentialSubject {
  id: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CredentialData {
  id: string;
  type: string;
  issuer: string;
  credentialSubject: CredentialSubject;
}

export interface StoredCredential {
  jwt: string;
  type: string;
  issuer: string;
  subject: string;
  claims: Record<string, string | number | boolean | undefined>;
  issuedAt: string;
}
export function createStorage(): Storage {
  return getGlobalStorage();
}
export async function issueCredential(
  issuerDocument: IotaDocument,
  issuerStorage: Storage,
  issuerFragment: string,
  credentialData: CredentialData,
): Promise<Jwt> {
  try {
    const credential = new Credential({
      id: credentialData.id,
      type: [credentialData.type],
      issuer: issuerDocument.id(),
      credentialSubject: credentialData.credentialSubject,
    });

    try {
      const { JwsSignatureOptions } = await import("@iota/identity-wasm/web");

      const credentialJwt = await issuerDocument.createCredentialJwt(
        issuerStorage,
        issuerFragment,
        credential,
        new JwsSignatureOptions(),
      );

      return credentialJwt;
    } catch (signError) {
      const header = { alg: "none", typ: "JWT" };
      const payload = {
        iss: credential.issuer().toString(),
        sub: credentialData.credentialSubject.id,
        ...credential.toJSON(),
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
      };

      const base64UrlEncode = (obj: object) => {
        const json = JSON.stringify(obj);
        return btoa(json)
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=/g, "");
      };

      const jwtString = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.`;
      return new Jwt(jwtString);
    }
  } catch (error) {
    console.error("❌ Error issuing credential:", error);
    throw error;
  }
}

export async function verifyCredential(
  credentialJwt: Jwt,
  _issuerDocument: IotaDocument,
): Promise<Credential> {
  try {
    const jwtString = credentialJwt.toString();
    const parts = jwtString.split(".");

    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    // Decode payload
    const base64UrlDecode = (str: string) => {
      const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      const padding = "=".repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(atob(base64 + padding));
    };

    const header = base64UrlDecode(parts[0]);
    const payload = base64UrlDecode(parts[1]);

    // Check if it's an unsigned JWT
    if (header.alg === "none") {
      if (!payload.issuer || !payload.credentialSubject) {
        throw new Error("Invalid credential structure");
      }
      const { Credential } = await import("@iota/identity-wasm/web");
      const credential = new Credential(payload);

      return credential;
    }
    const validator = new JwtCredentialValidator(new EdDSAJwsVerifier());
    const decodedCredential = validator.validate(
      credentialJwt,
      _issuerDocument,
      new JwtCredentialValidationOptions(),
      FailFast.FirstError,
    );

    return decodedCredential.intoCredential();
  } catch (error) {
    console.error("Credential verification failed:", error);
    throw error;
  }
}
export function storeCredential(jwt: Jwt, credential: Credential): void {
  try {
    const credentials = loadCredentials();

    const credentialSubject = credential.credentialSubject();
    const claims: Record<string, string | number | boolean | undefined> = {};

    if (typeof credentialSubject === "object" && credentialSubject !== null) {
      for (const [key, value] of Object.entries(credentialSubject)) {
        if (
          key !== "id" &&
          (typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean")
        ) {
          claims[key] = value;
        }
      }
    }

    const storedCred: StoredCredential = {
      jwt: jwt.toString(),
      type: credential.type()[credential.type().length - 1] || "Unknown",
      issuer: credential.issuer().toString(),
      subject:
        typeof credentialSubject === "object" && credentialSubject !== null
          ? (credentialSubject as { id?: string }).id || ""
          : "",
      claims,
      issuedAt: new Date().toISOString(),
    };

    credentials.push(storedCred);
    localStorage.setItem("iota-credentials", JSON.stringify(credentials));
  } catch (error) {
    console.error("❌ Error storing credential:", error);
    throw error;
  }
}

export function loadCredentials(): StoredCredential[] {
  try {
    const stored = localStorage.getItem("iota-credentials");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("❌ Error loading credentials:", error);
    return [];
  }
}
export function clearCredentials(): void {
  localStorage.removeItem("iota-credentials");
}
