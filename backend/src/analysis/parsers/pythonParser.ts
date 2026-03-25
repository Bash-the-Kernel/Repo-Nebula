import { createRegexParser } from "./common";

export const pythonParser = createRegexParser("python", [".py"], {
  importPatterns: [/import\s+([A-Za-z0-9_\.]+)/g, /from\s+([A-Za-z0-9_\.]+)\s+import\s+/g],
  classPattern: /class\s+([A-Za-z_][A-Za-z0-9_]*)/g,
  functionPattern: /def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  callPattern: /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  inheritPattern: /class\s+[A-Za-z_][A-Za-z0-9_]*\(([^\)]+)\)/
});
