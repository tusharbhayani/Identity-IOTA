/**
 * Initialize the IOTA Identity WASM environment
 */

import type { IotaModule } from "./types";
import { WasmLoadError } from "./types";
import { initializeWasm } from "./utils/wasm-loader";

let wasmModule: IotaModule | null = null;

export async function initializeEnvironment(): Promise<IotaModule> {
  if (wasmModule?.initialized) {
    return wasmModule;
  }

  try {
    const identity = await initializeWasm();
    
    console.log("Identity module loaded, available exports:", Object.keys(identity));
    
    // Create typed module interface with correct WASM export names
    wasmModule = {
      init: identity.init,
      IotaIdentityClient: identity.IotaIdentityClient,
      IotaDocument: identity.IotaDocument,
      Storage: identity.Storage,
      VerificationMethod: identity.VerificationMethod,
      initialized: true,
    };
    
    console.log("WASM module structure created:", {
      hasClient: !!wasmModule.IotaIdentityClient,
      hasDocument: !!wasmModule.IotaDocument,
      hasStorage: !!wasmModule.Storage,
    });
    
    return wasmModule;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("WASM initialization error:", errorMessage);
    throw new WasmLoadError("Failed to initialize WASM module", error);
  }
}
