// useCodeLens.js - Hook for managing CodeLens functionality
import { useCallback, useRef } from "react";
import { extractOutlineByLanguage } from "../utils/outlineParser";

export const useCodeLens = () => {
  const disposablesRef = useRef([]);

  const registerCodeLensProvider = useCallback((monacoInstance, activeFile) => {
    // Dispose of previous registrations to prevent duplicates
    disposablesRef.current.forEach(disposable => {
      if (disposable && typeof disposable.dispose === 'function') {
        disposable.dispose();
      }
    });
    disposablesRef.current = [];

    // Determine the language of the current file
    const getLanguageFromFileName = (fileName) => {
      if (!fileName) return "plaintext";
      const ext = fileName.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'js':
        case 'jsx':
          return 'javascript';
        case 'ts':
        case 'tsx':
          return 'typescript';
        case 'py':
          return 'python';
        default:
          return 'plaintext';
      }
    };

    const currentLanguage = getLanguageFromFileName(activeFile?.name);
    
    // Only register for the current file's language
    const disposable = monacoInstance.languages.registerCodeLensProvider(currentLanguage, {
      provideCodeLenses: (model) => {
        const fileName = activeFile?.name || "";
        const outline = model.getValue().length
          ? extractOutlineByLanguage(model.getValue(), fileName)
          : [];

        // Remove duplicates based on line number and name
        const uniqueOutline = outline.filter((item, index, arr) => 
          arr.findIndex(other => 
            other.line === item.line && 
            other.name === item.name && 
            other.type === item.type
          ) === index
        );

        const lenses = uniqueOutline.map((item) => ({
          range: {
            startLineNumber: item.line,
            startColumn: 1,
            endLineNumber: item.line,
            endColumn: 1,
          },
          id: `${item.type}-${item.name}-${item.line}-${Date.now()}`, // Add timestamp for uniqueness
          command: {
            id: "outline.jumpTo",
            title: `💡 ${item.type} ${item.name} (${item.refs} refs, ${item.lines} lines)`,
            arguments: [{ range: { startLineNumber: item.line } }],
          },
        }));

        return { lenses, dispose: () => {} };
      },
      resolveCodeLens: (model, codeLens) => codeLens,
    });

    // Store the disposable for cleanup
    disposablesRef.current.push(disposable);
  }, []);

  const addJumpToCommand = useCallback((editor) => {
    editor.addCommand(
      0,
      (ctx, args) => {
        if (args?.range) {
          editor.revealLineInCenter(args.range.startLineNumber);
          editor.setPosition({
            lineNumber: args.range.startLineNumber,
            column: 1,
          });
          editor.focus();
        }
      },
      "outline.jumpTo"
    );
  }, []);

  const dispose = useCallback(() => {
    disposablesRef.current.forEach(disposable => {
      if (disposable && typeof disposable.dispose === 'function') {
        disposable.dispose();
      }
    });
    disposablesRef.current = [];
  }, []);

  return {
    registerCodeLensProvider,
    addJumpToCommand,
    dispose,
  };
};
