import type { LanguageParser } from "./types";
import { cppParser } from "./cppParser";
import { goParser } from "./goParser";
import { javaParser } from "./javaParser";
import { javascriptParser } from "./javascriptParser";
import { pythonParser } from "./pythonParser";
import { rustParser } from "./rustParser";
import { typescriptParser } from "./typescriptParser";

export const languageParsers: LanguageParser[] = [
  javascriptParser,
  typescriptParser,
  pythonParser,
  javaParser,
  cppParser,
  goParser,
  rustParser
];

const extensionMap = new Map<string, LanguageParser>();
for (const parser of languageParsers) {
  for (const extension of parser.extensions) {
    extensionMap.set(extension, parser);
  }
}

export function getParserByExtension(extension: string): LanguageParser | undefined {
  return extensionMap.get(extension.toLowerCase());
}
