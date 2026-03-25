import type { ParsedEntity, LanguageParser } from "./types";

export function createRegexParser(
  language: LanguageParser["language"],
  extensions: string[],
  options: {
    importPatterns: RegExp[];
    classPattern: RegExp;
    functionPattern: RegExp;
    callPattern: RegExp;
    inheritPattern?: RegExp;
  }
): LanguageParser {
  function getFirstCapture(match: RegExpMatchArray): string | undefined {
    for (const candidate of match.slice(1)) {
      if (candidate) {
        return candidate;
      }
    }
    return undefined;
  }

  return {
    language,
    extensions,
    parse(filePath: string, source: string): ParsedEntity {
      const imports: string[] = [];
      const classes: Array<{ name: string; extends?: string }> = [];
      const functions: Array<{ name: string; calls: string[] }> = [];

      for (const pattern of options.importPatterns) {
        for (const match of source.matchAll(pattern)) {
          const importTarget = getFirstCapture(match);
          if (importTarget) {
            imports.push(importTarget);
          }
        }
      }

      for (const match of source.matchAll(options.classPattern)) {
        const className = getFirstCapture(match);
        if (!className) {
          continue;
        }
        const extendsName = options.inheritPattern ? source.slice(match.index ?? 0, (match.index ?? 0) + 200).match(options.inheritPattern)?.[1] : undefined;
        classes.push({ name: className, extends: extendsName });
      }

      for (const match of source.matchAll(options.functionPattern)) {
        const functionName = getFirstCapture(match);
        if (!functionName) {
          continue;
        }
        const calls: string[] = [];
        for (const callMatch of source.matchAll(options.callPattern)) {
          const called = getFirstCapture(callMatch);
          if (called && called !== functionName) {
            calls.push(called);
          }
        }
        functions.push({ name: functionName, calls: Array.from(new Set(calls)).slice(0, 40) });
      }

      return {
        filePath,
        language,
        imports: Array.from(new Set(imports)),
        classes,
        functions,
        lineCount: source.split(/\r?\n/).length
      };
    }
  };
}
