declare global {
  interface Window {
    __IOTA_WASM_MODULE__?: typeof import("@iota/identity-wasm/web");
    __IOTA_WASM_INITIALIZING__?: boolean;
  }
}

function checkWebAssemblySupport() {
  if (typeof WebAssembly === "undefined") {
    throw new Error("WebAssembly is not supported in this browser");
  }
}

export async function initializeWasm(): Promise<
  typeof import("@iota/identity-wasm/web")
> {
  if (window.__IOTA_WASM_MODULE__) {
    return window.__IOTA_WASM_MODULE__;
  }

  if (window.__IOTA_WASM_INITIALIZING__) {
    while (window.__IOTA_WASM_INITIALIZING__) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (window.__IOTA_WASM_MODULE__) {
      return window.__IOTA_WASM_MODULE__;
    }
  }

  try {
    window.__IOTA_WASM_INITIALIZING__ = true;
    checkWebAssemblySupport();

    await import("@iota/sdk-wasm/web");
    const identity = await import("@iota/identity-wasm/web");

    if (typeof identity.init === "function") {
      try {
        const wasmUrl = await import(
          "@iota/identity-wasm/web/identity_wasm_bg.wasm?url"
        );
        const response = await fetch(wasmUrl.default);
        if (!response.ok) {
          throw new Error(`Failed to fetch WASM: ${response.statusText}`);
        }
        const wasmBytes = await response.arrayBuffer();

        await identity.init(wasmBytes);
      } catch (error) {
        console.error("Failed to initialize with WASM bytes:", error);
        throw error;
      }
    }

    window.__IOTA_WASM_MODULE__ = identity;
    window.__IOTA_WASM_INITIALIZING__ = false;

    return identity;
  } catch (error) {
    window.__IOTA_WASM_INITIALIZING__ = false;
    console.error("IOTA Identity WASM initialization failed:", error);
    console.error("Full error:", JSON.stringify(error, null, 2));
    throw error;
  }
}
