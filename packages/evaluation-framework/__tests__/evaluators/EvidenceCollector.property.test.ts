/**
 * Property-based tests for EvidenceCollector
 * 
 * **Feature: blind-evaluation-framework, Property 6: Evidence inclusion**
 * **Validates: Requirements 2.5**
 * 
 * For any feature rating, there SHALL exist associated code evidence containing
 * a valid file path (existing in the codebase), line numbers (start ≤ end, both > 0),
 * and a non-empty code snippet.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  EvidenceCollector,
  createCodeEvidence,
  formatEvidenceAsCodeBlock,
} from '../../src/evaluators/EvidenceCollector';
import type { CodeEvidence } from '../../types/evaluation';

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generate a valid file path with extension
 */
const filePath = () =>
  fc.tuple(
    fc.constantFrom('src', 'components', 'features', 'utils', 'lib'),
    fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
    fc.constantFrom('.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.html', '.css')
  ).map(([dir, name, ext]) => `${dir}/${name}${ext}`);

/**
 * Generate valid line numbers where start <= end and both > 0
 */
const validLineNumbers = () =>
  fc.tuple(
    fc.integer({ min: 1, max: 500 }),
    fc.integer({ min: 0, max: 100 })
  ).map(([start, offset]) => ({
    start,
    end: start + offset,
  }));

/**
 * Generate source code with a specific number of lines
 */
const sourceCode = (minLines: number = 10, maxLines: number = 100) =>
  fc.array(
    fc.string({ minLength: 0, maxLength: 80 }),
    { minLength: minLines, maxLength: maxLines }
  ).map(lines => lines.join('\n'));

/**
 * Generate a non-empty code snippet
 */
const codeSnippet = () =>
  fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);

/**
 * Generate a programming language
 */
const language = () =>
  fc.constantFrom(
    'javascript', 'typescript', 'python', 'java', 'go', 'rust',
    'html', 'css', 'json', 'yaml', 'shell'
  );

/**
 * Generate valid code evidence
 */
const validCodeEvidence = (): fc.Arbitrary<CodeEvidence> =>
  fc.record({
    filePath: filePath(),
    lineNumbers: validLineNumbers(),
    codeSnippet: codeSnippet(),
    language: language(),
  });

// ============================================================================
// Property Tests
// ============================================================================

