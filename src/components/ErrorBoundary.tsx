import React from 'react';
import { Box, Card, Heading, Text, Button } from '@radix-ui/themes';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('🚨 React Error Boundary caught an error:', error);
        console.error('🚨 Error Info:', errorInfo);

        console.error('🚨 Component Stack:', errorInfo.componentStack);

        this.setState({
            hasError: true,
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Card style={{ border: '2px solid var(--red-6)' }}>
                    <Box p="6">
                        <Heading size="4" color="red" mb="3">
                            🚨 Something went wrong
                        </Heading>

                        <Text size="2" color="red" mb="3">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </Text>

                        <Box
                            p="3"
                            style={{
                                background: 'var(--red-2)',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                marginBottom: '16px'
                            }}
                        >
                            <Text size="1">
                                {this.state.error?.stack}
                            </Text>
                        </Box>

                        <Button
                            onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                            color="red"
                            variant="soft"
                        >
                            Try Again
                        </Button>
                    </Box>
                </Card>
            );
        }

        return this.props.children;
    }
}