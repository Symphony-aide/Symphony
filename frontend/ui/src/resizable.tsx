import { Box, BoxProps } from '@chakra-ui/react';
import { throttle } from 'lodash-es';
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useLocalStorage } from 'react-use';

/**
 * Resizable direction types
 */
export type ResizableDirection = 'horizontal' | 'vertical' | 'both';

/**
 * Resize handle position
 */
export type ResizeHandlePosition = 'top' | 'right' | 'bottom' | 'left' | 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';

/**
 * Performance optimization options for resizable
 */
export interface ResizablePerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle resize events (ms) */
  throttleResize?: number;
  /** Persist size */
  persistSize?: boolean;
  /** Enable smooth resizing */
  smoothResize?: boolean;
}

/**
 * Resizable constraints
 */
export interface ResizableConstraints {
  /** Minimum width */
  minWidth?: number;
  /** Maximum width */
  maxWidth?: number;
  /** Minimum height */
  minHeight?: number;
  /** Maximum height */
  maxHeight?: number;
}

/**
 * Resizable props
 */
export interface ResizableProps extends Omit<BoxProps, 'onResize'> {
  /** Resizable direction */
  direction?: ResizableDirection;
  /** Initial width */
  defaultWidth?: number;
  /** Initial height */
  defaultHeight?: number;
  /** Controlled width */
  width?: number;
  /** Controlled height */
  height?: number;
  /** Resize constraints */
  constraints?: ResizableConstraints;
  /** Resize handles to show */
  handles?: ResizeHandlePosition[];
  /** Custom resize handler */
  onResize?: (width: number, height: number) => void;
  /** Resize start handler */
  onResizeStart?: () => void;
  /** Resize end handler */
  onResizeEnd?: () => void;
  /** Performance optimization settings */
  performance?: ResizablePerformanceOptions;
  /** Storage key for size persistence */
  storageKey?: string;
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
 * Resize handle props
 */
export interface ResizeHandleProps {
  /** Handle position */
  position: ResizeHandlePosition;
  /** Handle cursor style */
  cursor: string;
  /** Mouse down handler */
  onMouseDown: (event: React.MouseEvent) => void;
  /** Test ID */
  testId?: string;
}

/**
 * Get cursor style for handle position
 * @param position
 */
const getCursorForHandle = (position: ResizeHandlePosition): string => {
  const cursors = {
    top: 'n-resize',
    right: 'e-resize',
    bottom: 's-resize',
    left: 'w-resize',
    'top-right': 'ne-resize',
    'bottom-right': 'se-resize',
    'bottom-left': 'sw-resize',
    'top-left': 'nw-resize',
  };
  
  return cursors[position];
};

/**
 * Get handle styles for position
 * @param position
 */
const getHandleStyles = (position: ResizeHandlePosition) => {
  const baseStyles = {
    position: 'absolute' as const,
    backgroundColor: 'transparent',
    zIndex: 10,
    _hover: {
      backgroundColor: 'blue.200',
      opacity: 0.7,
    },
  };

  const positionStyles = {
    top: {
      top: 0,
      left: '10px',
      right: '10px',
      height: '4px',
      cursor: 'n-resize',
    },
    right: {
      top: '10px',
      right: 0,
      bottom: '10px',
      width: '4px',
      cursor: 'e-resize',
    },
    bottom: {
      bottom: 0,
      left: '10px',
      right: '10px',
      height: '4px',
      cursor: 's-resize',
    },
    left: {
      top: '10px',
      left: 0,
      bottom: '10px',
      width: '4px',
      cursor: 'w-resize',
    },
    'top-right': {
      top: 0,
      right: 0,
      width: '10px',
      height: '10px',
      cursor: 'ne-resize',
    },
    'bottom-right': {
      bottom: 0,
      right: 0,
      width: '10px',
      height: '10px',
      cursor: 'se-resize',
    },
    'bottom-left': {
      bottom: 0,
      left: 0,
      width: '10px',
      height: '10px',
      cursor: 'sw-resize',
    },
    'top-left': {
      top: 0,
      left: 0,
      width: '10px',
      height: '10px',
      cursor: 'nw-resize',
    },
  };

  return {
    ...baseStyles,
    ...positionStyles[position],
  };
};

/**
 * Optimized resize handler factory
 * @param originalOnResize
 * @param throttleMs
 * @param analytics
 */
const useOptimizedResizeHandler = (
  originalOnResize?: (width: number, height: number) => void,
  throttleMs?: number,
  analytics?: ResizableProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnResize) return undefined;

