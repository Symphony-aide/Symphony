// outlineParser.js - Utility for extracting code outline from different languages
import { parseScript } from "meriyah";

/**
 * Extract outline information from JavaScript/TypeScript code
 */
const extractJavaScriptOutline = (code) => {
  try {
    const ast = parseScript(code, { next: true, loc: true });
    const outline = [];
    const counts = {};

    // Count identifiers for reference tracking
    const countIds = (node) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(countIds);
      if (node.type === "Identifier") counts[node.name] = (counts[node.name] || 0) + 1;
      for (const key in node) {
        if (!["loc", "start", "end"].includes(key)) countIds(node[key]);
      }
    };
    countIds(ast.body);

    // Collect declarations
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(walk);

      switch (node.type) {
        case "FunctionDeclaration": {
          const name = node.id?.name || "anonymous";
          outline.push({
            name,
            type: "function",
            line: node.loc.start.line,
            lines: node.loc.end.line - node.loc.start.line + 1,
            refs: counts[name] || 1,
          });
          break;
        }
        case "VariableDeclaration":
          node.declarations?.forEach((decl) => {
            if (decl.id?.name) {
              outline.push({
                name: decl.id.name,
                type: "variable",
                line: decl.loc.start.line,
                lines: decl.loc.end?.line ? decl.loc.end.line - decl.loc.start.line + 1 : 1,
                refs: counts[decl.id.name] || 1,
              });
            }
          });
          break;
        case "ClassDeclaration": {
          const name = node.id?.name || "anonymous";
          outline.push({
            name,
            type: "class",
            line: node.loc.start.line,
            lines: node.loc.end.line - node.loc.start.line + 1,
            refs: counts[name] || 1,
          });
          break;
        }
      }
      for (const key in node) {
        if (!["loc", "start", "end"].includes(key)) walk(node[key]);
      }
    };
    walk(ast.body);

    return outline;
  } catch {
    return [];
  }
};

/**
 * Extract outline information from Python code
 */
const extractPythonOutline = (code) => {
  const outline = [];
  const counts = {};
  const lines = code.split("\n");

  // Simple identifier counting
  lines.forEach((line) => {
    const words = line.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    words.forEach((w) => (counts[w] = (counts[w] || 0) + 1));
  });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fnMatch = line.match(/^\s*def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    const classMatch = line.match(/^\s*class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);

    if (fnMatch || classMatch) {
      const name = fnMatch ? fnMatch[1] : classMatch[1];
      const type = fnMatch ? "function" : "class";
      const indent = line.match(/^\s*/)?.[0].length || 0;

      // Find end of block by indentation
      let endLine = i;
      for (let j = i + 1; j < lines.length; j++) {
        const currIndent = lines[j].match(/^\s*/)?.[0].length || 0;
        if (lines[j].trim() && currIndent <= indent) break;
        endLine = j;
      }

      outline.push({
        name,
        type,
        line: i + 1,
        lines: endLine - i + 1,
        refs: counts[name] || 1,
      });
    }
  }
  return outline;
};

/**
 * Main function to extract outline by language
 */
export const extractOutlineByLanguage = (code, fileName) => {
  if (/\.(js|jsx|ts|tsx)$/i.test(fileName)) {
    return extractJavaScriptOutline(code);
  }

  if (/\.py$/i.test(fileName)) {
    return extractPythonOutline(code);
  }

  return [];
};

/**
 * Detect programming language from file extension
 */
export const detectLanguage = (fileName) => {
  if (/\.jsx?$/i.test(fileName)) return "javascript";
  if (/\.tsx?$/i.test(fileName)) return "typescript";
  if (/\.py$/i.test(fileName)) return "python";
  return "plaintext";
};
