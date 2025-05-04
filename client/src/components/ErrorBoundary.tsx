import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render error UI
      return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
              <p className="font-medium">{this.state.error?.toString()}</p>
            </div>
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2">Component Stack:</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
            <div className="mt-6 flex gap-4">
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;