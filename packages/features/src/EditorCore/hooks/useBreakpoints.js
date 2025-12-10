// useBreakpoints.js - Hook for managing breakpoint functionality
import { useRef, useCallback } from "react";

export const useBreakpoints = () => {
  const breakpointsRef = useRef([]);

  const handleBreakpointClick = useCallback((editor, monacoInstance, e, glyphMarginSettings) => {
    if (
      e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN &&
      glyphMarginSettings.enabled
    ) {
      const lineNumber = e.target.position.lineNumber;
      const decorations = breakpointsRef.current;
      const existing = decorations.find((d) => d.lineNumber === lineNumber);
      
      if (existing) {
        // Remove existing breakpoint
        editor.deltaDecorations([existing.id], []);
        decorations.splice(decorations.indexOf(existing), 1);
      } else {
        // Add new breakpoint
        const [id] = editor.deltaDecorations(
          [],
          [
            {
              range: new monacoInstance.Range(lineNumber, 1, lineNumber, 1),
              options: {
                glyphMarginClassName: "breakpoint",
                glyphMarginHoverMessage: {
                  value: `Breakpoint at line ${lineNumber}`,
                },
              },
            },
          ]
        );
        decorations.push({ id, lineNumber });
      }
    }
  }, []);

  const handleExternalLinks = useCallback((e) => {
    if (e.target?.element?.tagName === "A") {
      const href = e.target.element.getAttribute("href");
      if (href?.startsWith("http")) {
        e.event.preventDefault();
        window.open(href, "_blank");
      }
    }
  }, []);

  const setupBreakpointStyles = useCallback(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .breakpoint {
        background-color: #ef4444;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-left: 4px;
      }
      .monaco-editor .decorationsOverviewRuler.folding {
        background-color: rgba(255, 215, 0, 0.3);
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return {
    breakpointsRef,
    handleBreakpointClick,
    handleExternalLinks,
    setupBreakpointStyles,
  };
};
