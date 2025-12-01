/// Outline View Component for Symphony IDE
///
/// Displays hierarchical document structure using LSP document symbols.
/// Provides navigation to symbols and updates on content changes.

import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  ChevronRight,
  ChevronDown,
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
import { outlineAtom } from './outlineAtom';
import { DocumentSymbol, SymbolKind } from './types';

/// Props for the OutlineView component
export interface OutlineViewProps {
  /// Callback when a symbol is selected
  onSelectItem?: (symbol: DocumentSymbol) => void;
  /// Optional CSS class name
  className?: string;
}

/// Get icon component for a symbol kind
///
/// Maps LSP SymbolKind enum values to appropriate Lucide icons
/// for visual representation in the outline.
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
/// Provides consistent color coding for different symbol types.
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

/// Symbol Tree Item Component
///
/// Renders a single symbol with its children in a hierarchical tree structure.
/// Supports expand/collapse for symbols with children.
interface SymbolTreeItemProps {
  symbol: DocumentSymbol;
  level: number;
  onSelect: (symbol: DocumentSymbol) => void;
}

function SymbolTreeItem({ symbol, level, onSelect }: SymbolTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = symbol.children && symbol.children.length > 0;
  const Icon = getSymbolIcon(symbol.kind);
  const colorClass = getSymbolColor(symbol.kind);

  return (
    <div>
      <div
        className="flex items-center space-x-2 px-2 py-1 cursor-pointer hover:bg-gray-800 rounded group"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelect(symbol)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-gray-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-4 h-4 flex-shrink-0" />
        )}
        <Icon className={`w-4 h-4 flex-shrink-0 ${colorClass}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-white truncate font-medium">
              {symbol.name}
            </span>
            {symbol.detail && (
              <span className="text-xs text-gray-500 truncate">
                {symbol.detail}
              </span>
            )}
          </div>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {symbol.children!.map((child, index) => (
            <SymbolTreeItem
              key={`${child.name}-${index}`}
              symbol={child}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/// Outline View Component
///
/// Displays a hierarchical outline of the current document using LSP
/// document symbols. Provides navigation to symbols and updates when
/// the document content changes.
///
/// # Features
///
/// - Hierarchical symbol display
/// - Symbol type icons and color coding
/// - Expand/collapse for nested symbols
/// - Click to navigate to symbol
/// - Automatic updates on content changes
///
/// # Examples
///
/// ```tsx
/// <OutlineView
///   onSelectItem={(symbol) => {
///     // Navigate to symbol location
///     editor.setPosition(symbol.selectionRange.start);
///     editor.revealPosition(symbol.selectionRange.start);
///   }}
/// />
/// ```
///
/// # Requirements
///
/// Validates requirements:
/// - 10.1: Request document symbols on file open
/// - 10.2: Display symbols hierarchically
/// - 10.5: Show symbol type icons
export default function OutlineView({ onSelectItem, className = '' }: OutlineViewProps) {
  const outline = useAtomValue(outlineAtom);

  const handleSelect = (symbol: DocumentSymbol) => {
    onSelectItem?.(symbol);
  };

  return (
    <div
      className={`p-2 bg-gray-900 text-white border-l border-gray-700 h-full overflow-auto ${className}`}
    >
      <h2 className="text-lg font-bold mb-2 px-2">Outline</h2>
      {outline.length === 0 ? (
        <p className="text-sm text-gray-400 px-2">No symbols found.</p>
      ) : (
        <div className="space-y-0.5">
          {outline.map((symbol, index) => (
            <SymbolTreeItem
              key={`${symbol.name}-${index}`}
              symbol={symbol}
              level={0}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
