import React, { useMemo, useCallback, useState } from 'react';
import {
  Table as ChakraTable,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableContainer,
  TableProps as ChakraTableProps,
  Box,
  Text,
  IconButton,
  HStack,
  Checkbox,
} from '@chakra-ui/react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { throttle } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Table variants
 */
export type TableVariant = 'simple' | 'striped' | 'outline' | 'unstyled';

/**
 * Table sizes
 */
export type TableSize = 'sm' | 'md' | 'lg';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Column definition
 */
export interface TableColumn<T = any> {
  /** Column key */
  key: string;
  /** Column header */
  header: React.ReactNode;
  /** Cell renderer */
  cell?: (value: any, row: T, index: number) => React.ReactNode;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Column width */
  width?: string | number;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether column is sticky */
  sticky?: boolean;
}

/**
 * Performance optimization options for table
 */
export interface TablePerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle sort events (ms) */
  throttleSort?: number;
  /** Enable virtual scrolling */
  virtualScrolling?: boolean;
  /** Virtual scroll buffer size */
  scrollBuffer?: number;
  /** Persist sort state */
  persistSort?: boolean;
  /** Persist selection state */
  persistSelection?: boolean;
}

/**
 * Table props
 */
export interface TableProps<T = any> extends Omit<ChakraTableProps, 'variant' | 'size'> {
  /** Table variant */
  variant?: TableVariant;
  /** Table size */
  size?: TableSize;
  /** Table columns */
  columns: TableColumn<T>[];
  /** Table data */
  data: T[];
  /** Whether table is loading */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedRows?: string[];
  /** Row key extractor */
  rowKey?: (row: T, index: number) => string;
  /** Custom row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Custom row selection handler */
  onRowSelect?: (selectedKeys: string[]) => void;
  /** Custom sort handler */
  onSort?: (key: string, direction: SortDirection) => void;
  /** Performance optimization settings */
  performance?: TablePerformanceOptions;
  /** Storage key for state persistence */
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
 * Optimized sort handler factory
 */
const useOptimizedSortHandler = (
  originalOnSort?: (key: string, direction: SortDirection) => void,
  throttleMs?: number,
  analytics?: TableProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnSort) return undefined;

    let optimizedHandler = (key: string, direction: SortDirection) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'table_sort', {
          event_category: analytics.category || 'table',
          event_label: `${analytics.label || 'sort'}_${key}_${direction}`,
        });
      }
      
      originalOnSort(key, direction);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalOnSort, throttleMs, analytics]);
};

/**
 * Table sorting hook
 */
const useTableSort = (
  onSort?: (key: string, direction: SortDirection) => void,
  persistSort: boolean = false,
  storageKey?: string
) => {
  // Sort state persistence
  const [persistedSort, setPersistedSort] = useLocalStorage<{ key: string; direction: SortDirection }>(
    `${storageKey || 'table'}-sort`,
    { key: '', direction: null }
  );

  const [sortState, setSortState] = useState<{ key: string; direction: SortDirection }>(
    persistSort && storageKey ? persistedSort : { key: '', direction: null }
  );

  const handleSort = useCallback((key: string) => {
    const newDirection: SortDirection = 
      sortState.key === key 
        ? sortState.direction === 'asc' 
          ? 'desc' 
          : sortState.direction === 'desc' 
            ? null 
            : 'asc'
        : 'asc';

    const newSortState = { key, direction: newDirection };
    setSortState(newSortState);
    
    if (persistSort && storageKey) {
      setPersistedSort(newSortState);
    }
    
    onSort?.(key, newDirection);
  }, [sortState, onSort, persistSort, storageKey, setPersistedSort]);

  return { sortState, handleSort };
};

/**
 * Table selection hook
 */
