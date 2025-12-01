/// Outline Atom for Symphony IDE
///
/// Jotai atom for managing document symbol outline state

import { atom } from 'jotai';
import { DocumentSymbol } from './types';

/// Atom containing the current document's symbol outline
///
/// Stores an array of DocumentSymbol objects representing the
/// hierarchical structure of the current file. Updated when:
/// - A new file is opened
/// - The file content changes
/// - LSP server provides updated symbols
export const outlineAtom = atom<DocumentSymbol[]>([]);
