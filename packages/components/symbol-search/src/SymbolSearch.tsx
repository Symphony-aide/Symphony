/// Symbol Search Component for Symphony IDE
///
/// Provides workspace-wide symbol search functionality with fuzzy matching
/// and visual display of symbol types and locations.

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Package,
  Box,
  Folder,
  Code2,
  Braces,
  Square,
  Circle,
  Wrench,
  Type,
  Database,
  Function,
  Variable,
  Lock,
  Hash,
  Binary,
  ToggleLeft,
  List,
  Boxes,
  Key,
  Minus,
  Users,
  SquareStack,
  Zap,
  Settings,
  TypeOutline,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'ui';
import { SymbolInformation, SymbolKind } from './types';

/// Props for the SymbolSearch component
export interface SymbolSearchProps {
  /// Whether the search dialog is open
  isOpen: boolean;
  /// Callback when open state changes
  onOpenChange: (open: boolean) => void;
  /// Callback to search for symbols
  onSearch: (query: string) => Promise<SymbolInformation[]>;
  /// Callback when a symbol is selected
  onSymbolSelect: (symbol: SymbolInformation) => void;
  /// Placeholder text for search input
  placeholder?: string;
  /// Message to show when no results found
  emptyMessage?: string;
}

/// Get icon component for a symbol kind
///
/// Maps LSP SymbolKind enum values to appropriate Lucide icons
/// for visual representation in the UI.
///
/// # Arguments
/// * `kind` - The SymbolKind enum value
///
/// # Returns
/// React component for the icon
function getSymbolIcon(kind: SymbolKind) {
  switch (kind) {
    case SymbolKind.File:
      return FileText;
    case SymbolKind.Module:
      return Package;
    case SymbolKind.Namespace:
      return Box;
    case SymbolKind.Package:
      return Folder;
    case SymbolKind.Class:
      return Code2;
    case SymbolKind.Method:
      return Braces;
    case SymbolKind.Property:
      return Square;
    case SymbolKind.Field:
      return Circle;
    case SymbolKind.Constructor:
      return Wrench;
    case SymbolKind.Enum:
      return Type;
    case SymbolKind.Interface:
      return Database;
    case SymbolKind.Function:
      return Function;
    case SymbolKind.Variable:
      return Variable;
    case SymbolKind.Constant:
      return Lock;
    case SymbolKind.String:
      return Hash;
    case SymbolKind.Number:
      return Binary;
    case SymbolKind.Boolean:
      return ToggleLeft;
    case SymbolKind.Array:
      return List;
    case SymbolKind.Object:
      return Boxes;
    case SymbolKind.Key:
      return Key;
    case SymbolKind.Null:
      return Minus;
    case SymbolKind.EnumMember:
      return Users;
    case SymbolKind.Struct:
      return SquareStack;
    case SymbolKind.Event:
      return Zap;
    case SymbolKind.Operator:
      return Settings;
    case SymbolKind.TypeParameter:
      return TypeOutline;
    default:
      return Circle;
  }
}

/// Get color class for a symbol kind
///
/// Provides consistent color coding for different symbol types
/// to improve visual scanning and recognition.
///
/// # Arguments
/// * `kind` - The SymbolKind enum value
///
/// # Returns
/// Tailwind CSS color class string
function getSymbolColor(kind: SymbolKind): string {
  switch (kind) {
    case SymbolKind.Class:
    case SymbolKind.Interface:
    case SymbolKind.Struct:
      return 'text-blue-400';
    case SymbolKind.Method:
    case SymbolKind.Function:
    case SymbolKind.Constructor:
      return 'text-purple-400';
    case SymbolKind.Property:
    case SymbolKind.Field:
    case SymbolKind.Variable:
      return 'text-cyan-400';
    case SymbolKind.Constant:
      return 'text-orange-400';
    case SymbolKind.Enum:
    case SymbolKind.EnumMember:
      return 'text-yellow-400';
    case SymbolKind.Module:
    case SymbolKind.Namespace:
    case SymbolKind.Package:
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
}

/// Extract file name from URI
///
/// Extracts the file name from a file:// URI for display purposes.
///
/// # Arguments
/// * `uri` - The file URI
///
/// # Returns
/// File name string
function getFileNameFromUri(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1] || uri;
}

/// Symbol Search Component
///
/// Provides a searchable dialog for finding symbols across the workspace.
/// Features fuzzy matching, symbol type icons, and file location display.
///
/// # Features
///
/// - Real-time search with debouncing
/// - Fuzzy matching support
/// - Symbol type icons and color coding
/// - File location display
/// - Keyboard navigation
/// - Container name display for context
///
/// # Examples
///
/// ```tsx
/// <SymbolSearch
///   isOpen={isSearchOpen}
///   onOpenChange={setIsSearchOpen}
///   onSearch={async (query) => {
///     return await lspClient.workspaceSymbol({ query });
///   }}
///   onSymbolSelect={(symbol) => {
///     navigateToLocation(symbol.location);
///   }}
/// />
/// ```
export function SymbolSearch({
  isOpen,
  onOpenChange,
  onSearch,
  onSymbolSelect,
  placeholder = 'Search symbols... (⌘⇧O)',
  emptyMessage = 'No symbols found.',
}: SymbolSearchProps) {
  const [search, setSearch] = useState('');
  const [symbols, setSymbols] = useState<SymbolInformation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /// Handle search query changes with debouncing
  useEffect(() => {
    if (!search) {
      setSymbols([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await onSearch(search);
        setSymbols(results);
      } catch (error) {
        console.error('Symbol search error:', error);
        setSymbols([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [search, onSearch]);

  /// Handle keyboard shortcut (Cmd/Ctrl + Shift + O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'o' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

  /// Handle symbol selection
  const handleSelect = useCallback(
    (symbol: SymbolInformation) => {
      onSymbolSelect(symbol);
      onOpenChange(false);
      setSearch('');
      setSymbols([]);
    },
    [onSymbolSelect, onOpenChange]
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border border-border-default shadow-md bg-bg-secondary">
        <CommandInput
          placeholder={placeholder}
          value={search}
          onValueChange={setSearch}
          className="border-none focus:ring-0 text-text-primary placeholder:text-text-tertiary"
        />
        <CommandList className="max-h-[500px]">
          {isLoading ? (
            <div className="py-6 text-center text-sm text-text-tertiary">
              Searching...
            </div>
          ) : (
            <>
              <CommandEmpty className="py-6 text-center text-sm text-text-tertiary">
                {emptyMessage}
              </CommandEmpty>

              {symbols.length > 0 && (
                <CommandGroup
                  heading="Symbols"
                  className="text-text-secondary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary"
                >
                  {symbols.map((symbol, index) => {
                    const Icon = getSymbolIcon(symbol.kind);
                    const colorClass = getSymbolColor(symbol.kind);
                    const fileName = getFileNameFromUri(symbol.location.uri);

                    return (
                      <CommandItem
                        key={`${symbol.location.uri}-${symbol.name}-${index}`}
                        value={symbol.name}
                        onSelect={() => handleSelect(symbol)}
                        className="flex items-center space-x-3 px-2 py-2 cursor-pointer rounded aria-selected:bg-symphony-primary/10 aria-selected:text-symphony-primary text-text-primary hover:bg-bg-tertiary"
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${colorClass}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="truncate font-medium">
                              {symbol.name}
                            </span>
                            <span className="ml-2 text-xs text-text-tertiary truncate max-w-[200px]">
                              {fileName}
                            </span>
                          </div>
                          {symbol.containerName && (
                            <p className="text-xs text-text-tertiary truncate mt-0.5">
                              in {symbol.containerName}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
