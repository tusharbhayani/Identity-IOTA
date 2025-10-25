/**
 * Type Definitions for IOTA Identity WASM Module
 */

// Import base types from WASM module
import type {
  IotaIdentityClient,
  IotaDocument,
  Storage,
  VerificationMethod,
} from "@iota/identity-wasm/web";

// Export the types with friendly names
export type { 
  IotaIdentityClient as Client,
  IotaDocument as Document,
  Storage, 
  VerificationMethod 
};

// Define the expected module interface
export interface IotaModule {
  init(): Promise<void>;
  IotaIdentityClient: typeof IotaIdentityClient;
  IotaDocument: typeof IotaDocument;
  Storage: typeof Storage;
  VerificationMethod: typeof VerificationMethod;
  initialized?: boolean;
}

// Error type for WASM loading failures
export class WasmLoadError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "WasmLoadError";
  }
}
