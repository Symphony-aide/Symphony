/**
 * EvidenceCollector - Extracts and formats code evidence for evaluations
 * 
 * Provides utilities for extracting code snippets with file paths and line numbers,
 * formatting them as fenced code blocks with language identifiers.
 * 
 * @module EvidenceCollector
 */

import type { CodeEvidence } from '../../types/evaluation';

/**
 * Options for extracting code evidence
 */
export interface EvidenceExtractionOptions {
  /** Maximum number of lines to include in a snippet */
  maxLines?: number;
  /** Whether to include surrounding context lines */
  includeContext?: boolean;
  /** Number of context lines before and after */
  contextLines?: number;
}

/**
 * Default options for evidence extraction
 */
const DEFAULT_OPTIONS: Required<EvidenceExtractionOptions> = {
  maxLines: 50,
  includeContext: true,
  contextLines: 2,
};

/**
 * EvidenceCollector class for extracting and formatting code evidence
 * 
 * @example
 * ```typescript
 * const collector = new EvidenceCollector();
 * const evidence = collector.extractEvidence(
 *   sourceCode,
 *   'StatusBar.jsx',
 *   18,
 *   32
 * );
 * const formatted = collector.formatAsCodeBlock(evidence);
 * ```
 */
export class EvidenceCollector {
  private options: Required<EvidenceExtractionOptions>;

