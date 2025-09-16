// useCodeLens.js - Hook for managing CodeLens functionality
import { useCallback } from "react";
import { extractOutlineByLanguage } from "../utils/outlineParser";

export const useCodeLens = () => {
  const registerCodeLensProvider = useCallback((monacoInstance, activeFile) => {
    const languages = ["javascript", "typescript", "python", "plaintext"];
    
    languages.forEach((lang) => {
      monacoInstance.languages.registerCodeLensProvider(lang, {
        provideCodeLenses: (model) => {
          const fileName = activeFile?.name || "";
          const outline = model.getValue().length
            ? extractOutlineByLanguage(model.getValue(), fileName)
            : [];

          const lenses = outline.map((item) => ({
            range: {
              startLineNumber: item.line,
              startColumn: 1,
              endLineNumber: item.line,
              endColumn: 1,
            },
            id: `${item.type}-${item.name}-${item.line}`,
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
    });
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

  return {
    registerCodeLensProvider,
    addJumpToCommand,
  };
};
