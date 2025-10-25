// Import types and functions
import { initializeEnvironment } from "./init";
import {
  Storage,
  JwkMemStore,
  KeyIdMemStore,
  init,
} from "@iota/identity-wasm/web";
import type { Document, IotaModule } from "./types.js";

// Network URL for IOTA Identity Client (testnet)
export const NETWORK_URL = "https://api.testnet.shimmer.network";

// Network name for client-side DIDs (not published to blockchain)
// const NETWORK_NAME = "smr"; // Shimmer network identifier - not used, kept for reference

// Types for stored documents
interface StoredDocument {
  id: string;
  timestamp: string;
  document: string; // Serialized DID document as JSON string
}

// State variables
let wasmModule: IotaModule | null = null;
let globalStorage: Storage | null = null;

/**
 * Initialize IOTA Identity WASM
 * The Client will be created when needed by VerifiableCredentials.ts
 */
export async function initIdentity(): Promise<void> {
  try {
    // Load and initialize WASM if not already done
    if (!wasmModule) {
      console.log("Loading IOTA Identity WASM module...");
      wasmModule = await initializeEnvironment();
      console.log("✅ WASM module initialized");
    }

    // Initialize WASM
    console.log("Initializing IOTA Identity WASM...");
    await init();
    console.log("✅ IOTA Identity WASM initialized");
  } catch (error: unknown) {
    console.error("❌ Error initializing IOTA Identity:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Get or create a memory storage instance for the session
 * This persists for the lifetime of the page
 * MUST be synchronous to match IOTA Identity Client API expectations
 */
export function getMemstorage(): Storage {
  if (!globalStorage) {
    // Create storage only once per session
    globalStorage = new Storage(new JwkMemStore(), new KeyIdMemStore());
    console.log("✅ Created new session storage");
  }
  return globalStorage;
}

/**
 * Create identity with REAL cryptographic keys for v1.4.0
 * Generates Ed25519 keys for signed credentials
 */
export async function createIdentityWithClient(): Promise<{
  document: Document;
  storage: Storage;
  fragment: string;
}> {
  try {
    console.log("🔐 Creating identity with cryptographic keys (v1.4.0)...");

    // Ensure WASM is initialized
    if (!wasmModule) {
      wasmModule = await initializeEnvironment();
    }

    const storage = getMemstorage();

    // Import required classes for v1.4.0
    const { IotaDID, IotaDocument, MethodScope } = await import(
      "@iota/identity-wasm/web"
    );

    // Generate a random DID instead of placeholder (which gives 0x000...)
    // This creates a unique DID with a random identifier
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey); // Generate random 32 bytes

    // Create DID from random bytes (creates unique identifier)
    const didBytes = new Uint8Array(32);
    crypto.getRandomValues(didBytes);
    const didHex = Array.from(didBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const did = IotaDID.parse(`did:iota:smr:0x${didHex}`);

    // Create a new document with the unique DID
    const document = IotaDocument.newWithId(did);

    console.log("📝 Generating Ed25519 verification method...");

    try {
      // Generate a verification method with real Ed25519 keys
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

/**
 * Legacy function - kept for backward compatibility
 * Use createIdentityWithClient() instead for proper signed credentials
 */
export async function createDidDocument(): Promise<Document> {
  const { document } = await createIdentityWithClient();
  return document;
}

/**
 * Get the storage instance created during identity creation
 * This contains the keys needed for signing operations
 */
export function getIdentityStorage(): Storage {
  return getMemstorage();
}

/**
 * Store document in local storage
 * Note: We serialize using toJSON() and wrap in the expected format
 */
export function saveDocument(doc: Document): void {
  try {
    console.log("Storing DID Document...");
    const documents = loadDocuments();

    // Safe access with type assertion
    const iotaDoc = doc as Document;
    const docId = iotaDoc.id().toString();

    if (!documents.some((d) => d.id === docId)) {
      // Get the JSON representation
      const docJson = iotaDoc.toJSON();

      // Store as stringified JSON
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

/**
 * Load documents from local storage
 */
export function loadDocuments(): StoredDocument[] {
  try {
    const stored = localStorage.getItem("stored-documents");
    return stored ? JSON.parse(stored) : [];
  } catch (error: unknown) {
    console.error("❌ Error retrieving DID Documents:", error);
    return [];
  }
}

/**
 * Load the most recent DID document
 */
export async function loadDocument(): Promise<Document | null> {
  try {
    if (!wasmModule) {
      wasmModule = await initializeEnvironment();
    }

    const documents = loadDocuments();
    if (documents.length === 0) {
      return null;
    }

    // Get the most recent document
    const latest = documents[documents.length - 1];
    // Parse the JSON string and recreate the document
    const docJson = JSON.parse(latest.document);
    return wasmModule.IotaDocument.fromJSON(docJson);
  } catch (error: unknown) {
    console.error("❌ Error loading DID Document:", error);
    return null;
  }
}
