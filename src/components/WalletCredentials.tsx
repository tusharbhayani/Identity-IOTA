import { useState, useEffect } from "react";
import { walletService, StoredCredential } from "../services/walletService";
import * as Dialog from "@radix-ui/react-dialog";

export function WalletCredentials() {
    const [credentials, setCredentials] = useState<StoredCredential[]>([]);
    const [selectedCredential, setSelectedCredential] = useState<StoredCredential | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadCredentials();
    }, []);

    const loadCredentials = () => {
        const stored = walletService.getStoredCredentials();
        setCredentials(stored);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this credential?")) {
            walletService.deleteCredential(id);
            loadCredentials();
            setShowDetails(false);
        }
    };

    const handleClearAll = () => {
        if (
            confirm(
                "Are you sure you want to delete ALL credentials? This cannot be undone."
            )
        ) {
            walletService.clearAllCredentials();
            loadCredentials();
        }
    };

    const handleViewDetails = (credential: StoredCredential) => {
        setSelectedCredential(credential);
        setShowDetails(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getCredentialTypeDisplay = (type: string) => {
        return type.replace(/^Verifiable/, "");
    };

    const getStateColor = (state: string) => {
        switch (state) {
            case "accepted":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        My Credentials
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {credentials.length === 0
                            ? "No credentials stored yet"
                            : `You have ${credentials.length} credential${credentials.length === 1 ? '' : 's'}`
                        }
                    </p>
                </div>
                {credentials.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all duration-150 shadow-md hover:shadow-lg"
                    >
                        🗑️ Clear All
                    </button>
                )}
            </div>

            {credentials.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm p-5">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Total Credentials</p>
                        <p className="text-3xl font-bold text-blue-900">{credentials.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm p-5">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Accepted</p>
                        <p className="text-3xl font-bold text-green-900">
                            {credentials.filter((c) => c.state === "accepted").length}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl shadow-sm p-5">
                        <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">Pending</p>
                        <p className="text-3xl font-bold text-yellow-900">
                            {credentials.filter((c) => c.state === "pending").length}
                        </p>
                    </div>
                </div>
            )}

            {credentials.length === 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
                    <div className="text-8xl mb-4">📭</div>
                    <p className="text-gray-900 text-xl font-semibold mb-2">No credentials yet</p>
                    <p className="text-gray-600 text-base">
                        Go to "Receive Credentials" tab to scan a QR code or enter an invitation URL
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {credentials.map((credential) => (
                        <div
                            key={credential.id}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden hover:scale-[1.02]"
                            onClick={() => handleViewDetails(credential)}
                        >
                            <div className={`h-2 ${credential.state === 'accepted' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                credential.state === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                                    'bg-gradient-to-r from-red-500 to-rose-500'
                                }`} />

                            <div className="p-5 space-y-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-900 truncate">
                                            {getCredentialTypeDisplay(credential.credentialType)}
                                        </h3>
                                        {credential.metadata?.displayName && (
                                            <p className="text-xs text-gray-600 mt-1 truncate">
                                                {credential.metadata.displayName}
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${getStateColor(
                                            credential.state
                                        )}`}
                                    >
                                        {credential.state}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🏢 Issuer</p>
                                    <p className="text-xs font-mono truncate text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-200" title={credential.issuer}>
                                        {credential.issuer}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1">📅 Stored</p>
                                        <p className="text-gray-900 font-medium">{new Date(credential.storedAt).toLocaleDateString()}</p>
                                    </div>
                                    {credential.expiresAt && (
                                        <div>
                                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1">⏰ Expires</p>
                                            <p className="text-gray-900 font-medium">{new Date(credential.expiresAt).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetails(credential);
                                    }}
                                    className="flex-1 px-3 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-150 shadow-sm hover:shadow-md"
                                >
                                    👁️ View
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(credential.id);
                                    }}
                                    className="px-3 py-2 text-sm font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-all duration-150"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog.Root open={showDetails} onOpenChange={setShowDetails}>
                <Dialog.Portal>
                    <Dialog.Overlay
                        className="fixed inset-0 bg-black/50 z-[9998] animate-in fade-in duration-200"
                        style={{
                            backdropFilter: 'blur(4px)'
                        }}
                    />
                    <Dialog.Content
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-0 max-w-2xl w-full max-h-[85vh] overflow-hidden z-[9999] animate-in zoom-in-95 duration-200"
                        aria-describedby="credential-details-description"
                        style={{
                            border: '1px solid rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        {selectedCredential && (
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 relative flex-shrink-0">
                                    <Dialog.Close asChild>
                                        <button
                                            className="absolute top-4 right-4 text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                                            aria-label="Close dialog"
                                        >
                                            ✕
                                        </button>
                                    </Dialog.Close>

                                    <Dialog.Title className="text-2xl font-bold text-white mb-1 pr-10">
                                        🎫 Credential Details
                                    </Dialog.Title>
                                    <Dialog.Description id="credential-details-description" className="text-sm text-white/90">
                                        View full details, copy data, or delete this credential
                                    </Dialog.Description>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">📝 Type</p>
                                            <p className="text-lg font-bold text-purple-900">
                                                {selectedCredential.credentialType}
                                            </p>
                                            {selectedCredential.metadata?.displayName && (
                                                <p className="text-sm text-purple-700 mt-1">
                                                    {selectedCredential.metadata.displayName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">📊 Status</p>
                                            <span
                                                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStateColor(
                                                    selectedCredential.state
                                                )}`}
                                            >
                                                {selectedCredential.state.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">🏢 Issuer DID</p>
                                            <p className="text-xs text-gray-900 break-all font-mono bg-gray-50 p-3 rounded border border-gray-200">
                                                {selectedCredential.issuer}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">📅 Stored At</p>
                                                <p className="text-sm text-gray-900 font-medium">
                                                    {formatDate(selectedCredential.storedAt)}
                                                </p>
                                            </div>

                                            {selectedCredential.expiresAt && (
                                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">⏰ Expires At</p>
                                                    <p className="text-sm text-gray-900 font-medium">
                                                        {formatDate(selectedCredential.expiresAt)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {selectedCredential.metadata?.sourceUrl && (
                                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">🔗 Source URL</p>
                                                <p className="text-xs text-gray-900 break-all font-mono bg-gray-50 p-3 rounded border border-gray-200">
                                                    {selectedCredential.metadata.sourceUrl}
                                                </p>
                                            </div>
                                        )}

                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                                                📄 Full Credential Data
                                            </p>
                                            <pre className="text-xs bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto max-h-64 font-mono">
                                                {JSON.stringify(selectedCredential.credential, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                const jwt = selectedCredential.metadata?.credentialJwt ||
                                                    (typeof selectedCredential.credential === 'string'
                                                        ? selectedCredential.credential
                                                        : JSON.stringify(selectedCredential.credential));

                                                navigator.clipboard.writeText(jwt);

                                                if (selectedCredential.metadata?.credentialJwt) {
                                                    alert("✅ Credential JWT copied to clipboard!\n\n📋 Next steps:\n1. Go to 'Create Presentation' tab\n2. Paste this JWT in the credentials field\n3. Enter your Holder DID\n4. Click 'Create Presentation'");
                                                } else {
                                                    alert("⚠️  No JWT found. Copied credential data instead.\n\nThis credential may not have a valid JWT format for creating presentations.");
                                                }
                                            }}
                                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-150 shadow-md hover:shadow-lg"
                                        >
                                            📋 Copy JWT for Proof
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    JSON.stringify(selectedCredential.credential, null, 2)
                                                );
                                                alert("✅ Full credential data copied to clipboard!");
                                            }}
                                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-150 shadow-md hover:shadow-lg"
                                        >
                                            📄 Copy Data
                                        </button>
                                        <button
                                            onClick={() => handleDelete(selectedCredential.id)}
                                            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-rose-700 transition-all duration-150 shadow-md hover:shadow-lg"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
