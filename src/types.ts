import type {
  IotaIdentityClient,
  IotaDocument,
  Storage,
  VerificationMethod,
} from "@iota/identity-wasm/web";

export type {
  IotaIdentityClient as Client,
  IotaDocument as Document,
  Storage,
  VerificationMethod,
};

export interface IotaModule {
  init(): Promise<void>;
  IotaIdentityClient: typeof IotaIdentityClient;
  IotaDocument: typeof IotaDocument;
  Storage: typeof Storage;
  VerificationMethod: typeof VerificationMethod;
  initialized?: boolean;
}

export class WasmLoadError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "WasmLoadError";
  }
}
