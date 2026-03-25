import { createRegexParser } from "./common";

export const goParser = createRegexParser("go", [".go"], {
  importPatterns: [/import\s+"([^"]+)"/g, /"([A-Za-z0-9_\/-]+)"/g],
  classPattern: /type\s+([A-Za-z_][A-Za-z0-9_]*)\s+struct/g,
  functionPattern: /func\s+(?:\([^)]+\)\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  callPattern: /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  inheritPattern: undefined
});
