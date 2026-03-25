import { createRegexParser } from "./common";

export const javaParser = createRegexParser("java", [".java"], {
  importPatterns: [/import\s+([A-Za-z0-9_\.]+);/g],
  classPattern: /class\s+([A-Za-z_][A-Za-z0-9_]*)/g,
  functionPattern: /(?:public|private|protected)?\s*(?:static\s+)?[A-Za-z0-9_<>\[\]]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  callPattern: /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  inheritPattern: /extends\s+([A-Za-z_][A-Za-z0-9_]*)/
});
