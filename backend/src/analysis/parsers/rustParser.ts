import { createRegexParser } from "./common";

export const rustParser = createRegexParser("rust", [".rs"], {
  importPatterns: [/use\s+([A-Za-z0-9_:]+)::/g],
  classPattern: /struct\s+([A-Za-z_][A-Za-z0-9_]*)/g,
  functionPattern: /fn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
  callPattern: /([A-Za-z_][A-Za-z0-9_]*)\s*!?\s*\(/g,
  inheritPattern: undefined
});