const useTableSelection = (
  data: any[],
  rowKey: (row: any, index: number) => string,
  onRowSelect?: (selectedKeys: string[]) => void,
  persistSelection: boolean = false,
  storageKey?: string
) => {
  // Selection state persistence
  const [persistedSelection, setPersistedSelection] = useLocalStorage<string[]>(
    `${storageKey || 'table'}-selection`,
    []
  );

  const [selectedRows, setSelectedRows] = useState<string[]>(
    persistSelection && storageKey ? persistedSelection : []
  );

  const handleRowSelect = useCallback((rowId: string, selected: boolean) => {
    const newSelection = selected 
      ? [...selectedRows, rowId]
      : selectedRows.filter(id => id !== rowId);
    
    setSelectedRows(newSelection);
    
    if (persistSelection && storageKey) {
      setPersistedSelection(newSelection);
    }
    
    onRowSelect?.(newSelection);
  }, [selectedRows, onRowSelect, persistSelection, storageKey, setPersistedSelection]);

  const handleSelectAll = useCallback((selected: boolean) => {
    const newSelection = selected ? data.map(rowKey) : [];
    setSelectedRows(newSelection);
    
    if (persistSelection && storageKey) {
      setPersistedSelection(newSelection);
    }
    
    onRowSelect?.(newSelection);
  }, [data, rowKey, onRowSelect, persistSelection, storageKey, setPersistedSelection]);

  const isRowSelected = useCallback((rowId: string) => {
    return selectedRows.includes(rowId);
  }, [selectedRows]);

  const isAllSelected = useMemo(() => {
    return data.length > 0 && selectedRows.length === data.length;
  }, [data.length, selectedRows.length]);

  const isIndeterminate = useMemo(() => {
    return selectedRows.length > 0 && selectedRows.length < data.length;
  }, [selectedRows.length, data.length]);

  return {
    selectedRows,
    handleRowSelect,
    handleSelectAll,
    isRowSelected,
    isAllSelected,
    isIndeterminate,
  };
};

/**
 * Default row key extractor
 */
const defaultRowKey = (row: any, index: number) => {
  return row.id?.toString() || index.toString();
};

/**
 * Optimized Table Component
 */
