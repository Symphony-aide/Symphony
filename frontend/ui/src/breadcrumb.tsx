import {
  Breadcrumb as ChakraBreadcrumb,
  BreadcrumbItem as ChakraBreadcrumbItem,
  BreadcrumbLink as ChakraBreadcrumbLink,
  BreadcrumbSeparator as ChakraBreadcrumbSeparator,
  BreadcrumbProps as ChakraBreadcrumbProps,
  BreadcrumbItemProps as ChakraBreadcrumbItemProps,
  BreadcrumbLinkProps as ChakraBreadcrumbLinkProps,
} from '@chakra-ui/react';
import { throttle } from 'lodash-es';
import { ChevronRight } from 'lucide-react';
import React, { useMemo, useCallback } from 'react';

/**
 * Breadcrumb sizes
 */
export type BreadcrumbSize = 'sm' | 'md' | 'lg';

/**
 * Breadcrumb item data
 */
export interface BreadcrumbItemData {
  /** Item label */
  label: React.ReactNode;
  /** Item href */
  href?: string;
  /** Whether item is current page */
  isCurrentPage?: boolean;
  /** Custom click handler */
  onClick?: (event: React.MouseEvent) => void;
  /** Whether item is disabled */
  isDisabled?: boolean;
}

/**
 * Performance optimization options for breadcrumb
 */
export interface BreadcrumbPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle click events (ms) */
  throttleClick?: number;
  /** Enable animations */
  enableAnimations?: boolean;
}

/**
 * Extended Breadcrumb props with optimization features
 */
export interface BreadcrumbProps extends Omit<ChakraBreadcrumbProps, 'separator'> {
  /** Breadcrumb size */
  size?: BreadcrumbSize;
  /** Breadcrumb items */
  items?: BreadcrumbItemData[];
  /** Custom separator */
  separator?: React.ReactElement;
  /** Performance optimization settings */
  performance?: BreadcrumbPerformanceOptions;
  /** Custom test ID */
  testId?: string;
  /** Analytics tracking */
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
}

/**
 * Extended BreadcrumbItem props
 */
export interface BreadcrumbItemProps extends ChakraBreadcrumbItemProps {
  /** Custom test ID */
  testId?: string;
}

/**
 * Extended BreadcrumbLink props
 */
export interface BreadcrumbLinkProps extends Omit<ChakraBreadcrumbLinkProps, 'onClick'> {
  /** Custom click handler */
  onClick?: (event: React.MouseEvent) => void;
  /** Performance optimization settings */
  performance?: BreadcrumbPerformanceOptions;
  /** Custom test ID */
  testId?: string;
  /** Analytics tracking */
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
}

/**
 * Optimized click handler factory
 * @param originalOnClick
 * @param throttleMs
 * @param analytics
 */
const useOptimizedClickHandler = (
  originalOnClick?: (event: React.MouseEvent) => void,
  throttleMs?: number,
  analytics?: BreadcrumbProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnClick) return undefined;

    let optimizedHandler = originalOnClick;

    // Add analytics tracking
    if (analytics) {
      const trackingHandler = (event: React.MouseEvent) => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', analytics.action || 'breadcrumb_click', {
            event_category: analytics.category || 'breadcrumb',
            event_label: analytics.label,
          });
        }
        originalOnClick(event);
      };
      optimizedHandler = trackingHandler;
    }

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalOnClick, throttleMs, analytics]);
};

/**
 * Get breadcrumb size styles
 * @param size
 */
const getBreadcrumbSize = (size: BreadcrumbSize) => {
  const sizeStyles = {
    sm: { fontSize: 'sm' },
    md: { fontSize: 'md' },
    lg: { fontSize: 'lg' },
  };
  
  return sizeStyles[size];
};

/**
 * Optimized Breadcrumb Component
 */
const BreadcrumbComponent = React.forwardRef<HTMLNavElement, BreadcrumbProps>(
  (
    {
      size = 'md',
      items = [],
      separator = <ChevronRight size={16} />,
      performance = { memoize: true, throttleClick: 300, enableAnimations: true },
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // Memoized breadcrumb styles
    const breadcrumbStyles = useMemo(() => {
      const sizeStyles = getBreadcrumbSize(size);
      const animationStyles = performance.enableAnimations ? {
        '& a': {
          transition: 'color 0.2s ease-in-out',
          _hover: { textDecoration: 'underline' },
        },
      } : {};

      return {
        ...sizeStyles,
        ...animationStyles,
      };
    }, [size, performance.enableAnimations]);

    // Memoized breadcrumb props
    const breadcrumbProps = useMemo(() => ({
      separator,
      'data-testid': testId,
      ...breadcrumbStyles,
      ...rest,
    }), [separator, testId, breadcrumbStyles, rest]);

    // Render items or children
    const content = items.length > 0 ? (
      items.map((item, index) => (
        <BreadcrumbItemComponent
          key={index}
          isCurrentPage={item.isCurrentPage}
          testId={`${testId}-item-${index}`}
        >
          <BreadcrumbLinkComponent
            href={item.href}
            onClick={item.onClick}
            isDisabled={item.isDisabled}
            performance={performance}
            analytics={analytics}
            testId={`${testId}-link-${index}`}
          >
            {item.label}
          </BreadcrumbLinkComponent>
        </BreadcrumbItemComponent>
      ))
    ) : (
      children
    );

    return (
      <ChakraBreadcrumb ref={ref} {...breadcrumbProps}>
        {content}
      </ChakraBreadcrumb>
    );
  }
);

BreadcrumbComponent.displayName = 'OptimizedBreadcrumb';

/**
 * Optimized BreadcrumbItem Component
 */
const BreadcrumbItemComponent = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ testId, children, ...rest }, ref) => {
    const itemProps = useMemo(() => ({
      'data-testid': testId,
      ...rest,
    }), [testId, rest]);

    return (
      <ChakraBreadcrumbItem ref={ref} {...itemProps}>
        {children}
      </ChakraBreadcrumbItem>
    );
  }
);

BreadcrumbItemComponent.displayName = 'OptimizedBreadcrumbItem';

/**
 * Optimized BreadcrumbLink Component
 */
const BreadcrumbLinkComponent = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  (
    {
      onClick,
      performance = { throttleClick: 300 },
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // Optimized click handler
    const optimizedClickHandler = useOptimizedClickHandler(onClick, performance.throttleClick, analytics);

    const linkProps = useMemo(() => ({
      onClick: optimizedClickHandler,
      'data-testid': testId,
      ...rest,
    }), [optimizedClickHandler, testId, rest]);

    return (
      <ChakraBreadcrumbLink ref={ref} {...linkProps}>
        {children}
      </ChakraBreadcrumbLink>
    );
  }
);

BreadcrumbLinkComponent.displayName = 'OptimizedBreadcrumbLink';

// Memoized exports
export const OptimizedBreadcrumb = React.memo(BreadcrumbComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof BreadcrumbProps)[] = [
    'size', 'items', 'separator', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

export const OptimizedBreadcrumbItem = React.memo(BreadcrumbItemComponent);
export const OptimizedBreadcrumbLink = React.memo(BreadcrumbLinkComponent);

// Re-export Chakra components
export const BreadcrumbSeparator = ChakraBreadcrumbSeparator;

// Default exports
export default OptimizedBreadcrumb;
export { OptimizedBreadcrumbItem as BreadcrumbItem };
export { OptimizedBreadcrumbLink as BreadcrumbLink };