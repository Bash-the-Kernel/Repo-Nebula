import { createRegexParser } from "./common";

export const javascriptParser = createRegexParser("javascript", [".js", ".jsx", ".mjs", ".cjs"], {
  importPatterns: [
    /import\s+(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']/g,
    /require\(\s*["']([^"']+)["']\s*\)/g
  ],
  classPattern: /class\s+([A-Za-z_][A-Za-z0-9_]*)/g,
  functionPattern: /function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  callPattern: /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  inheritPattern: /extends\s+([A-Za-z_][A-Za-z0-9_]*)/
});
