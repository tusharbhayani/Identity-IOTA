import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 5173;

// Serve static files directly from the root
app.use(express.static(__dirname));

// Set correct MIME types with logging
app.use((req, res, next) => {
  if (req.url?.endsWith(".wasm")) {
    console.log(`🧩 Serving WASM file: ${req.url}`);
    res.setHeader("Content-Type", "application/wasm");
  }

  // Add security headers for SharedArrayBuffer support
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  // Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  next();
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// Special handling for node_modules WASM files
app.use("/node_modules", express.static(join(__dirname, "node_modules")));

// Handle all requests by serving the index.html for SPA routing
app.get("*", (req, res, next) => {
  if (!req.url.includes(".")) {
    console.log(`🔄 Serving index.html for path: ${req.url}`);
    res.sendFile(join(__dirname, "index.html"));
  } else {
    next();
  }
});

app.use(express.json());

const invitationStore = new Map();

const shortenedUrlStore = new Map();

function generateShortId() {
  return Math.random().toString(36).substring(2, 8);
}

app.post("/api/shorten-invitation", (req, res) => {
  console.log(`🔗 Shortening invitation URL:`, req.body);

  try {
    const { invitationUrl, persistent = false } = req.body;

    if (!invitationUrl) {
      return res.status(400).json({ error: "invitationUrl is required" });
    }

    const shortId = generateShortId();

    shortenedUrlStore.set(shortId, {
      shortId,
      invitationUrl,
      persistent,
      createdAt: new Date().toISOString(),
    });

    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
    const shortenedUrl = `${baseUrl}/i/${shortId}`;

    console.log(`✅ Created shortened URL: ${shortenedUrl} → ${invitationUrl}`);

    res.json({
      shortenedUrl,
      shortId,
      originalUrl: invitationUrl,
    });
  } catch (error) {
    console.error(`❌ Error shortening URL:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/i/:shortId", (req, res) => {
  console.log(`🔗 Retrieving shortened URL: ${req.params.shortId}`);

  const shortId = req.params.shortId;
  const storedUrl = shortenedUrlStore.get(shortId);

  if (!storedUrl) {
    console.log(`⚠️  Shortened URL not found: ${shortId}`);
    return res.status(404).json({ error: "Shortened URL not found" });
  }

  console.log(`✅ Redirecting to: ${storedUrl.invitationUrl}`);
  res.redirect(storedUrl.invitationUrl);
});

app.get("/api/short/:shortId", (req, res) => {
  console.log(`📤 Getting shortened URL details: ${req.params.shortId}`);

  const shortId = req.params.shortId;
  const storedUrl = shortenedUrlStore.get(shortId);

  if (!storedUrl) {
    console.log(`⚠️  Shortened URL not found: ${shortId}`);
    return res.status(404).json({ error: "Shortened URL not found" });
  }

  res.json(storedUrl);
});

app.get("/api/invitations/credential-offer", (req, res) => {
  console.log(
    `📨 Credential offer request from wallet (credential_offer_uri endpoint):`,
    req.query,
  );

  const invitationId = req.query.invitation_id;

  if (!invitationId) {
    console.error(`❌ Missing invitation_id parameter`);
    return res.status(400).json({ error: "invitation_id is required" });
  }

  let storedInvitation = invitationStore.get(invitationId);

  if (!storedInvitation) {
    console.log(
      `⚠️  Invitation ${invitationId} not found in store, creating demo invitation`,
    );

    storedInvitation = {
      id: invitationId,
      credentialType: "UniversityDegreeCredential",
      issuerDID: "did:iota:example",
      credentialJwt:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJpc3MiOiJkaWQ6aW90YTpleGFtcGxlIn0.",
    };
  }
  const credentialOffer = {
    credential_issuer: "https://192.168.29.111:5173",
    credential_configuration_ids: [
      storedInvitation.credentialType || "UniversityDegreeCredential",
    ],
    grants: {
      "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
        "pre-authorized_code": invitationId,
        user_pin_required: false,
      },
    },
  };

  console.log(
    `✅ Returning OpenID4VCI credential offer:`,
    JSON.stringify(credentialOffer, null, 2),
  );

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.json(credentialOffer);
});

app.get("/.well-known/openid-credential-issuer", (req, res) => {
  console.log(`📋 Credential Issuer metadata request (OpenID4VCI discovery)`);

  const issuerMetadata = {
    credential_issuer: "http://192.168.29.111:5173",
    authorization_servers: ["http://192.168.29.111:5173"],
    credential_endpoint: "http://192.168.29.111:5173/api/credentials/issue",
    credential_configurations_supported: {
      UniversityDegreeCredential: {
        format: "jwt_vc_json",
        credential_definition: {
          type: ["VerifiableCredential", "UniversityDegreeCredential"],
          credentialSubject: {
            givenName: {},
            familyName: {},
            degree: {},
          },
        },
        display: [
          {
            name: "University Degree Credential",
            locale: "en-US",
            background_color: "#12107c",
            text_color: "#FFFFFF",
          },
        ],
      },
    },
  };

  console.log(
    `✅ Returning issuer metadata:`,
    JSON.stringify(issuerMetadata, null, 2),
  );

  res.setHeader("Content-Type", "application/json");
  res.json(issuerMetadata);
});

app.post("/api/invitations", (req, res) => {
  console.log(`📥 Storing invitation:`, req.body);

  try {
    const { id, credentialType, issuerDID, credentialJwt, expiresAt } =
      req.body;

    if (!id) {
      return res.status(400).json({ error: "Invitation ID is required" });
    }

    const invitation = {
      id,
      credentialType,
      issuerDID,
      credentialJwt,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    invitationStore.set(id, invitation);
    console.log(`✅ Stored invitation: ${id}`);

    res.json({
      status: "stored",
      invitation,
    });
  } catch (error) {
    console.error(`❌ Error storing invitation:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/invitations/:id", (req, res) => {
  console.log(`📤 Retrieving invitation: ${req.params.id}`);

  const invitation = invitationStore.get(req.params.id);

  if (!invitation) {
    console.log(`⚠️  Invitation not found: ${req.params.id}`);
    return res.status(404).json({ error: "Invitation not found" });
  }

  res.json(invitation);
});

app.get("/api/invitations", (req, res) => {
  console.log(`📤 Listing all invitations`);

  const invitations = Array.from(invitationStore.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  res.json({
    count: invitations.length,
    invitations,
  });
});

app.delete("/api/invitations", (req, res) => {
  console.log(`🗑️ Clearing all invitations`);

  try {
    const deletedCount = invitationStore.size;
    invitationStore.clear();

    console.log(`✅ Cleared ${deletedCount} invitations`);

    res.json({
      status: "cleared",
      message: `Successfully cleared ${deletedCount} invitation(s)`,
      deletedCount,
    });
  } catch (error) {
    console.error(`❌ Error clearing invitations:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/invitations/:id", (req, res) => {
  console.log(`🗑️ Deleting invitation: ${req.params.id}`);

  try {
    const invitationId = req.params.id;

    if (!invitationStore.has(invitationId)) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    invitationStore.delete(invitationId);
    console.log(`✅ Deleted invitation: ${invitationId}`);

    res.json({
      status: "deleted",
      message: `Successfully deleted invitation ${invitationId}`,
      invitationId,
    });
  } catch (error) {
    console.error(`❌ Error deleting invitation:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/invitations/presentation-response", (req, res) => {
  console.log(`📥 Received presentation response:`, req.body);

  res.json({
    status: "received",
    message: "Presentation received successfully",
  });
});

app.post("/api/credentials/issue", (req, res) => {
  console.log(`🎫 Credential issuance request:`, req.body);

  try {
    const { pre_authorized_code } = req.body;

    if (!pre_authorized_code) {
      return res.status(400).json({ error: "pre_authorized_code is required" });
    }

    const invitation = invitationStore.get(pre_authorized_code);

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (!invitation.credentialJwt) {
      return res.status(400).json({ error: "Credential JWT not available" });
    }

    invitation.status = "accepted";
    invitationStore.set(pre_authorized_code, invitation);

    res.json({
      credential: invitation.credentialJwt,
      format: "jwt_vc",
      c_nonce: `nonce_${Date.now()}`,
      c_nonce_expires_in: 3600,
    });

    console.log(`✅ Issued credential for invitation: ${pre_authorized_code}`);
  } catch (error) {
    console.error(`❌ Error issuing credential:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);
  res.status(500).send(`Server Error: ${err.message}`);
  next();
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log(`🌐 Open your browser to http://localhost:${port}`);
});
