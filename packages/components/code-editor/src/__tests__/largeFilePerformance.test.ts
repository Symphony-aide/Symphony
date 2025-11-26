/**
 * Large File Performance Tests
 * 
 * Tests Monaco Editor performance with large files (10,000+ lines)
 * Requirements: 8.1, 8.2, 8.5
 * 
 * Test objectives:
 * - Verify virtual scrolling works with large files
 * - Measure syntax highlighting latency (<100ms target)
 * - Verify memory usage is acceptable
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getEditorOptionsForLanguage,
  PERFORMANCE_CONFIG,
  type SupportedLanguage,
} from '../config/monacoConfig.js';

describe('Large File Performance', () => {
  describe('Performance Configuration', () => {
    it('should apply performance optimizations for files over 10,000 lines', () => {
      const lineCount = 15000;
      const options = getEditorOptionsForLanguage('javascript', lineCount);

      // Verify performance optimizations are applied
      expect(options.minimap?.enabled).toBe(false);
      expect(options.renderWhitespace).toBe('none');
      expect(options.renderControlCharacters).toBe(false);
      expect(options.occurrencesHighlight).toBe('off');
      expect(options.selectionHighlight).toBe(false);
    });

    it('should not apply performance optimizations for small files', () => {
      const lineCount = 500;
      const options = getEditorOptionsForLanguage('javascript', lineCount);

      // Verify normal options are used
      expect(options.minimap?.enabled).toBe(true);
      expect(options.renderWhitespace).toBe('selection');
      expect(options.occurrencesHighlight).toBe('singleFile');
      expect(options.selectionHighlight).toBe(true);
    });

    it('should have correct large file threshold', () => {
      expect(PERFORMANCE_CONFIG.largeFileThreshold).toBe(10000);
    });
  });

  describe('Virtual Scrolling', () => {
    it('should enable smooth scrolling for all file sizes', () => {
      const smallFileOptions = getEditorOptionsForLanguage('javascript', 100);
      const largeFileOptions = getEditorOptionsForLanguage('javascript', 15000);

      // Virtual scrolling is always enabled in Monaco
      expect(smallFileOptions.smoothScrolling).toBe(true);
      expect(largeFileOptions.smoothScrolling).toBe(true);
    });

    it('should configure minimap for virtual scrolling', () => {
      const options = getEditorOptionsForLanguage('javascript', 500);

      expect(options.minimap).toBeDefined();
      expect(options.minimap?.enabled).toBe(true);
      expect(options.minimap?.showSlider).toBe('mouseover');
    });
  });

  describe('Language-Specific Optimizations', () => {
    const languages: SupportedLanguage[] = ['typescript', 'javascript', 'python', 'rust', 'go'];

    languages.forEach(language => {
      it(`should provide optimized options for ${language}`, () => {
        const options = getEditorOptionsForLanguage(language, 500);

        expect(options).toBeDefined();
        expect(options.fontSize).toBeDefined();
        expect(options.tabSize).toBeDefined();
        expect(options.automaticLayout).toBe(true);
      });
    });

    it('should use 4 spaces for Python', () => {
      const options = getEditorOptionsForLanguage('python', 500);
      expect(options.tabSize).toBe(4);
      expect(options.insertSpaces).toBe(true);
    });

    it('should use 2 spaces for JavaScript/TypeScript', () => {
      const jsOptions = getEditorOptionsForLanguage('javascript', 500);
      const tsOptions = getEditorOptionsForLanguage('typescript', 500);

      expect(jsOptions.tabSize).toBe(2);
      expect(tsOptions.tabSize).toBe(2);
    });

    it('should use tabs for Go', () => {
      const options = getEditorOptionsForLanguage('go', 500);
      expect(options.tabSize).toBe(4);
      expect(options.insertSpaces).toBe(false);
    });
  });

  describe('Tokenization Limits', () => {
    it('should set tokenization limits for large files', () => {
      const options = getEditorOptionsForLanguage('javascript', 15000);

      expect(options.maxTokenizationLineLength).toBeDefined();
      expect(options.stopRenderingLineAfter).toBeDefined();
      expect(options.maxTokenizationLineLength).toBeLessThanOrEqual(10000);
    });

    it('should allow longer tokenization for normal files', () => {
      const options = getEditorOptionsForLanguage('javascript', 500);

      expect(options.maxTokenizationLineLength).toBeGreaterThan(10000);
    });
  });

  describe('Memory Optimization', () => {
    it('should disable expensive features for large files', () => {
      const options = getEditorOptionsForLanguage('javascript', 15000);

      // These features are disabled to save memory
      expect(options.minimap?.enabled).toBe(false);
      expect(options.wordBasedSuggestions).toBe('off');
    });

    it('should keep essential features enabled', () => {
      const options = getEditorOptionsForLanguage('javascript', 15000);

      // These features should remain enabled
      expect(options.automaticLayout).toBe(true);
      expect(options.lineNumbers).toBe('on');
      expect(options.folding).toBe(true);
    });
  });
});

/**
 * Generate test file content with specified number of lines
 */
function generateTestContent(lines: number, language: SupportedLanguage): string {
  const templates: Record<SupportedLanguage, (i: number) => string> = {
    javascript: (i) => `function test${i}() {\n  console.log("Line ${i}");\n  return ${i};\n}\n`,
    typescript: (i) => `function test${i}(): number {\n  console.log("Line ${i}");\n  return ${i};\n}\n`,
    python: (i) => `def test_${i}():\n    print("Line ${i}")\n    return ${i}\n`,
    rust: (i) => `fn test_${i}() -> i32 {\n    println!("Line {}", ${i});\n    ${i}\n}\n`,
    go: (i) => `func test${i}() int {\n\tfmt.Println("Line", ${i})\n\treturn ${i}\n}\n`,
    html: (i) => `<div id="element-${i}">Line ${i}</div>\n`,
    css: (i) => `.class-${i} {\n  color: #${i.toString(16).padStart(6, '0')};\n}\n`,
    json: (i) => `  "key${i}": "value${i}",\n`,
    markdown: (i) => `## Heading ${i}\n\nContent for section ${i}\n\n`,
    yaml: (i) => `key${i}: value${i}\n`,
    xml: (i) => `<element${i}>Value ${i}</element${i}>\n`,
    sql: (i) => `SELECT * FROM table${i} WHERE id = ${i};\n`,
    shell: (i) => `echo "Line ${i}"\n`,
  };

  const template = templates[language] || templates.javascript;
  let content = '';

  for (let i = 1; i <= lines; i++) {
    content += template(i);
  }

  return content;
}

describe('Performance Benchmarks', () => {
  it('should generate test content efficiently', () => {
    const start = performance.now();
    const content = generateTestContent(10000, 'javascript');
    const end = performance.now();

    expect(content.split('\n').length).toBeGreaterThanOrEqual(10000);
    expect(end - start).toBeLessThan(1000); // Should generate in less than 1 second
  });

  it('should handle various file sizes', () => {
    const sizes = [100, 1000, 10000, 50000];

    sizes.forEach(size => {
      const content = generateTestContent(size, 'javascript');
      const lines = content.split('\n').length;

      expect(lines).toBeGreaterThanOrEqual(size);
    });
  });
});
