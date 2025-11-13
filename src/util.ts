import { initializeEnvironment } from "./init";
import { init } from "@iota/identity-wasm/web";
import type { IotaModule } from "./types.js";

let wasmModule: IotaModule | null = null;

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