    let optimizedHandler = (width: number, height: number) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'resizable_resize', {
          event_category: analytics.category || 'resizable',
          event_label: analytics.label,
          value: Math.round(width * height),
        });
      }
      
      originalOnResize(width, height);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: true 
      });
    }

    return optimizedHandler;
  }, [originalOnResize, throttleMs, analytics]);
};

/**
 * Resize hook
 * @param direction
 * @param constraints
 * @param onResize
 * @param onResizeStart
 * @param onResizeEnd
 */
const useResize = (
  direction: ResizableDirection,
  constraints: ResizableConstraints,
  onResize?: (width: number, height: number) => void,
  onResizeStart?: () => void,
  onResizeEnd?: () => void
) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandlePosition | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });

  const handleMouseDown = useCallback((position: ResizeHandlePosition, event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
    setResizeHandle(position);
    
    startPosRef.current = { x: event.clientX, y: event.clientY };
    
    const rect = (event.target as HTMLElement).closest('[data-resizable]')?.getBoundingClientRect();
    if (rect) {
      startSizeRef.current = { width: rect.width, height: rect.height };
    }
    
    onResizeStart?.();
  }, [onResizeStart]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isResizing || !resizeHandle) return;

    const deltaX = event.clientX - startPosRef.current.x;
    const deltaY = event.clientY - startPosRef.current.y;
    
    let newWidth = startSizeRef.current.width;
    let newHeight = startSizeRef.current.height;

    // Calculate new dimensions based on handle position
    switch (resizeHandle) {
      case 'right':
      case 'top-right':
      case 'bottom-right':
        newWidth = startSizeRef.current.width + deltaX;
        break;
      case 'left':
      case 'top-left':
      case 'bottom-left':
        newWidth = startSizeRef.current.width - deltaX;
        break;
    }

    switch (resizeHandle) {
      case 'bottom':
      case 'bottom-left':
      case 'bottom-right':
        newHeight = startSizeRef.current.height + deltaY;
        break;
      case 'top':
      case 'top-left':
      case 'top-right':
        newHeight = startSizeRef.current.height - deltaY;
        break;
    }

    // Apply constraints
    if (constraints.minWidth) newWidth = Math.max(newWidth, constraints.minWidth);
    if (constraints.maxWidth) newWidth = Math.min(newWidth, constraints.maxWidth);
    if (constraints.minHeight) newHeight = Math.max(newHeight, constraints.minHeight);
    if (constraints.maxHeight) newHeight = Math.min(newHeight, constraints.maxHeight);

    onResize?.(newWidth, newHeight);
  }, [isResizing, resizeHandle, constraints, onResize]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      onResizeEnd?.();
    }
  }, [isResizing, onResizeEnd]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = getCursorForHandle(resizeHandle!);
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, resizeHandle]);

  return { isResizing, handleMouseDown };
};

/**
 * Resize handle component
 */
const ResizeHandleComponent = React.memo<ResizeHandleProps>(({ 
  position, 
  onMouseDown, 
  testId 
}) => {
  const handleStyles = useMemo(() => getHandleStyles(position), [position]);

  return (
    <Box
      {...handleStyles}
      onMouseDown={onMouseDown}
      data-testid={testId}
    />
  );
});

ResizeHandleComponent.displayName = 'ResizeHandle';

