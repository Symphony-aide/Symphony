/**
 * @fileoverview ErrorBoundary - Error handling component for primitive rendering
 * @module @symphony/primitives/renderers/ErrorBoundary
 * 
 * Catches rendering errors in the primitive tree and displays fallback UI
 * with retry functionality.
 */

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Button,
  Code,
} from 'ui';

/**
 * Props for the ErrorBoundary component.
 * @typedef {Object} ErrorBoundaryProps
 * @property {React.ReactNode} children - Child components to render
 * @property {React.ComponentType<{ error: Error, errorInfo: React.ErrorInfo | null, retry: function(): void }>} [fallback] - Custom fallback component
 * @property {function(Error, React.ErrorInfo): void} [onError] - Error callback
 * @property {string} [componentName] - Name of the component for error reporting
 */

/**
 * State for the ErrorBoundary component.
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean} hasError - Whether an error has occurred
 * @property {Error | null} error - The error that occurred
 * @property {React.ErrorInfo | null} errorInfo - React error info
 */

/**
 * Default fallback component displayed when an error occurs.
 * Uses UI components from @symphony/ui for consistent styling.
 * 
 * @param {Object} props - Component props
 * @param {Error} props.error - The error that occurred
 * @param {React.ErrorInfo | null} props.errorInfo - React error info
 * @param {function(): void} props.retry - Function to retry rendering
 * @returns {React.ReactElement} The fallback UI
 */
function DefaultFallback({ error, errorInfo, retry }) {
  return (
    <Card className="border-destructive bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive">Something went wrong</CardTitle>
        <CardDescription>
          {error.message || 'An unexpected error occurred'}
        </CardDescription>
      </CardHeader>
      {errorInfo && (
        <CardContent>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                Error details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Code variant="block" className="mt-2 max-h-[200px] overflow-auto">
                {error.stack}
                {'\n\nComponent Stack:'}
                {errorInfo.componentStack}
              </Code>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
      <CardFooter>
        <Button variant="destructive" onClick={retry}>
          Try again
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * ErrorBoundary component - Catches rendering errors and displays fallback UI.
 * 
 * Provides error isolation for primitive rendering, preventing errors in one
 * component from crashing the entire application. Includes retry functionality
 * to attempt re-rendering after an error.
 * 
 * @extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>
 * 
 * @example
 * <ErrorBoundary
 *   fallback={CustomErrorFallback}
 *   onError={(error, info) => logError(error, info)}
 *   componentName="MyComponent"
 * >
 *   <PrimitiveRenderer primitive={myPrimitive} />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  /**
   * Creates an ErrorBoundary instance.
   * 
   * @param {ErrorBoundaryProps} props - Component props
   */
  constructor(props) {
    super(props);
    /** @type {ErrorBoundaryState} */
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Updates state when an error is caught during rendering.
   * 
   * @param {Error} error - The error that was thrown
   * @returns {ErrorBoundaryState} Updated state
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  /**
   * Called after an error has been caught.
   * Logs the error and calls the onError callback if provided.
   * 
   * @param {Error} error - The error that was thrown
   * @param {React.ErrorInfo} errorInfo - React error info with component stack
   */
  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Resets the error state to retry rendering.
   */
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Renders the component or fallback UI.
   * 
   * @returns {React.ReactNode} The rendered content
   */
  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component that wraps a component with an ErrorBoundary.
 * 
 * @param {React.ComponentType<any>} WrappedComponent - Component to wrap
 * @param {Omit<ErrorBoundaryProps, 'children'>} [errorBoundaryProps] - Props for ErrorBoundary
 * @returns {React.ComponentType<any>} Wrapped component
 * 
 * @example
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   onError: (error) => console.error(error),
 * });
 */
export function withErrorBoundary(WrappedComponent, errorBoundaryProps = {}) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  /** @param {Record<string, unknown>} props */
  function WithErrorBoundary(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps} componentName={displayName}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  }
  
  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
}

export default ErrorBoundary;
