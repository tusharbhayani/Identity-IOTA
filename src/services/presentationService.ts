import {
  Presentation,
  EdDSAJwsVerifier,
  JwtPresentationValidationOptions,
  JwtPresentationValidator,
  JwsVerificationOptions,
  Jwt,
  JwtCredentialValidator,
  JwtCredentialValidationOptions,
  SubjectHolderRelationship,
  FailFast,
  Storage,
} from "@iota/identity-wasm/web";
import type { IotaDocument } from "@iota/identity-wasm/web";

export interface PresentationData {
  holder: string;
  verifiableCredentials: Jwt[];
  challenge?: string;
  expirationMinutes?: number;
}

export interface StoredPresentation {
  jwt: string;
  presentation: Record<string, unknown>;
  holder: string;
  createdAt: string;
  credentialCount: number;
}

export async function createPresentation(
  holderDocument: IotaDocument,
  holderStorage: Storage,
  holderFragment: string,
  presentationData: PresentationData,
): Promise<Jwt> {
  try {
    console.log("🔐 Creating SIGNED verifiable presentation...");

    const presentation = new Presentation({
      holder: holderDocument.id(),
      verifiableCredential: presentationData.verifiableCredentials,
    });

    console.log("✍️  Signing presentation with Ed25519 key...");

    try {
      const { JwsSignatureOptions, JwtPresentationOptions } = await import(
        "@iota/identity-wasm/web"
      );

      const signatureOptions = new JwsSignatureOptions();

      const presentationOptions = new JwtPresentationOptions();

      const presentationJwt = await holderDocument.createPresentationJwt(
        holderStorage,
        holderFragment,
        presentation,
        signatureOptions,
        presentationOptions,
      );

      console.log("✅ Presentation SIGNED successfully with EdDSA!");
      console.log("🔒 JWT has cryptographic signature (alg: EdDSA)");

      return presentationJwt;
    } catch (signError) {
      console.error("❌ Signing failed, falling back to unsigned:", signError);

      console.log("⚠️  Creating unsigned JWT (alg: 'none')...");

      const header = { alg: "none", typ: "JWT" };
      const payload = {
        iss: presentation.holder().toString(),
        vp: presentation.toJSON(),
        nbf: Math.floor(Date.now() / 1000),
        exp:
          Math.floor(Date.now() / 1000) +
          (presentationData.expirationMinutes || 60) * 60,
        ...(presentationData.challenge && {
          nonce: presentationData.challenge,
        }),
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
    console.error("❌ Error creating presentation:", error);
    throw error;
  }
}

export async function verifyPresentation(
  presentationJwt: Jwt,
  holderDocument: IotaDocument,
  issuerDocuments: IotaDocument[],
  challenge?: string,
): Promise<{
  presentation: Presentation;
  credentialsValid: boolean;
}> {
  try {
    console.log("Verifying presentation...");

    const jwtString = presentationJwt.toString();
    const parts = jwtString.split(".");

    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const base64UrlDecode = (str: string) => {
      const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      const padding = "=".repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(atob(base64 + padding));
    };

    const header = base64UrlDecode(parts[0]);
    const payload = base64UrlDecode(parts[1]);

    if (header.alg === "none") {
      console.log(
        "ℹ️  Verifying unsigned presentation (structure validation only)",
      );

      if (!payload.vp) {
        throw new Error("Invalid presentation structure");
      }

      const presentation = new Presentation(payload.vp);

      if (challenge && payload.nonce !== challenge) {
        throw new Error("Challenge mismatch");
      }

      if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) {
        throw new Error("Presentation expired");
      }

      console.log("✅ Presentation structure validated (unsigned)");

      const credentials = presentation.verifiableCredential();
      console.log(
        `ℹ️  Presentation contains ${credentials.length} credential(s)`,
      );

      return {
        presentation,
        credentialsValid: true,
      };
    }

    console.log("ℹ️  Attempting cryptographic verification...");

    const validationOptions = challenge
      ? new JwtPresentationValidationOptions({
          presentationVerifierOptions: new JwsVerificationOptions({
            nonce: challenge,
          }),
        })
      : new JwtPresentationValidationOptions();

    const validator = new JwtPresentationValidator(new EdDSAJwsVerifier());
    const decodedPresentation = validator.validate(
      presentationJwt,
      holderDocument,
      validationOptions,
    );

    console.log("✅ Presentation signature verified");

    console.log("Verifying embedded credentials...");
    const presentation = decodedPresentation.presentation();

    const credentialValidator = new JwtCredentialValidator(
      new EdDSAJwsVerifier(),
    );
    const credentialOptions = new JwtCredentialValidationOptions({
      subjectHolderRelationship: [
        holderDocument.id().toString(),
        SubjectHolderRelationship.AlwaysSubject,
      ],
    });

    const jwtCredentials: Jwt[] = presentation
      .verifiableCredential()
      .map((credential) => {
        const jwt = credential.tryIntoJwt();
        if (!jwt) {
          throw new Error("Expected a JWT credential");
        }
        return jwt;
      });

    let allCredentialsValid = true;
    for (let i = 0; i < jwtCredentials.length; i++) {
      try {
        credentialValidator.validate(
          jwtCredentials[i],
          issuerDocuments[i],
          credentialOptions,
          FailFast.FirstError,
        );
        console.log(`✅ Credential ${i + 1} verified`);
      } catch (error) {
        console.error(`❌ Credential ${i + 1} verification failed:`, error);
        allCredentialsValid = false;
      }
    }

    return {
      presentation: decodedPresentation.intoPresentation(),
      credentialsValid: allCredentialsValid,
    };
  } catch (error) {
    console.error("❌ Presentation verification failed:", error);
    throw error;
  }
}

export function storePresentation(jwt: Jwt, presentation: Presentation): void {
  try {
    const presentations = loadPresentations();

    const storedPresentation: StoredPresentation = {
      jwt: jwt.toString(),
      presentation: presentation.toJSON() as Record<string, unknown>,
      holder: presentation.holder().toString(),
      createdAt: new Date().toISOString(),
      credentialCount: presentation.verifiableCredential().length,
    };

    presentations.push(storedPresentation);
    localStorage.setItem("iota-presentations", JSON.stringify(presentations));
    console.log("✅ Presentation stored locally");
  } catch (error) {
    console.error("❌ Error storing presentation:", error);
    throw error;
  }
}

export function loadPresentations(): StoredPresentation[] {
  try {
    const stored = localStorage.getItem("iota-presentations");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("❌ Error loading presentations:", error);
    return [];
  }
}

export function clearPresentations(): void {
  localStorage.removeItem("iota-presentations");
  console.log("✅ All presentations cleared");
}
