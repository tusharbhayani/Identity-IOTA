import { Jwt } from "@iota/identity-wasm/web";

export interface CredentialOffer {
  type: "CredentialOffer";
  credential_issuer: string;
  credentials: Array<{
    format: "jwt_vc";
    credential_definition: {
      type: string[];
      credentialSubject?: Record<string, unknown>;
    };
  }>;
  grants?: {
    "urn:ietf:params:oauth:grant-type:pre-authorized_code"?: {
      "pre-authorized_code": string;
      user_pin_required?: boolean;
    };
  };
}

export interface StoredInvitation {
  id: string;
  type: "credential-offer";
  invitationUrl: string;
  httpUrl: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
  expiresAt: string;
  credentialType: string;
  issuerDID: string;
  credentialJwt?: string;
}

class InvitationService {
  private baseUrl: string;
  private readonly storage = "invitations";

  constructor(customBaseUrl?: string) {
    if (customBaseUrl) {
      this.baseUrl = customBaseUrl;
    } else if (
      typeof import.meta.env !== "undefined" &&
      import.meta.env.VITE_SERVER_URL
    ) {
      this.baseUrl = import.meta.env.VITE_SERVER_URL;
    } else if (typeof window !== "undefined") {
      this.baseUrl = `${window.location.protocol}//${window.location.host}`;
    } else {
      this.baseUrl = "http://192.168.29.111:5173";
    }
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  async generateCredentialInvitation(
    credentialJwt: Jwt,
    credentialType: string,
    issuerDID: string,
    expiresInMinutes: number = 1440,
  ): Promise<StoredInvitation> {
    try {
      const invitationId = this.generateId();
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      const credentialOffer: CredentialOffer = {
        type: "CredentialOffer",
        credential_issuer: issuerDID,
        credentials: [
          {
            format: "jwt_vc",
            credential_definition: {
              type: ["VerifiableCredential", credentialType],
              credentialSubject: {
                credential: credentialJwt.toString(),
              },
            },
          },
        ],
        grants: {
          "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
            "pre-authorized_code": invitationId,
            user_pin_required: false,
          },
        },
      };

      const offerJson = JSON.stringify(credentialOffer);
      const offerBase64 = btoa(offerJson);

      const fullHttpUrl = `${this.baseUrl}/#/accept-credential?oob=${encodeURIComponent(offerBase64)}`;

      let httpUrl = fullHttpUrl;
      try {
        const response = await fetch(`${this.baseUrl}/api/shorten-invitation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invitationUrl: fullHttpUrl,
            persistent: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          httpUrl = data.shortenedUrl;
          console.log(`✅ Shortened URL: ${httpUrl}`);
        } else {
          console.warn(`⚠️  URL shortening failed, using full URL`);
        }
      } catch (error) {
        console.warn(`⚠️  URL shortening error:`, error);
      }

      const invitationUrl = `iota-credential://?oob=${encodeURIComponent(offerBase64)}`;

      const invitation: StoredInvitation = {
        id: invitationId,
        type: "credential-offer",
        invitationUrl,
        httpUrl,
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        credentialType,
        issuerDID,
        credentialJwt: credentialJwt.toString(),
      };

      this.storeInvitation(invitation);
      console.log(
        `✅ Generated OOB invitation with embedded credential: ${invitationId}`,
      );

      return invitation;
    } catch (error) {
      console.error("❌ Failed to generate credential invitation:", error);
      throw new Error("Failed to generate credential invitation");
    }
  }

  private async syncInvitationToServer(
    invitation: StoredInvitation,
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: invitation.id,
          credentialType: invitation.credentialType,
          issuerDID: invitation.issuerDID,
          credentialJwt: invitation.credentialJwt,
          expiresAt: invitation.expiresAt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      console.log(`✅ Synced invitation to server: ${invitation.id}`);
    } catch (error) {
      console.error(`❌ Failed to sync invitation to server:`, error);
      throw error;
    }
  }

  private storeInvitation(invitation: StoredInvitation): void {
    try {
      const stored = this.getStoredInvitations();
      stored[invitation.id] = invitation;
      localStorage.setItem(this.storage, JSON.stringify(stored));
      console.log(`✅ Stored invitation: ${invitation.id}`);
    } catch (error) {
      console.error("❌ Failed to store invitation:", error);
      throw new Error("Failed to store invitation");
    }
  }

  getInvitation(id: string): StoredInvitation | null {
    try {
      const stored = this.getStoredInvitations();
      const invitation = stored[id];

      if (!invitation) {
        return null;
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        invitation.status = "expired";
        this.storeInvitation(invitation);
      }

      return invitation;
    } catch (error) {
      console.error("❌ Failed to get invitation:", error);
      return null;
    }
  }

  getAllInvitations(): StoredInvitation[] {
    try {
      const stored = this.getStoredInvitations();
      return Object.values(stored).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } catch (error) {
      console.error("❌ Failed to get invitations:", error);
      return [];
    }
  }

  updateInvitationStatus(
    id: string,
    status: StoredInvitation["status"],
  ): boolean {
    try {
      const invitation = this.getInvitation(id);
      if (!invitation) {
        return false;
      }

      invitation.status = status;
      this.storeInvitation(invitation);
      console.log(`✅ Updated invitation ${id} to ${status}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to update invitation:", error);
      return false;
    }
  }

  private getStoredInvitations(): Record<string, StoredInvitation> {
    try {
      const stored = localStorage.getItem(this.storage);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("❌ Failed to parse stored invitations:", error);
      return {};
    }
  }

  private generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearExpiredInvitations(): void {
    try {
      const stored = this.getStoredInvitations();
      const now = new Date();
      let hasChanges = false;

      for (const [id, invitation] of Object.entries(stored)) {
        if (new Date(invitation.expiresAt) < now) {
          delete stored[id];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        localStorage.setItem(this.storage, JSON.stringify(stored));
        console.log("🧹 Cleared expired invitations");
      }
    } catch (error) {
      console.error("❌ Failed to clear expired invitations:", error);
    }
  }

  clearLocalInvitations(): void {
    try {
      localStorage.removeItem(this.storage);
      console.log("🗑️ Cleared all local invitations");
    } catch (error) {
      console.error("❌ Failed to clear local invitations:", error);
    }
  }

  async clearServerInvitations(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/invitations`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to clear server invitations: ${response.statusText}`,
        );
      }

      const result = await response.json();
      console.log(`✅ Server cleared ${result.deletedCount} invitations`);
    } catch (error) {
      console.error("❌ Failed to clear server invitations:", error);
      throw error;
    }
  }

  async deleteServerInvitation(invitationId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/invitations/${invitationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to delete invitation: ${response.statusText}`);
      }

      console.log(`✅ Deleted invitation: ${invitationId}`);
    } catch (error) {
      console.error("❌ Failed to delete invitation:", error);
      throw error;
    }
  }

  async clearAllInvitations(): Promise<void> {
    try {
      console.log("🗑️ Clearing all invitations (local + server)...");

      this.clearLocalInvitations();

      await this.clearServerInvitations();

      console.log("✅ All invitations cleared successfully");
    } catch (error) {
      console.error("❌ Failed to clear all invitations:", error);
      throw error;
    }
  }
}

export const invitationService = new InvitationService();
export default invitationService;
