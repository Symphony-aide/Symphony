import React, { useMemo, useCallback } from 'react';
import {
  HStack,
  Button,
  IconButton,
  Text,
  Select,
  Box,
  Flex,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { throttle } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Pagination variant types
 */
export type PaginationVariant = 'default' | 'simple' | 'compact';

/**
 * Performance optimization options for pagination
 */
export interface PaginationPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle page change events (ms) */
  throttlePageChange?: number;
  /** Persist current page */
  persistPage?: boolean;
  /** Enable animations */
  enableAnimations?: boolean;
}

/**
 * Pagination props
 */
export interface PaginationProps {
  /** Current page (1-based) */
  currentPage?: number;
  /** Total number of pages */
  totalPages: number;
  /** Items per page */
  pageSize?: number;
  /** Total number of items */
  totalItems?: number;
  /** Pagination variant */
  variant?: PaginationVariant;
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Show total items count */
  showTotal?: boolean;
  /** Maximum visible page buttons */
  maxVisiblePages?: number;
  /** Custom page change handler */
  onPageChange?: (page: number) => void;
  /** Custom page size change handler */
  onPageSizeChange?: (pageSize: number) => void;
  /** Performance optimization settings */
  performance?: PaginationPerformanceOptions;
  /** Storage key for page persistence */
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
 * Optimized page change handler factory
 */
const useOptimizedPageChangeHandler = (
  originalOnPageChange?: (page: number) => void,
  throttleMs?: number,
  analytics?: PaginationProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnPageChange) return undefined;

    let optimizedHandler = (page: number) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'pagination_page_change', {
          event_category: analytics.category || 'pagination',
          event_label: analytics.label,
          value: page,
        });
      }
      
      originalOnPageChange(page);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalOnPageChange, throttleMs, analytics]);
};

/**
 * Generate page numbers for pagination
 */
const generatePageNumbers = (currentPage: number, totalPages: number, maxVisible: number) => {
  const pages: (number | 'ellipsis')[] = [];
  
  if (totalPages <= maxVisible) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Calculate start and end pages
    const halfVisible = Math.floor(maxVisible / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we're near the beginning or end
    if (currentPage <= halfVisible) {
      endPage = maxVisible;
    } else if (currentPage >= totalPages - halfVisible) {
      startPage = totalPages - maxVisible + 1;
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis');
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }
  }
  
  return pages;
};

/**
 * Optimized Pagination Component
 */
