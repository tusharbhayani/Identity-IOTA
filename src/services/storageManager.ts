import { Storage } from "@iota/identity-wasm/web";
import { getIdentityStorage } from "../util";

export function getGlobalStorage(): Storage {
  try {
    const storage = getIdentityStorage();
    if (!storage) {
      throw new Error("Storage not available. Create an identity first.");
    }
    return storage;
  } catch (error) {
    console.error("❌ Error getting storage:", error);
    throw new Error(
      "Failed to get storage. Make sure you've created an identity first.",
    );
  }
}

export function resetGlobalStorage(): void {
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__IOTA_STORAGE__ = undefined;
  }
}

export function hasGlobalStorage(): boolean {
  try {
    getIdentityStorage();
    return true;
  } catch {
    return false;
  }
}