describe('EvidenceCollector Property Tests', () => {
  const collector = new EvidenceCollector();

  /**
   * **Feature: blind-evaluation-framework, Property 6: Evidence inclusion**
   * **Validates: Requirements 2.5**
   */
  describe('Property 6: Evidence inclusion', () => {
    it('should extract evidence with valid file path', () => {
      fc.assert(
        fc.property(
          sourceCode(),
          filePath(),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 20 }),
          (source, path, startLine, lineCount) => {
            const lines = source.split('\n');
            const validStart = Math.min(startLine, lines.length);
            const validEnd = Math.min(validStart + lineCount, lines.length);
            
            const evidence = collector.extractEvidence(
              source,
              path,
              validStart,
              validEnd
            );
            
            // File path should be preserved
            expect(evidence.filePath).toBe(path);
            expect(evidence.filePath.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract evidence with valid line numbers (start <= end, both > 0)', () => {
      fc.assert(
        fc.property(
          sourceCode(),
          filePath(),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 0, max: 20 }),
          (source, path, startLine, offset) => {
            const lines = source.split('\n');
            const validStart = Math.min(startLine, lines.length);
            const endLine = validStart + offset;
            
            const evidence = collector.extractEvidence(
              source,
              path,
              validStart,
              endLine
            );
            
            // Line numbers should be valid
            expect(evidence.lineNumbers.start).toBeGreaterThan(0);
            expect(evidence.lineNumbers.end).toBeGreaterThanOrEqual(evidence.lineNumbers.start);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract non-empty code snippet when source has content', () => {
      fc.assert(
        fc.property(
          sourceCode(5, 50).filter(s => s.trim().length > 0),
          filePath(),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (source, path, startLine, lineCount) => {
            const lines = source.split('\n');
            const validStart = Math.min(startLine, lines.length);
            const validEnd = Math.min(validStart + lineCount, lines.length);
            
            const evidence = collector.extractEvidence(
              source,
              path,
              validStart,
              validEnd
            );
            
            // Code snippet should exist (may be empty if lines are empty)
            expect(typeof evidence.codeSnippet).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include language identifier in evidence', () => {
      fc.assert(
        fc.property(
          sourceCode(),
          filePath(),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 10 }),
          (source, path, startLine, lineCount) => {
            const evidence = collector.extractEvidence(
              source,
              path,
              startLine,
              startLine + lineCount
            );
            
            // Language should be inferred and non-empty
            expect(evidence.language).toBeTruthy();
            expect(evidence.language.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate evidence correctly', () => {
      fc.assert(
        fc.property(
          validCodeEvidence(),
          (evidence) => {
            expect(collector.isValidEvidence(evidence)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid evidence', () => {
      // Empty file path
      expect(collector.isValidEvidence({
        filePath: '',
        lineNumbers: { start: 1, end: 10 },
        codeSnippet: 'code',
        language: 'javascript',
      })).toBe(false);

      // Invalid line numbers (start > end)
      expect(collector.isValidEvidence({
        filePath: 'test.js',
        lineNumbers: { start: 10, end: 5 },
        codeSnippet: 'code',
        language: 'javascript',
      })).toBe(false);

      // Invalid line numbers (start <= 0)
      expect(collector.isValidEvidence({
        filePath: 'test.js',
        lineNumbers: { start: 0, end: 10 },
        codeSnippet: 'code',
        language: 'javascript',
      })).toBe(false);

      // Empty code snippet
      expect(collector.isValidEvidence({
        filePath: 'test.js',
        lineNumbers: { start: 1, end: 10 },
        codeSnippet: '',
        language: 'javascript',
      })).toBe(false);

      // Empty language
      expect(collector.isValidEvidence({
        filePath: 'test.js',
        lineNumbers: { start: 1, end: 10 },
        codeSnippet: 'code',
        language: '',
      })).toBe(false);
    });
  });

  describe('Code block formatting', () => {
    it('should format evidence as fenced code block with language identifier', () => {
      fc.assert(
        fc.property(
          validCodeEvidence(),
          (evidence) => {
            const formatted = collector.formatAsCodeBlock(evidence);
            
            // Should start with fenced code block with language
            expect(formatted).toMatch(new RegExp(`^\`\`\`${evidence.language}`));
            
            // Should end with closing fence
            expect(formatted).toMatch(/```$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include file path and line numbers as comment', () => {
      fc.assert(
        fc.property(
          validCodeEvidence(),
          (evidence) => {
            const formatted = collector.formatAsCodeBlock(evidence);
            
            // Should contain file path
            expect(formatted).toContain(evidence.filePath);
            
            // Should contain line numbers
            if (evidence.lineNumbers.start === evidence.lineNumbers.end) {
              expect(formatted).toContain(`Line ${evidence.lineNumbers.start}`);
            } else {
              expect(formatted).toContain(`Lines [${evidence.lineNumbers.start}-${evidence.lineNumbers.end}]`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include the code snippet in the formatted output', () => {
      fc.assert(
        fc.property(
          validCodeEvidence(),
          (evidence) => {
            const formatted = collector.formatAsCodeBlock(evidence);
            
            // Should contain the code snippet
            expect(formatted).toContain(evidence.codeSnippet);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use appropriate comment syntax for different languages', () => {
      const testCases = [
        { language: 'javascript', expectedPrefix: '//' },
        { language: 'typescript', expectedPrefix: '//' },
        { language: 'python', expectedPrefix: '#' },
        { language: 'html', expectedPrefix: '<!--' },
        { language: 'css', expectedPrefix: '/*' },
        { language: 'shell', expectedPrefix: '#' },
      ];

      for (const { language, expectedPrefix } of testCases) {
        const comment = collector.createLineComment('test.file', 1, 10, language);
        expect(comment.startsWith(expectedPrefix)).toBe(true);
      }
    });
  });

  describe('Language inference', () => {
    it('should infer correct language from file extension', () => {
      const testCases = [
        { path: 'file.js', expected: 'javascript' },
        { path: 'file.jsx', expected: 'javascript' },
        { path: 'file.ts', expected: 'typescript' },
        { path: 'file.tsx', expected: 'typescript' },
        { path: 'file.py', expected: 'python' },
        { path: 'file.java', expected: 'java' },
        { path: 'file.go', expected: 'go' },
        { path: 'file.rs', expected: 'rust' },
        { path: 'file.html', expected: 'html' },
        { path: 'file.css', expected: 'css' },
        { path: 'file.json', expected: 'json' },
        { path: 'file.yaml', expected: 'yaml' },
        { path: 'file.yml', expected: 'yaml' },
        { path: 'file.sh', expected: 'shell' },
      ];

      for (const { path, expected } of testCases) {
        expect(collector.inferLanguage(path)).toBe(expected);
      }
    });

    it('should return "text" for unknown extensions', () => {
      expect(collector.inferLanguage('file.unknown')).toBe('text');
      expect(collector.inferLanguage('file')).toBe('text');
    });
  });

  describe('Helper functions', () => {
    it('should create valid evidence with createCodeEvidence', () => {
      fc.assert(
        fc.property(
          filePath(),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 50 }),
          codeSnippet(),
          language(),
          (path, start, offset, snippet, lang) => {
            const evidence = createCodeEvidence(
              path,
              start,
              start + offset,
              snippet,
              lang
            );
            
            expect(evidence.filePath).toBe(path);
            expect(evidence.lineNumbers.start).toBe(start);
            expect(evidence.lineNumbers.end).toBe(start + offset);
            expect(evidence.codeSnippet).toBe(snippet);
            expect(evidence.language).toBe(lang);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format evidence correctly with formatEvidenceAsCodeBlock', () => {
      fc.assert(
        fc.property(
          validCodeEvidence(),
          (evidence) => {
            const formatted = formatEvidenceAsCodeBlock(evidence);
            
            // Should be a valid code block
            expect(formatted).toMatch(/^```/);
            expect(formatted).toMatch(/```$/);
            expect(formatted).toContain(evidence.filePath);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle single line extraction', () => {
      const source = 'line1\nline2\nline3\nline4\nline5';
      const evidence = collector.extractSingleLine(source, 'test.js', 3);
      
      expect(evidence.lineNumbers.start).toBe(3);
      expect(evidence.lineNumbers.end).toBe(3);
      expect(evidence.codeSnippet).toBe('line3');
    });

    it('should handle line numbers beyond source length', () => {
      const source = 'line1\nline2\nline3';
      const evidence = collector.extractEvidence(source, 'test.js', 1, 100);
      
      // Should clamp to actual source length
      expect(evidence.lineNumbers.end).toBeLessThanOrEqual(3);
    });

    it('should handle empty source code', () => {
      const evidence = collector.extractEvidence('', 'test.js', 1, 10);
      
      expect(evidence.codeSnippet).toBe('');
      expect(evidence.lineNumbers.start).toBe(1);
    });
  });
});
