// useEditor.js - Hook for editor setup and configuration
import { useEffect, useMemo } from "react";
import { useSetAtom } from "jotai";
import debounce from "lodash/debounce";
import { outlineAtom } from "../../../outlineview/src/outlineAtom";
import { extractOutlineByLanguage } from "../utils/outlineParser";
import { useCodeLens } from "./useCodeLens";
import { useBreakpoints } from "./useBreakpoints";

export const useEditor = (editorRef, activeFile, terminalVisible, glyphMarginSettings) => {
  const setOutline = useSetAtom(outlineAtom);
  const { registerCodeLensProvider, addJumpToCommand } = useCodeLens();
  const { 
    breakpointsRef, 
    handleBreakpointClick, 
    handleExternalLinks, 
    setupBreakpointStyles 
  } = useBreakpoints();

  // Debounced outline updater
  const updateOutline = useMemo(
    () =>
      debounce((code = "", fileName = "") => {
        if (!code.trim()) {
          setOutline([]);
          return;
        }
        setOutline(extractOutlineByLanguage(code, fileName));
      }, 300),
    [setOutline]
  );

  // Setup breakpoint styles
  useEffect(() => {
    return setupBreakpointStyles();
  }, [setupBreakpointStyles]);

  // Handle editor layout on terminal visibility change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [terminalVisible]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update outline when active file changes
  useEffect(() => {
    if (activeFile?.content?.trim().length > 0) {
      updateOutline(activeFile.content, activeFile.name);
    }
  }, [activeFile?.name, updateOutline]);

  // Cleanup debounced function
  useEffect(() => {
    return () => updateOutline.cancel();
  }, [updateOutline]);

  const handleEditorMount = (editor, monacoInstance) => {
    editorRef.current = editor;

    // Register CodeLens providers
    registerCodeLensProvider(monacoInstance, activeFile);

    // Add jump to command
    addJumpToCommand(editor);

    // Setup mouse event handlers
    editor.onMouseDown((e) => {
      handleBreakpointClick(editor, monacoInstance, e, glyphMarginSettings);
      handleExternalLinks(e);
    });
  };

  const handleEditorChange = (value) => {
    const content = value ?? "";
    updateOutline(content, activeFile?.name || "");
    return content;
  };

  return {
    handleEditorMount,
    handleEditorChange,
    breakpointsRef,
  };
};