const PaginationComponent = React.forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      currentPage: controlledCurrentPage = 1,
      totalPages,
      pageSize = 10,
      totalItems,
      variant = 'default',
      showPageSizeSelector = false,
      pageSizeOptions = [10, 20, 50, 100],
      showTotal = false,
      maxVisiblePages = 7,
      onPageChange,
      onPageSizeChange,
      performance = { memoize: true, throttlePageChange: 100, persistPage: false },
      storageKey,
      testId,
      analytics,
    },
    ref
  ) => {
    // Page persistence
    const [persistedPage, setPersistedPage] = useLocalStorage<number>(
      storageKey || 'pagination-page',
      1
    );

    // Determine current page
    const currentPage = performance.persistPage && storageKey ? persistedPage : controlledCurrentPage;

    // Optimized page change handler
    const optimizedPageChangeHandler = useOptimizedPageChangeHandler(
      onPageChange,
      performance.throttlePageChange,
      analytics
    );

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) return;
      
      if (performance.persistPage && storageKey) {
        setPersistedPage(page);
      }
      
      optimizedPageChangeHandler?.(page);
    }, [currentPage, totalPages, optimizedPageChangeHandler, performance.persistPage, storageKey, setPersistedPage]);

    // Handle page size change
    const handlePageSizeChange = useCallback((newPageSize: number) => {
      onPageSizeChange?.(newPageSize);
    }, [onPageSizeChange]);

    // Generate page numbers
    const pageNumbers = useMemo(() => {
      return generatePageNumbers(currentPage, totalPages, maxVisiblePages);
    }, [currentPage, totalPages, maxVisiblePages]);

    // Memoized pagination buttons
    const paginationButtons = useMemo(() => {
      if (variant === 'simple') {
        return (
          <HStack spacing={2}>
            <IconButton
              aria-label="Previous page"
              icon={<ChevronLeft size={16} />}
              size="sm"
              variant="outline"
              isDisabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              data-testid={`${testId}-prev`}
            />
            <Text fontSize="sm" minW="100px" textAlign="center">
              Page {currentPage} of {totalPages}
            </Text>
            <IconButton
              aria-label="Next page"
              icon={<ChevronRight size={16} />}
              size="sm"
              variant="outline"
              isDisabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              data-testid={`${testId}-next`}
            />
          </HStack>
        );
      }

      if (variant === 'compact') {
        return (
          <HStack spacing={1}>
            <IconButton
              aria-label="Previous page"
              icon={<ChevronLeft size={16} />}
              size="sm"
              variant="ghost"
              isDisabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              data-testid={`${testId}-prev`}
            />
            {pageNumbers.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <Box key={`ellipsis-${index}`} px={2}>
                    <MoreHorizontal size={16} />
                  </Box>
                );
              }
              
              return (
                <Button
                  key={page}
                  size="sm"
                  variant={page === currentPage ? 'solid' : 'ghost'}
                  colorScheme={page === currentPage ? 'blue' : 'gray'}
                  onClick={() => handlePageChange(page)}
                  data-testid={`${testId}-page-${page}`}
                  minW="32px"
                >
                  {page}
                </Button>
              );
            })}
            <IconButton
              aria-label="Next page"
              icon={<ChevronRight size={16} />}
              size="sm"
              variant="ghost"
              isDisabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              data-testid={`${testId}-next`}
            />
          </HStack>
        );
      }

      // Default variant
      return (
        <HStack spacing={1}>
          <IconButton
            aria-label="Previous page"
            icon={<ChevronLeft size={16} />}
            size="sm"
            variant="outline"
            isDisabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            data-testid={`${testId}-prev`}
          />
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <Box key={`ellipsis-${index}`} px={2}>
                  <MoreHorizontal size={16} />
                </Box>
              );
            }
            
            return (
              <Button
                key={page}
                size="sm"
                variant={page === currentPage ? 'solid' : 'outline'}
                colorScheme={page === currentPage ? 'blue' : 'gray'}
                onClick={() => handlePageChange(page)}
                data-testid={`${testId}-page-${page}`}
                minW="40px"
              >
                {page}
              </Button>
            );
          })}
          <IconButton
            aria-label="Next page"
            icon={<ChevronRight size={16} />}
            size="sm"
            variant="outline"
            isDisabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            data-testid={`${testId}-next`}
          />
        </HStack>
      );
    }, [variant, currentPage, totalPages, pageNumbers, handlePageChange, testId]);

    // Memoized page size selector
    const pageSizeSelector = useMemo(() => {
      if (!showPageSizeSelector) return null;

      return (
        <HStack spacing={2}>
          <Text fontSize="sm">Show:</Text>
          <Select
            size="sm"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            data-testid={`${testId}-page-size`}
            minW="80px"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Text fontSize="sm">per page</Text>
        </HStack>
      );
    }, [showPageSizeSelector, pageSize, pageSizeOptions, handlePageSizeChange, testId]);

    // Memoized total items display
    const totalDisplay = useMemo(() => {
      if (!showTotal || !totalItems) return null;

      const startItem = (currentPage - 1) * pageSize + 1;
      const endItem = Math.min(currentPage * pageSize, totalItems);

      return (
        <Text fontSize="sm" color="gray.600">
          Showing {startItem}-{endItem} of {totalItems} items
        </Text>
      );
    }, [showTotal, totalItems, currentPage, pageSize]);

    return (
      <Flex
        ref={ref}
        data-testid={testId}
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={4}
      >
        {totalDisplay}
        {paginationButtons}
        {pageSizeSelector}
      </Flex>
    );
  }
);

PaginationComponent.displayName = 'OptimizedPagination';

/**
 * Memoized OptimizedPagination export
 */
export const OptimizedPagination = React.memo(PaginationComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof PaginationProps)[] = [
    'currentPage', 'totalPages', 'pageSize', 'variant', 'totalItems'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedPagination;