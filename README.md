# 🌍 Borderless Identity

> Decentralized credentials for migrants, nomads, and international workers

[![IOTA](https://img.shields.io/badge/Built%20on-IOTA-00E0CA?style=flat-square)](https://www.iota.org/)
[![OpenID4VC](https://img.shields.io/badge/OpenID4VC-Compatible-blue?style=flat-square)](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html)

## 🎯 Overview

Borderless Identity enables global citizens to maintain and authenticate their
credentials across borders without relying on traditional state-based IDs. Built
on IOTA Identity with feeless transactions and cryptographic security.

**Solution**: Self-sovereign identity using IOTA + OpenID4VC standards for
instant, verifiable credentials.

---

## ✨ Features

### 5 Credential Types

- **🛂 Travel Documents** - Passports, visas, travel authorization
- **💼 Work Authorization** - Work permits, employment verification
- **🎓 Professional Skills** - Certifications, licenses, training
- **🏥 Health Records** - Vaccinations, medical history, blood type
- **📚 Education Credentials** - Degrees, diplomas, transcripts

### Key Capabilities

- ✅ **Instant Issuance** - Credentials issued in < 5 seconds
- ✅ **Zero Fees** - IOTA's feeless model
- ✅ **Cryptographically Secure** - DID + digital signatures
- ✅ **User Controlled** - No central authority
- ✅ **Global Recognition** - Works anywhere
- ✅ **Mobile Ready** - UniMe wallet integration

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI Components:** Radix UI (accessible, modern)
- **Identity Layer:** IOTA Identity (DID)
- **Credential Protocol:** UniCore SSI Agent (OpenID4VC)
- **Mobile Wallet:** UniMe Wallet
- **Standards:** W3C Verifiable Credentials, OpenID4VC

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Docker & Docker Compose
- Git

### Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd borderless-identity
```

### Step 2: Install Dependencies

```bash
pnpm install
# or
npm install
```

### Step 3: Setup UniCore SSI Agent

The application requires a UniCore SSI Agent server to issue and verify
credentials.

#### Option A: Local Setup (Recommended for Testing)

1. **Clone SSI Agent Repository:**

```bash
# In a separate directory
git clone https://github.com/impierce/ssi-agent
cd ssi-agent/agent_application
```

2. **Configure Credentials:**

Edit `config.yaml` and add the following credential configurations:

```yaml
credential_configurations:
  # Base Verifiable Credential
  - credential_configuration_id: VerifiableCredential
    format: jwt_vc_json
    credential_definition:
      type:
        - VerifiableCredential
    display:
      - name: Verifiable Credential
        locale: en-US
        logo:
          url: https://impierce.com/images/logo.webp
          alt_text: Impierce Logo
        background_color: "#12107c"
        text_color: "#FFFFFF"
```

3. **Start SSI Agent with Docker:**

```bash
cd docker
docker-compose up -d
```

4. **Verify SSI Agent is Running:**

```bash
# Check if container is running
docker ps | grep unicore

# Check health endpoint
curl http://localhost:3033/health

# Verify credential configurations
curl http://localhost:3033/.well-known/openid-credential-issuer
```

Expected response should include all credential configurations.

#### Option B: Network Setup (Different Machines)

If running SSI Agent on a different machine:

1. **Find SSI Agent Machine IP:**

```bash
# On Linux/Mac
ip addr show
# or
ifconfig

# On Windows
ipconfig
```

2. **Configure Docker to Listen on All Interfaces:**

Edit `docker-compose.yml` in SSI Agent:

```yaml
services:
  unicore:
    ports:
      - "0.0.0.0:3033:3033" # Listen on all interfaces
```

3. **Restart Docker:**

```bash
docker-compose down
docker-compose up -d
```

4. **Configure Firewall:**

```bash
# Linux (UFW)
sudo ufw allow 3033/tcp
sudo ufw reload

# Mac - System Preferences → Security → Firewall → Add exception

# Windows - Windows Defender Firewall → Allow app on port 3033
```

### Step 4: Configure Application Environment

Create `.env.local` file in the project root:

**For Local Setup:**

```env
VITE_SSI_AGENT_URL=http://localhost:3033
```

**For Network Setup:**

```env
VITE_SSI_AGENT_URL=http://192.168.x.x:3033
```

Replace `192.168.x.x` with your SSI Agent machine's IP address.

### Step 5: Start Development Server

```bash
pnpm dev
# or
npm run dev
```

Visit `http://localhost:5173`

---

## 🧪 How to Test the Application

### Test 1: Verify SSI Agent Connection

**Purpose:** Ensure the application can connect to the UniCore SSI Agent

**Steps:**

1. Open the application at `http://localhost:5173`
2. Look at the top-right corner of the interface
3. Check the connection status indicator

**Expected Result:**

- ✅ Green badge showing "Connected"
- ✅ Credential type dropdown is populated with 6 options

**If Disconnected:**

```bash
# Check if SSI Agent is running
docker ps | grep unicore

# Check SSI Agent logs
cd ssi-agent/agent_application/docker
docker-compose logs -f

# Test connection manually
curl http://localhost:3033/health

# Verify .env.local has correct URL
cat .env.local
```

---

### Test 2: Issue Travel Document Credential

**Purpose:** Test credential issuance flow with Travel Document

**Steps:**

1. From the credential type dropdown, select **"Travel Document"**
2. Fill in the form with test data:
   - **First Name:** John
   - **Last Name:** Doe
   - **Date of Birth:** 1990-01-01
   - **Nationality:** USA
   - **Passport Number:** P123456789
   - **Document Number:** TD987654321
   - **Issue Date:** 2020-01-01
   - **Expiry Date:** 2030-12-31
3. Click **"Issue Travel Document"** button
4. Wait for the response

**Expected Result:**

- ✅ Form submits successfully
- ✅ QR code appears within 5 seconds
- ✅ Success message is displayed
- ✅ Credential offer URL is shown below QR code

**What's Happening:**

1. Application sends credential data to SSI Agent
2. SSI Agent creates a DID-signed credential
3. SSI Agent generates an OpenID4VC offer
4. Application displays QR code for mobile wallet

---

### Test 7: Form Validation

**Purpose:** Test form validation rules

**Steps:**

1. Select any credential type
2. Try to submit the form without filling any fields
3. Fill only some required fields
4. Try invalid date formats
5. Try special characters in text fields

**Expected Result:**

- ✅ Empty form shows validation errors
- ✅ Required fields are clearly marked
- ✅ Invalid dates are rejected
- ✅ Form only submits when all validations pass
- ✅ Clear error messages displayed

---

### Test 8: Verification Flow

**Purpose:** Test credential verification

**Steps:**

1. Click on **"Verify Credentials"** tab
2. Select credential type to verify (e.g., "Travel Document")
3. Click **"Create Verification Request"**
4. QR code for verification appears
5. (If wallet available) Scan with wallet and present credential
6. View verification result

**Expected Result:**

- ✅ Verification QR code generated
- ✅ Verification request created successfully
- ✅ (With wallet) Credential can be presented
- ✅ Verification result displayed

---

### Test 9: Error Handling

**Purpose:** Test application behavior when SSI Agent is unavailable

**Steps:**

1. Stop the SSI Agent:
   ```bash
   cd ssi-agent/agent_application/docker
   docker-compose down
   ```
2. Refresh the web application
3. Try to issue a credential
4. Observe error messages

**Expected Result:**

- ✅ Connection status shows "Disconnected" (red badge)
- ✅ Clear error message displayed
- ✅ Application doesn't crash
- ✅ User-friendly error explanation

**Restart SSI Agent:**

```bash
docker-compose up -d
```

---

## 📄 License

MIT License - see LICENSE file for details.

---

**Borderless Identity** - Your credentials, anywhere in the world 🌍

Built with ❤️ on IOTA
