import { initializeEnvironment } from "./init";
import {
  Storage,
  JwkMemStore,
  KeyIdMemStore,
  init,
} from "@iota/identity-wasm/web";
import type { Document, IotaModule } from "./types.js";

export const NETWORK_URL = "https://api.testnet.shimmer.network";
interface StoredDocument {
  id: string;
  timestamp: string;
  document: string;
}

let wasmModule: IotaModule | null = null;
let globalStorage: Storage | null = null;

export async function initIdentity(): Promise<void> {
  try {
    if (!wasmModule) {
      console.log("Loading IOTA Identity WASM module...");
      wasmModule = await initializeEnvironment();
      console.log("✅ WASM module initialized");
    }

    console.log("Initializing IOTA Identity WASM...");
    await init();
    console.log("✅ IOTA Identity WASM initialized");
  } catch (error: unknown) {
    console.error("❌ Error initializing IOTA Identity:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export function getMemstorage(): Storage {
  if (!globalStorage) {
    globalStorage = new Storage(new JwkMemStore(), new KeyIdMemStore());
    console.log("✅ Created new session storage");
  }
  return globalStorage;
}

export async function createIdentityWithClient(): Promise<{
  document: Document;
  storage: Storage;
  fragment: string;
}> {
  try {
    console.log("🔐 Creating identity with cryptographic keys (v1.4.0)...");

    if (!wasmModule) {
      wasmModule = await initializeEnvironment();
    }

    const storage = getMemstorage();

    const { IotaDID, IotaDocument, MethodScope } = await import(
      "@iota/identity-wasm/web"
    );

    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);

    const didBytes = new Uint8Array(32);
    crypto.getRandomValues(didBytes);
    const didHex = Array.from(didBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const did = IotaDID.parse(`did:iota:smr:0x${didHex}`);

    const document = IotaDocument.newWithId(did);

    console.log("📝 Generating Ed25519 verification method...");

    try {
      const fragment = await document.generateMethod(
        storage,
        JwkMemStore.ed25519KeyType(),
        "EdDSA" as unknown as Parameters<typeof document.generateMethod>[2],
        "#key-1",
        MethodScope.VerificationMethod(),
      );

      console.log("✅ Identity created with REAL keys!");
      console.log("🆔 DID:", document.id().toString());
      console.log("🔑 Key fragment:", fragment);
      console.log("✨ Ready for SIGNED credentials (alg: EdDSA)");

      return {
        document,
        storage,
        fragment,
      };
    } catch {
      console.warn("⚠️  Key generation not supported, using simple identity");
      console.log("✅ DID Document created:", document.id().toString());
      console.log("ℹ️  Will use unsigned JWT credentials");

      return {
        document,
        storage,
        fragment: "#key-1",
      };
    }
  } catch (error: unknown) {
    console.error("❌ Error creating identity:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function createDidDocument(): Promise<Document> {
  const { document } = await createIdentityWithClient();
  return document;
}

export function getIdentityStorage(): Storage {
  return getMemstorage();
}

export function saveDocument(doc: Document): void {
  try {
    console.log("Storing DID Document...");
    const documents = loadDocuments();

    const iotaDoc = doc as Document;
    const docId = iotaDoc.id().toString();

    if (!documents.some((d) => d.id === docId)) {
      const docJson = iotaDoc.toJSON();

      const stored: StoredDocument = {
        id: docId,
        timestamp: new Date().toISOString(),
        document: JSON.stringify(docJson),
      };
      documents.push(stored);
      localStorage.setItem("stored-documents", JSON.stringify(documents));
      console.log(
        "✅ DID Document stored successfully in browser local storage",
      );
    } else {
      console.log("ℹ️ Document already exists in storage");
    }
  } catch (error: unknown) {
    console.error("❌ Error storing DID Document:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export function loadDocuments(): StoredDocument[] {
  try {
    const stored = localStorage.getItem("stored-documents");
    return stored ? JSON.parse(stored) : [];
  } catch (error: unknown) {
    console.error("❌ Error retrieving DID Documents:", error);
    return [];
  }
}

export async function loadDocument(): Promise<Document | null> {
  try {
    if (!wasmModule) {
      wasmModule = await initializeEnvironment();
    }

    const documents = loadDocuments();
    if (documents.length === 0) {
      return null;
    }

    const latest = documents[documents.length - 1];
    const docJson = JSON.parse(latest.document);
    return wasmModule.IotaDocument.fromJSON(docJson);
  } catch (error: unknown) {
    console.error("❌ Error loading DID Document:", error);
    return null;
  }
}
