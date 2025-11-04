const getBaseUrl = () => {
  const url = import.meta.env?.VITE_UNICORE_API_URL || "http://localhost:3000";

  return url;
};

export const UNICORE_CONFIG = {
  BASE_URL: getBaseUrl(),
  API_VERSION: "v0",
  ENABLE_MOCK: false,
  CLIENT_ID:
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_UNICORE_CLIENT_ID
      : process.env.VITE_UNICORE_CLIENT_ID,
  CLIENT_SECRET:
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_UNICORE_CLIENT_SECRET
      : process.env.VITE_UNICORE_CLIENT_SECRET,
  ENDPOINTS: {
    DID_CONFIGURATION: "/.well-known/did-configuration.json",
    DID_JSON: "/.well-known/did.json",
    OAUTH_SERVER: "/.well-known/oauth-authorization-server",
    OPENID_ISSUER: "/.well-known/openid-credential-issuer",
    CREDENTIALS: "/v0/credentials",
    OFFERS: "/v0/offers",
    AUTHORIZATION_REQUESTS: "/v0/authorization_requests",
    HEALTH: "/health",
  },
  CREDENTIAL_TYPES: {
    MIGRATION_ID: "MigrationIdentity",
    WORK_PERMIT: "WorkPermit",
    HEALTH_RECORD: "HealthRecord",
    SKILL_CERTIFICATION: "SkillCertification",
  },
};
