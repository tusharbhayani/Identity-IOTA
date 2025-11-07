/**
 * UniCore Credentials Manager
 * Clean implementation using the complete UniCore API service
 */

import React, { useState, useEffect } from 'react';
import { unicoreService } from '../services/unicore/unicoreService';
import { QRCodeGenerator } from './QRCodeGenerator';

interface CredentialForm {
    type: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    passportNumber?: string;
    employerId?: string;
    position?: string;
    validUntil?: string;
}

interface IssuedCredential {
    id: string;
    type: string;
    offerUrl: string;
    timestamp: string;
    status: 'issued' | 'pending' | 'error';
}

export const UniCoreCredentialsManager: React.FC = () => {
    const [form, setForm] = useState<CredentialForm>({
        type: 'MigrationIdentity',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: '',
        passportNumber: '',
    });

    const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredential[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [healthStatus, setHealthStatus] = useState<{ api: boolean; error?: string } | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('unicore-credentials');
        if (stored) {
            try {
                setIssuedCredentials(JSON.parse(stored));
            } catch (error) {
                console.error('Failed to load stored credentials:', error);
            }
        }

        checkHealth();
    }, []);

    useEffect(() => {
        localStorage.setItem('unicore-credentials', JSON.stringify(issuedCredentials));
    }, [issuedCredentials]);

    const checkHealth = async () => {
        try {
            const health = await unicoreService.healthCheck();
            setHealthStatus(health);
        } catch (error) {
            setHealthStatus({
                api: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    const handleInputChange = (field: keyof CredentialForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError(null);
        setSuccess(null);
    };

    const handleCredentialTypeChange = (type: string) => {
        setForm(prev => ({
            ...prev,
            type,
            employerId: '',
            position: '',
            validUntil: '',
        }));
    };

    const validateForm = (): boolean => {
        if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth || !form.nationality.trim()) {
            setError('Please fill in all required fields');
            return false;
        }

        if (form.type === 'WorkPermit') {
            if (!form.employerId?.trim() || !form.position?.trim() || !form.validUntil) {
                setError('Please fill in all work permit fields');
                return false;
            }
        }

        return true;
    };

    const issueCredential = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            let result;

            if (form.type === 'MigrationIdentity') {
                result = await unicoreService.createMigrationIdentity(
                    form.firstName,
                    form.lastName,
                    form.dateOfBirth,
                    form.nationality,
                    form.passportNumber
                );
            } else if (form.type === 'WorkPermit') {
                result = await unicoreService.createWorkPermit(
                    form.firstName,
                    form.lastName,
                    form.employerId!,
                    form.position!,
                    form.validUntil!
                );
            } else {
                result = await unicoreService.issueCredential({
                    type: form.type,
                    credentialSubject: {
                        first_name: form.firstName,
                        last_name: form.lastName,
                        dob: form.dateOfBirth,
                        nationality: form.nationality,
                        ...(form.passportNumber && { passport_number: form.passportNumber }),
                    },
                });
            }

            if (result.success) {
                const newCredential: IssuedCredential = {
                    id: result.credentialId!,
                    type: form.type,
                    offerUrl: result.offerUrl!,
                    timestamp: new Date().toISOString(),
                    status: 'issued',
                };

                setIssuedCredentials(prev => [newCredential, ...prev]);
                setSuccess(`${form.type} credential issued successfully! Scan the QR code with UniMe wallet.`);

                setForm({
                    type: 'MigrationIdentity',
                    firstName: '',
                    lastName: '',
                    dateOfBirth: '',
                    nationality: '',
                    passportNumber: '',
                });
            } else {
                setError(result.error || 'Failed to issue credential');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const testUniCoreFlow = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await unicoreService.testUniCoreFlow();

            if (result.success) {
                setSuccess('UniCore flow test completed successfully!');
            } else {
                setError(result.error || 'UniCore flow test failed');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Test failed');
        } finally {
            setIsLoading(false);
        }
    };

    const clearCredentials = () => {
        setIssuedCredentials([]);
        setSuccess('All credentials cleared');
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    UniCore Credentials Manager
                </h2>

                <div className="mb-4 p-3 rounded-md bg-gray-50">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">UniCore Service Status:</span>
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${healthStatus?.api ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={healthStatus?.api ? 'text-green-600' : 'text-red-600'}>
                                {healthStatus?.api ? 'Connected' : 'Disconnected'}
                            </span>
                            <button
                                onClick={checkHealth}
                                className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                    {healthStatus?.error && (
                        <p className="text-red-600 text-sm mt-1">{healthStatus.error}</p>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Credential Type
                    </label>
                    <select
                        value={form.type}
                        onChange={(e) => handleCredentialTypeChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="MigrationIdentity">Migration Identity</option>
                        <option value="WorkPermit">Work Permit</option>
                        <option value="HealthRecord">Health Record</option>
                        <option value="SkillCertification">Skill Certification</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name *
                        </label>
                        <input
                            type="text"
                            value={form.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter first name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name *
                        </label>
                        <input
                            type="text"
                            value={form.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter last name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Birth *
                        </label>
                        <input
                            type="date"
                            value={form.dateOfBirth}
                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nationality *
                        </label>
                        <input
                            type="text"
                            value={form.nationality}
                            onChange={(e) => handleInputChange('nationality', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter nationality"
                        />
                    </div>
                </div>

                {(form.type === 'MigrationIdentity' || form.type === 'WorkPermit') && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Passport Number
                        </label>
                        <input
                            type="text"
                            value={form.passportNumber || ''}
                            onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter passport number"
                        />
                    </div>
                )}

                {form.type === 'WorkPermit' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Employer ID *
                            </label>
                            <input
                                type="text"
                                value={form.employerId || ''}
                                onChange={(e) => handleInputChange('employerId', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter employer ID"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Position *
                            </label>
                            <input
                                type="text"
                                value={form.position || ''}
                                onChange={(e) => handleInputChange('position', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter position"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Valid Until *
                            </label>
                            <input
                                type="date"
                                value={form.validUntil || ''}
                                onChange={(e) => handleInputChange('validUntil', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-3 mb-4">
                    <button
                        onClick={issueCredential}
                        disabled={isLoading || !healthStatus?.api}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Issuing...' : `Issue ${form.type}`}
                    </button>

                    <button
                        onClick={testUniCoreFlow}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Test UniCore Flow
                    </button>

                    {issuedCredentials.length > 0 && (
                        <button
                            onClick={clearCredentials}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 mb-4">
                        {success}
                    </div>
                )}
            </div>

            {issuedCredentials.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        Issued Credentials ({issuedCredentials.length})
                    </h3>

                    <div className="space-y-4">
                        {issuedCredentials.map((credential) => (
                            <div key={credential.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-gray-800">{credential.type}</h4>
                                            <span className={`px-2 py-1 text-xs rounded-full ${credential.status === 'issued' ? 'bg-green-100 text-green-800' :
                                                credential.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {credential.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            ID: {credential.id}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Issued: {new Date(credential.timestamp).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <div className="text-center">
                                            <div className="mb-2">
                                                <QRCodeGenerator
                                                    data={credential.offerUrl}
                                                    size={150}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-600">Scan with UniMe wallet</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};