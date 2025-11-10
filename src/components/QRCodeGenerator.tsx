import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
    data: string;
    size?: number;
    className?: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
    data,
    size = 300,
    className = '',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateQR = async () => {
            if (!canvasRef.current || !data) return;

            try {
                await QRCode.toCanvas(canvasRef.current, data, {
                    width: size,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF',
                    },
                });
                setError(null);
            } catch (err) {
                console.error('Failed to generate QR code:', err);
                setError('Failed to generate QR code');
            }
        };

        generateQR();
    }, [data, size]);

    if (error) {
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                }}
            >
                <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
            }}
        />
    );
};

export const generateQRDataURL = async (
    data: string,
    size: number = 300,
): Promise<string> => {
    try {
        return await QRCode.toDataURL(data, {
            width: size,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
    } catch (error) {
        console.error('Failed to generate QR data URL:', error);
        throw error;
    }
};