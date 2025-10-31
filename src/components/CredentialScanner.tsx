import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import * as Dialog from "@radix-ui/react-dialog";
import { walletService, CredentialOffer } from "../services/walletService";

interface CredentialScannerProps {
    onCredentialAccepted?: (credentialId: string) => void;
    onError?: (error: Error) => void;
}

export function CredentialScanner({
    onCredentialAccepted,
    onError,
}: CredentialScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [manualUrl, setManualUrl] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [credentialOffer, setCredentialOffer] = useState<CredentialOffer | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);

    useEffect(() => {
        if (isScanning && videoRef.current) {
            qrScannerRef.current = new QrScanner(
                videoRef.current,
                (result) => handleQrCodeScanned(result.data),
                {
                    returnDetailedScanResult: true,
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                }
            );

            qrScannerRef.current.start().catch((err) => {
                console.error("Failed to start QR scanner:", err);
                onError?.(new Error("Camera access denied or not available"));
                setIsScanning(false);
            });
        }

        return () => {
            if (qrScannerRef.current) {
                qrScannerRef.current.stop();
                qrScannerRef.current.destroy();
                qrScannerRef.current = null;
            }
        };
    }, [isScanning]);

    const handleQrCodeScanned = async (url: string) => {
        console.log("📷 QR Code scanned:", url);

        setIsScanning(false);

        await processCredentialUrl(url);
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!manualUrl.trim()) {
            return;
        }

        await processCredentialUrl(manualUrl);
    };

    const processCredentialUrl = async (url: string) => {
        setIsProcessing(true);

        try {
            console.log("🔄 Processing credential URL:", url);

            const offer = await walletService.parseCredentialOfferFromUrl(url);

            console.log("✅ Credential offer parsed successfully:", offer);
            console.log("📋 Setting credential offer and showing preview...");

            setCredentialOffer(offer);
            setShowPreview(true);

            console.log("✅ Preview dialog state set - showPreview:", true);
            console.log("✅ Credential offer:", offer);
        } catch (error) {
            console.error("❌ Error processing credential URL:", error);
            onError?.(error instanceof Error ? error : new Error("Failed to process credential"));
            alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to process credential'}\n\nCheck console for details.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAcceptCredential = async () => {
        if (!credentialOffer) {
            console.error("❌ No credential offer to accept");
            return;
        }

        console.log("🎯 Starting to accept credential offer...");
        setIsProcessing(true);

        try {
            console.log("📤 Calling walletService.acceptCredentialOffer...");

            const storedCredential = await walletService.acceptCredentialOffer(
                credentialOffer,
                {
                    invitationUrl: manualUrl || "qr-code",
                    displayName: extractCredentialDisplayName(credentialOffer),
                }
            );

            console.log("✅ Credential accepted successfully:", storedCredential);
            console.log("💾 Credential ID:", storedCredential.id);

            setShowPreview(false);
            setCredentialOffer(null);
            setManualUrl("");

            setSuccessMessage("✅ Credential accepted and stored in your wallet!");
            setTimeout(() => setSuccessMessage(null), 5000);

            console.log("✅ Success message set, preview closed");

            onCredentialAccepted?.(storedCredential.id);

            alert(`✅ Success!\n\nCredential stored in your wallet.\n\nGo to "💼 My Wallet" tab to view it.\n\nCredential ID: ${storedCredential.id}`);
        } catch (error) {
            console.error("❌ Error accepting credential:", error);
            alert(`❌ Failed to accept credential:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
            onError?.(error instanceof Error ? error : new Error("Failed to accept credential"));
        } finally {
            setIsProcessing(false);
            console.log("🏁 Accept credential process finished");
        }
    };

    const handleRejectCredential = () => {
        setShowPreview(false);
        setCredentialOffer(null);
        setManualUrl("");
    };

    const extractCredentialDisplayName = (offer: CredentialOffer): string => {
        const credentialType =
            offer.credentials[0]?.credential_definition?.type?.[1] ||
            offer.credentials[0]?.credential_definition?.type?.[0] ||
            "Credential";

        return credentialType;
    };

    return (
        <div className="space-y-6">
            {successMessage && (
                <div className="bg-green-50 border border-green-500 rounded-lg p-4 flex items-start gap-3 animate-pulse">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                        <p className="font-semibold text-green-900">{successMessage}</p>
                        <p className="text-sm text-green-700 mt-1">
                            Go to "💼 My Wallet" tab to view your credential
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">📖 How to Use</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li><strong>Option 1:</strong> Click "Start Camera Scanner" and point at QR code</li>
                    <li><strong>Option 2:</strong> Paste invitation URL below and click "Load Credential"</li>
                    <li>Review credential details in the preview dialog</li>
                    <li>Click "Accept & Store" to save to your wallet</li>
                    <li>View your credentials in the "💼 My Wallet" tab</li>
                </ol>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Scan Credential QR Code</h2>

                {!isScanning ? (
                    <button
                        onClick={() => setIsScanning(true)}
                        disabled={isProcessing}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                    >
                        {isProcessing ? "Processing..." : "Start Camera Scanner"}
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="relative">
                            <video
                                ref={videoRef}
                                className="w-full max-w-md mx-auto rounded-lg border-2 border-blue-500"
                            />
                            <div className="absolute top-2 right-2">
                                <button
                                    onClick={() => setIsScanning(false)}
                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                >
                                    Stop
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                            Point your camera at the QR code
                        </p>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Or Enter Invitation URL Manually</h2>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="invitation-url" className="block text-sm font-medium text-gray-700 mb-1">
                            Invitation URL
                        </label>
                        <input
                            id="invitation-url"
                            type="url"
                            value={manualUrl}
                            onChange={(e) => setManualUrl(e.target.value)}
                            placeholder="https://..."
                            disabled={isProcessing || isScanning}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isProcessing || isScanning || !manualUrl.trim()}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                    >
                        {isProcessing ? "Processing..." : "Load Credential"}
                    </button>
                </form>
            </div>

            {showPreview && (
                <div className="fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-[10001]">
                    🐛 Dialog should be visible! showPreview={showPreview ? 'true' : 'false'}
                </div>
            )}

            {showPreview && credentialOffer && (
                <div
                    className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    style={{
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowPreview(false);
                        }
                    }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
                        style={{
                            border: '1px solid rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 relative">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                            >
                                ✕
                            </button>

                            <h2 className="text-2xl font-bold text-white mb-1 pr-8">
                                🎫 Credential Offer
                            </h2>
                            <p className="text-sm text-white/90">
                                Review details before accepting
                            </p>
                        </div>

                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">📝 Credential Type</p>
                                    <p className="text-xl font-bold text-blue-900">
                                        {extractCredentialDisplayName(credentialOffer)}
                                    </p>
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">🏢 Issuer DID</p>
                                    <p className="text-xs text-gray-900 break-all font-mono bg-white p-2 rounded border border-gray-200">
                                        {credentialOffer.credential_issuer}
                                    </p>
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">📄 Format</p>
                                    <p className="text-sm text-gray-900 font-medium">
                                        {credentialOffer.credentials[0]?.format || "Unknown"}
                                    </p>
                                </div>

                                {credentialOffer.credentials[0]?.credential_definition?.credentialSubject && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">✅ Credential Data</p>
                                        <pre className="text-xs bg-white p-3 rounded border border-green-200 overflow-x-auto max-h-48 font-mono">
                                            {JSON.stringify(
                                                credentialOffer.credentials[0].credential_definition.credentialSubject,
                                                null,
                                                2
                                            )}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleRejectCredential}
                                    disabled={isProcessing}
                                    className="flex-1 px-5 py-3 border-2 border-red-300 text-red-700 font-semibold rounded-lg hover:bg-red-50 hover:border-red-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 transition-all duration-150 shadow-sm"
                                >
                                    ❌ Reject
                                </button>
                                <button
                                    onClick={handleAcceptCredential}
                                    disabled={isProcessing}
                                    className="flex-1 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-150 shadow-lg hover:shadow-xl disabled:shadow-none"
                                >
                                    {isProcessing ? (
                                        <>⏳ Accepting...</>
                                    ) : (
                                        <>✅ Accept & Store</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Dialog.Root open={false} onOpenChange={setShowPreview}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" style={{ zIndex: 9999 }} />
                    <Dialog.Content
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto z-50"
                        style={{ zIndex: 10000 }}
                        aria-describedby="credential-preview-description"
                    >
                        <Dialog.Title className="text-xl font-semibold mb-2">
                            🎫 Credential Offer Received
                        </Dialog.Title>

                        <Dialog.Description id="credential-preview-description" className="text-sm text-gray-600 mb-4">
                            Review the credential details below and decide whether to accept or reject it.
                        </Dialog.Description>

                        {credentialOffer && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs font-medium text-blue-900 mb-1">📝 Credential Type</p>
                                    <p className="text-sm font-semibold text-blue-700">
                                        {extractCredentialDisplayName(credentialOffer)}
                                    </p>
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs font-medium text-gray-700 mb-1">🏢 Issuer DID</p>
                                    <p className="text-xs text-gray-900 break-all font-mono">
                                        {credentialOffer.credential_issuer}
                                    </p>
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs font-medium text-gray-700 mb-1">📄 Format</p>
                                    <p className="text-sm text-gray-900">
                                        {credentialOffer.credentials[0]?.format || "Unknown"}
                                    </p>
                                </div>

                                {credentialOffer.credentials[0]?.credential_definition?.credentialSubject && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <p className="text-xs font-medium text-green-900 mb-2">✅ Credential Data</p>
                                        <pre className="text-xs bg-white p-2 rounded overflow-x-auto max-h-40">
                                            {JSON.stringify(
                                                credentialOffer.credentials[0].credential_definition.credentialSubject,
                                                null,
                                                2
                                            )}
                                        </pre>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6 pt-4 border-t">
                                    <button
                                        onClick={handleRejectCredential}
                                        disabled={isProcessing}
                                        className="flex-1 px-4 py-3 border-2 border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                                    >
                                        ❌ Reject
                                    </button>
                                    <button
                                        onClick={handleAcceptCredential}
                                        disabled={isProcessing}
                                        className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors shadow-sm"
                                    >
                                        {isProcessing ? "⏳ Accepting..." : "✅ Accept & Store"}
                                    </button>
                                </div>
                            </div>
                        )}

                        <Dialog.Close asChild>
                            <button
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                                aria-label="Close dialog"
                            >
                                ✕
                            </button>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