/**
 * Optimized Resizable Component
 */
const ResizableComponent = React.forwardRef<HTMLDivElement, ResizableProps>(
  (
    {
      direction = 'both',
      defaultWidth = 300,
      defaultHeight = 200,
      width: controlledWidth,
      height: controlledHeight,
      constraints = {},
      handles,
      onResize,
      onResizeStart,
      onResizeEnd,
      performance = { memoize: true, throttleResize: 16, persistSize: false },
      storageKey,
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // Size persistence
    const [persistedSize, setPersistedSize] = useLocalStorage<{ width: number; height: number }>(
      storageKey || 'resizable-size',
      { width: defaultWidth, height: defaultHeight }
    );

    // Internal size state
    const [internalSize, setInternalSize] = useState({
      width: controlledWidth ?? (performance.persistSize && storageKey ? persistedSize.width : defaultWidth),
      height: controlledHeight ?? (performance.persistSize && storageKey ? persistedSize.height : defaultHeight),
    });

    // Determine current size
    const currentWidth = controlledWidth ?? internalSize.width;
    const currentHeight = controlledHeight ?? internalSize.height;

    // Optimized resize handler
    const optimizedResizeHandler = useOptimizedResizeHandler(
      onResize,
      performance.throttleResize,
      analytics
    );

    // Handle resize
    const handleResize = useCallback((width: number, height: number) => {
      if (controlledWidth === undefined || controlledHeight === undefined) {
        setInternalSize({ width, height });
      }
      
      if (performance.persistSize && storageKey) {
        setPersistedSize({ width, height });
      }
      
      optimizedResizeHandler?.(width, height);
    }, [
      controlledWidth,
      controlledHeight,
      optimizedResizeHandler,
      performance.persistSize,
      storageKey,
      setPersistedSize
    ]);

    // Resize functionality
    const { isResizing, handleMouseDown } = useResize(
      direction,
      constraints,
      handleResize,
      onResizeStart,
      onResizeEnd
    );

    // Default handles based on direction
    const defaultHandles = useMemo(() => {
      if (handles) return handles;
      
      switch (direction) {
        case 'horizontal':
          return ['left', 'right'] as ResizeHandlePosition[];
        case 'vertical':
          return ['top', 'bottom'] as ResizeHandlePosition[];
        case 'both':
          return ['top', 'right', 'bottom', 'left', 'top-right', 'bottom-right', 'bottom-left', 'top-left'] as ResizeHandlePosition[];
        default:
          return [];
      }
    }, [direction, handles]);

    // Memoized resize handles
    const resizeHandles = useMemo(() => {
      return defaultHandles.map((position) => (
        <ResizeHandleComponent
          key={position}
          position={position}
          cursor={getCursorForHandle(position)}
          onMouseDown={(event) => handleMouseDown(position, event)}
          testId={`${testId}-handle-${position}`}
        />
      ));
    }, [defaultHandles, handleMouseDown, testId]);

    // Memoized resizable props
    const resizableProps = useMemo(() => ({
      width: currentWidth,
      height: currentHeight,
      position: 'relative' as const,
      'data-resizable': true,
      'data-testid': testId,
      'data-resizing': isResizing,
      transition: performance.smoothResize && !isResizing ? 'all 0.1s ease' : 'none',
      ...rest,
    }), [currentWidth, currentHeight, testId, isResizing, performance.smoothResize, rest]);

    return (
      <Box ref={ref} {...resizableProps}>
        {children}
        {resizeHandles}
      </Box>
    );
  }
);

ResizableComponent.displayName = 'OptimizedResizable';

/**
 * Memoized OptimizedResizable export
 */
export const OptimizedResizable = React.memo(ResizableComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof ResizableProps)[] = [
    'direction', 'width', 'height', 'constraints', 'handles', 'children'
  ];
  
  return keysToCompare.every(key => {
    if (key === 'constraints' || key === 'handles') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

// Default export
export default OptimizedResizable;