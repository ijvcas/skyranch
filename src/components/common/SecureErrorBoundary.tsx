import React from 'react';
import { ErrorHandler } from '@/utils/errorHandling';

interface SecureErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface SecureErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  component: string;
}

export class SecureErrorBoundary extends React.Component<
  SecureErrorBoundaryProps,
  SecureErrorBoundaryState
> {
  constructor(props: SecureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SecureErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error using centralized error handler
    ErrorHandler.handle(error, {
      component: this.props.component,
      operation: 'render',
      metadata: {
        errorInfo,
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center p-6 border border-destructive/20 rounded-lg bg-destructive/5">
    <h3 className="text-lg font-semibold mb-2">Error de Carga</h3>
    <p className="text-sm text-muted-foreground mb-4 text-center">
      No se pudieron cargar los datos. Verifica tu conexión e intenta de nuevo.
    </p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
    >
      Reintentar
    </button>
    {process.env.NODE_ENV === 'development' && error && (
      <details className="mt-4 text-xs text-muted-foreground">
        <summary>Error técnico (solo en desarrollo)</summary>
        <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
      </details>
    )}
  </div>
);

export default SecureErrorBoundary;