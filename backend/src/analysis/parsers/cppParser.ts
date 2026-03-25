import { createRegexParser } from "./common";

export const cppParser = createRegexParser("cpp", [".cpp", ".cc", ".cxx", ".hpp", ".h"], {
  importPatterns: [/#include\s+["<]([^">]+)[">]/g],
  classPattern: /class\s+([A-Za-z_][A-Za-z0-9_]*)/g,
  functionPattern: /(?:[A-Za-z_][A-Za-z0-9_:<>\*&\s]+)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\([^\)]*\)\s*\{/g,
  callPattern: /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  inheritPattern: /:\s*public\s+([A-Za-z_][A-Za-z0-9_]*)/
});
