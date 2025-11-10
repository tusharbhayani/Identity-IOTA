# Borderless Identity Application

A comprehensive Self-Sovereign Identity (SSI) demonstration using IOTA Identity with support for W3C Verifiable Credentials, presentations, and wallet invitation URLs.

## 🌟 Features

### Core Identity Functions
- **Digital Identity Creation**: Generate IOTA DID documents with Ed25519 keys
- **Credential Issuance**: Issue W3C Verifiable Credentials as JWTs
- **Presentation Creation**: Create verifiable presentations from stored credentials
- **Credential Verification**: Verify credentials and presentations cryptographically

### 🆕 Invitation URL System
- **Credential Invitation URLs**: Generate shareable URLs and QR codes for credential issuance
- **Presentation Request URLs**: Create invitation URLs to request credentials from others
- **Mobile Wallet Integration**: QR codes compatible with SSI mobile wallets
- **OpenID4VCI Support**: Standards-compliant credential offering protocol

### Technical Stack
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) for the frontend
- [Vite](https://vitejs.dev/) for build tooling and development
- [Radix UI](https://www.radix-ui.com/) for UI components
- [IOTA Identity](https://wiki.iota.org/identity.rs/welcome/) for SSI functionality
- [react-qr-code](https://www.npmjs.com/package/react-qr-code) for QR code generation
- [Express.js](https://expressjs.com/) for the backend API

## 🚀 Quick Start

### Installation
```bash
pnpm install
```

### Development
```bash
pnpm dev
```

This starts both the React development server and the Express backend on `http://localhost:5173`.

### Building for Production
```bash
pnpm build
```

## 📱 Using Invitation URLs

### For Credential Issuance
1. Go to the **Credentials** tab
2. Click "Issue New Credential"
3. Fill in the credential details
4. Enable "Generate invitation URL for wallet sharing"
5. After issuance, you'll get:
   - A QR code for mobile wallets to scan
   - A shareable URL
   - The actual credential JWT

### For Requesting Presentations
1. Go to the **Invitations** tab
2. Click "Create Presentation Request"
3. Configure what credentials you want to request
4. Set a challenge and expiration time
5. Share the generated QR code or URL
6. Monitor responses in the invitation history

## 🔧 Architecture

### Frontend Components
- **InvitationDisplay**: Shows invitation URLs with QR codes
- **InvitationList**: Manages invitation history
- **PresentationRequestForm**: Creates presentation requests
- **IssueCredentialForm**: Enhanced with invitation URL generation

### Data Flow
1. **Credential Issuance**: Create credential → Generate invitation → Share QR/URL
2. **Presentation Request**: Create request → Generate invitation → Receive response
3. **Wallet Integration**: Mobile wallets scan QR → Fetch invitation → Process credential/request

## 📋 Supported Standards

- **W3C Verifiable Credentials**: Full support for VC data model
- **W3C Verifiable Presentations**: VP creation and verification
- **OpenID for Verifiable Credential Issuance (OpenID4VCI)**: Standards-compliant credential offers
- **DID Core Specification**: IOTA DID method implementation
- **JWT-based Credentials**: Compact, verifiable credential format

## 🔐 Security Features

- **Ed25519 Cryptographic Signatures**: Strong cryptographic security
- **Challenge-Response Protocol**: Prevents replay attacks in presentations
- **Expiring Invitations**: Time-limited invitation URLs
- **Domain Verification**: Optional domain binding for presentation requests

## 📱 Mobile Wallet Compatibility

The generated invitation URLs and QR codes are compatible with mobile SSI wallets that support:
- OpenID4VCI credential issuance protocol
- W3C Verifiable Credentials
- DID-based authentication
- QR code invitation scanning

## 📄 License

This project is built on IOTA's open-source identity infrastructure and serves as a demonstration of Self-Sovereign Identity capabilities.

## 🤝 Contributing

This is a demonstration application. For production use, consider:
- Implementing proper key management
- Adding encrypted storage
- Integrating with production IOTA networks
- Implementing proper authentication and authorization
- Adding comprehensive error handling
- Setting up monitoring and logging
