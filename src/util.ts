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
      wasmModule = await initializeEnvironment();
    }

    await init();
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export function getMemstorage(): Storage {
  if (!globalStorage) {
    globalStorage = new Storage(new JwkMemStore(), new KeyIdMemStore());
  }
  return globalStorage;
}

export async function createIdentityWithClient(): Promise<{
  document: Document;
  storage: Storage;
  fragment: string;
}> {
  try {
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

    try {
      const fragment = await document.generateMethod(
        storage,
        JwkMemStore.ed25519KeyType(),
        "EdDSA" as unknown as Parameters<typeof document.generateMethod>[2],
        "#key-1",
        MethodScope.VerificationMethod(),
      );

      return {
        document,
        storage,
        fragment,
      };
    } catch {
      return {
        document,
        storage,
        fragment: "#key-1",
      };
    }
  } catch (error: unknown) {
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
    }
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export function loadDocuments(): StoredDocument[] {
  try {
    const stored = localStorage.getItem("stored-documents");
    return stored ? JSON.parse(stored) : [];
  } catch (error: unknown) {
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
    return null;
  }
}