  constructor(options: EvidenceExtractionOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Extracts code evidence from source code
   * 
   * @param sourceCode - The full source code
   * @param filePath - Path to the file
   * @param startLine - Starting line number (1-indexed)
   * @param endLine - Ending line number (1-indexed)
   * @param language - Programming language (optional, will be inferred from file extension)
   * @returns CodeEvidence object
   */
  extractEvidence(
    sourceCode: string,
    filePath: string,
    startLine: number,
    endLine: number,
    language?: string
  ): CodeEvidence {
    const lines = sourceCode.split('\n');
    
    // Validate and adjust line numbers
    const validStartLine = Math.max(1, Math.min(startLine, lines.length));
    const validEndLine = Math.max(validStartLine, Math.min(endLine, lines.length));
    
    // Apply max lines limit
    const actualEndLine = Math.min(
      validEndLine,
      validStartLine + this.options.maxLines - 1
    );
    
    // Extract the code snippet (convert to 0-indexed for array access)
    const codeSnippet = lines
      .slice(validStartLine - 1, actualEndLine)
      .join('\n');
    
    // Infer language if not provided
    const inferredLanguage = language || this.inferLanguage(filePath);
    
    return {
      filePath,
      lineNumbers: {
        start: validStartLine,
        end: actualEndLine,
      },
      codeSnippet,
      language: inferredLanguage,
    };
  }

  /**
   * Extracts code evidence with surrounding context
   * 
   * @param sourceCode - The full source code
   * @param filePath - Path to the file
   * @param startLine - Starting line number (1-indexed)
   * @param endLine - Ending line number (1-indexed)
   * @param language - Programming language (optional)
   * @returns CodeEvidence object with context
   */
  extractEvidenceWithContext(
    sourceCode: string,
    filePath: string,
    startLine: number,
    endLine: number,
    language?: string
  ): CodeEvidence {
    const lines = sourceCode.split('\n');
    
    // Calculate context boundaries
    const contextStart = Math.max(1, startLine - this.options.contextLines);
    const contextEnd = Math.min(lines.length, endLine + this.options.contextLines);
    
    return this.extractEvidence(
      sourceCode,
      filePath,
      contextStart,
      contextEnd,
      language
    );
  }

  /**
   * Formats code evidence as a fenced code block with language identifier
   * and file/line information as a comment
   * 
   * @param evidence - The code evidence to format
   * @returns Formatted markdown code block string
   */
  formatAsCodeBlock(evidence: CodeEvidence): string {
    const { filePath, lineNumbers, codeSnippet, language } = evidence;
    
    // Create the line comment
    const lineComment = this.createLineComment(
      filePath,
      lineNumbers.start,
      lineNumbers.end,
      language
    );
    
    // Build the fenced code block
    const lines = [
      `\`\`\`${language}`,
      lineComment,
      codeSnippet,
      '```',
    ];
    
    return lines.join('\n');
  }

  /**
   * Creates a line comment in the appropriate format for the language
   * 
   * @param filePath - Path to the file
   * @param startLine - Starting line number
   * @param endLine - Ending line number
   * @param language - Programming language
   * @returns Formatted comment string
   */
  createLineComment(
    filePath: string,
    startLine: number,
    endLine: number,
    language: string
  ): string {
    const lineRange = startLine === endLine
      ? `Line ${startLine}`
      : `Lines [${startLine}-${endLine}]`;
    
    const commentContent = `${lineRange} from ${filePath}`;
    
    // Use appropriate comment syntax based on language
    switch (language.toLowerCase()) {
      case 'html':
      case 'xml':
        return `<!-- ${commentContent} -->`;
      case 'css':
      case 'scss':
      case 'less':
        return `/* ${commentContent} */`;
      case 'python':
      case 'ruby':
      case 'shell':
      case 'bash':
      case 'yaml':
      case 'yml':
        return `# ${commentContent}`;
      default:
        // JavaScript, TypeScript, Java, C, C++, Go, Rust, etc.
        return `// ${commentContent}`;
    }
  }

  /**
   * Formats multiple code evidence items as a combined code block section
   * 
   * @param evidenceList - Array of code evidence items
   * @returns Formatted markdown string with all code blocks
   */
  formatMultipleEvidence(evidenceList: CodeEvidence[]): string {
    return evidenceList
      .map(evidence => this.formatAsCodeBlock(evidence))
      .join('\n\n');
  }

  /**
   * Creates a code evidence object from raw data
   * 
   * @param filePath - Path to the file
   * @param startLine - Starting line number
   * @param endLine - Ending line number
   * @param codeSnippet - The code snippet
   * @param language - Programming language (optional)
   * @returns CodeEvidence object
   */
  createEvidence(
    filePath: string,
    startLine: number,
    endLine: number,
    codeSnippet: string,
    language?: string
  ): CodeEvidence {
    return {
      filePath,
      lineNumbers: {
        start: startLine,
        end: endLine,
      },
      codeSnippet,
      language: language || this.inferLanguage(filePath),
    };
  }

  /**
   * Validates that code evidence has all required fields
   * 
   * @param evidence - The evidence to validate
   * @returns True if evidence is valid
   */
  isValidEvidence(evidence: CodeEvidence): boolean {
    return (
      typeof evidence.filePath === 'string' &&
      evidence.filePath.length > 0 &&
      typeof evidence.lineNumbers.start === 'number' &&
      typeof evidence.lineNumbers.end === 'number' &&
      evidence.lineNumbers.start > 0 &&
      evidence.lineNumbers.end >= evidence.lineNumbers.start &&
      typeof evidence.codeSnippet === 'string' &&
      evidence.codeSnippet.length > 0 &&
      typeof evidence.language === 'string' &&
      evidence.language.length > 0
    );
  }

  /**
   * Infers programming language from file extension
   * 
   * @param filePath - Path to the file
   * @returns Language identifier
   */
  inferLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'mjs': 'javascript',
      'cjs': 'javascript',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'kt': 'kotlin',
      'go': 'go',
      'rs': 'rust',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'swift': 'swift',
      'scala': 'scala',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'md': 'markdown',
      'sh': 'shell',
      'bash': 'bash',
      'sql': 'sql',
    };
    
    return languageMap[ext] || 'text';
  }

  /**
   * Extracts a single line as evidence
   * 
   * @param sourceCode - The full source code
   * @param filePath - Path to the file
   * @param lineNumber - The line number to extract
   * @param language - Programming language (optional)
   * @returns CodeEvidence object for the single line
   */
  extractSingleLine(
    sourceCode: string,
    filePath: string,
    lineNumber: number,
    language?: string
  ): CodeEvidence {
    return this.extractEvidence(
      sourceCode,
      filePath,
      lineNumber,
      lineNumber,
      language
    );
  }
}

/**
 * Helper function to create code evidence
 */
export function createCodeEvidence(
  filePath: string,
  startLine: number,
  endLine: number,
  codeSnippet: string,
  language: string = 'javascript'
): CodeEvidence {
  return {
    filePath,
    lineNumbers: { start: startLine, end: endLine },
    codeSnippet,
    language,
  };
}

/**
 * Helper function to format evidence as a code block
 */
export function formatEvidenceAsCodeBlock(evidence: CodeEvidence): string {
  const collector = new EvidenceCollector();
  return collector.formatAsCodeBlock(evidence);
}