const TableComponent = <T extends Record<string, any>>({
  variant = 'simple',
  size = 'md',
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  selectable = false,
  selectedRows: controlledSelectedRows,
  rowKey = defaultRowKey,
  onRowClick,
  onRowSelect,
  onSort,
  performance = { memoize: true, throttleSort: 100 },
  storageKey,
  testId,
  analytics,
  ...rest
}: TableProps<T>) => {
  // Table sorting
  const { sortState, handleSort } = useTableSort(
    onSort,
    performance.persistSort,
    storageKey
  );

  // Table selection
  const {
    selectedRows,
    handleRowSelect,
    handleSelectAll,
    isRowSelected,
    isAllSelected,
    isIndeterminate,
  } = useTableSelection(
    data,
    rowKey,
    onRowSelect,
    performance.persistSelection,
    storageKey
  );

  // Optimized sort handler
  const optimizedSortHandler = useOptimizedSortHandler(
    (key: string, direction: SortDirection) => handleSort(key),
    performance.throttleSort,
    analytics
  );

  // Handle row click
  const handleRowClick = useCallback((row: T, index: number) => {
    if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analytics.action || 'table_row_click', {
        event_category: analytics.category || 'table',
        event_label: analytics.label,
      });
    }
    
    onRowClick?.(row, index);
  }, [onRowClick, analytics]);

  // Memoized table header
  const tableHeader = useMemo(() => (
    <Thead>
      <Tr>
        {selectable && (
          <Th width="50px">
            <Checkbox
              isChecked={isAllSelected}
              isIndeterminate={isIndeterminate}
              onChange={(e) => handleSelectAll(e.target.checked)}
              data-testid={`${testId}-select-all`}
            />
          </Th>
        )}
        {columns.map((column) => (
          <Th
            key={column.key}
            width={column.width}
            textAlign={column.align}
            position={column.sticky ? 'sticky' : 'static'}
            left={column.sticky ? 0 : 'auto'}
            bg={column.sticky ? 'white' : 'transparent'}
            zIndex={column.sticky ? 1 : 'auto'}
            data-testid={`${testId}-header-${column.key}`}
          >
            {column.sortable ? (
              <HStack
                spacing={2}
                cursor="pointer"
                onClick={() => optimizedSortHandler?.(column.key, sortState.direction)}
                _hover={{ color: 'blue.500' }}
              >
                <Text>{column.header}</Text>
                <Box>
                  {sortState.key === column.key ? (
                    sortState.direction === 'asc' ? (
                      <ChevronUp size={16} />
                    ) : sortState.direction === 'desc' ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ArrowUpDown size={16} />
                    )
                  ) : (
                    <ArrowUpDown size={16} opacity={0.3} />
                  )}
                </Box>
              </HStack>
            ) : (
              column.header
            )}
          </Th>
        ))}
      </Tr>
    </Thead>
  ), [
    selectable,
    columns,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    testId,
    sortState,
    optimizedSortHandler
  ]);

  // Memoized table body
  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <Tbody>
          <Tr>
            <Td colSpan={columns.length + (selectable ? 1 : 0)} textAlign="center" py={8}>
              <Text color="gray.500">Loading...</Text>
            </Td>
          </Tr>
        </Tbody>
      );
    }

    if (data.length === 0) {
      return (
        <Tbody>
          <Tr>
            <Td colSpan={columns.length + (selectable ? 1 : 0)} textAlign="center" py={8}>
              <Text color="gray.500">{emptyMessage}</Text>
            </Td>
          </Tr>
        </Tbody>
      );
    }

    return (
      <Tbody>
        {data.map((row, index) => {
          const rowId = rowKey(row, index);
          const isSelected = isRowSelected(rowId);
          
          return (
            <Tr
              key={rowId}
              cursor={onRowClick ? 'pointer' : 'default'}
              bg={isSelected ? 'blue.50' : 'transparent'}
              _hover={onRowClick ? { bg: 'gray.50' } : {}}
              onClick={() => handleRowClick(row, index)}
              data-testid={`${testId}-row-${index}`}
            >
              {selectable && (
                <Td>
                  <Checkbox
                    isChecked={isSelected}
                    onChange={(e) => handleRowSelect(rowId, e.target.checked)}
                    data-testid={`${testId}-select-${index}`}
                  />
                </Td>
              )}
              {columns.map((column) => (
                <Td
                  key={column.key}
                  textAlign={column.align}
                  position={column.sticky ? 'sticky' : 'static'}
                  left={column.sticky ? 0 : 'auto'}
                  bg={column.sticky ? (isSelected ? 'blue.50' : 'white') : 'transparent'}
                  zIndex={column.sticky ? 1 : 'auto'}
                  data-testid={`${testId}-cell-${index}-${column.key}`}
                >
                  {column.cell 
                    ? column.cell(row[column.key], row, index)
                    : row[column.key]
                  }
                </Td>
              ))}
            </Tr>
          );
        })}
      </Tbody>
    );
  }, [
    loading,
    data,
    columns,
    selectable,
    emptyMessage,
    rowKey,
    isRowSelected,
    handleRowClick,
    handleRowSelect,
    testId
  ]);

  // Memoized table props
  const tableProps = useMemo(() => ({
    variant,
    size,
    'data-testid': testId,
    ...rest,
  }), [variant, size, testId, rest]);

  return (
    <TableContainer>
      <ChakraTable {...tableProps}>
        {tableHeader}
        {tableBody}
      </ChakraTable>
    </TableContainer>
  );
};

/**
 * Memoized OptimizedTable export
 */
export const OptimizedTable = React.memo(TableComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof TableProps)[] = [
    'variant', 'size', 'columns', 'data', 'loading', 'selectable'
  ];
  
  return keysToCompare.every(key => {
    if (key === 'columns' || key === 'data') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
}) as typeof TableComponent;

// Default export
export default OptimizedTable;