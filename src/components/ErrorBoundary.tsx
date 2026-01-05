import React, { Component, ReactNode } from "react";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 *
 * Prevents the entire app from crashing to a white screen.
 * Shows a friendly error message with recovery options.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console in development
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // TODO: In production, send to error tracking service
    // trackError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: "var(--color-surface-page)" }}
        >
          <div
            className="max-w-md w-full text-center p-8 rounded-2xl"
            style={{
              background: "var(--color-surface-default)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {/* Error Icon */}
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: "var(--color-feedback-bg)" }}
            >
              <AlertTriangle
                className="w-8 h-8"
                style={{ color: "var(--color-feedback-warning)" }}
              />
            </div>

            {/* Error Message */}
            <h1
              className="text-xl font-bold mb-2"
              style={{ color: "var(--color-content-primary)" }}
            >
              مشکلی پیش آمد
            </h1>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--color-content-secondary)" }}
            >
              متأسفانه خطایی رخ داده است. لطفاً دوباره تلاش کنید.
            </p>

            {/* Error Details (development only) */}
            {import.meta.env.DEV && this.state.error && (
              <div
                className="text-left text-xs p-3 rounded-lg mb-6 overflow-auto max-h-32"
                style={{
                  background: "var(--color-surface-muted)",
                  color: "var(--color-content-secondary)",
                }}
                dir="ltr"
              >
                <strong>Error:</strong> {this.state.error.message}
                {this.state.errorInfo && (
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRefresh}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  background: "var(--color-interactive-primary)",
                  color: "var(--color-content-inverse)",
                }}
              >
                <RefreshCw className="w-4 h-4" />
                تلاش مجدد
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  background: "var(--color-surface-muted)",
                  color: "var(--color-content-primary)",
                }}
              >
                <Home className="w-4 h-4" />
                صفحه اصلی
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * withErrorBoundary - HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
