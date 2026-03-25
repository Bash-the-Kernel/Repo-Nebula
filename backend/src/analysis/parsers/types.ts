import type { SupportedLanguage } from "@repo-nebula/shared";

export interface ParsedEntity {
  filePath: string;
  language: SupportedLanguage;
  imports: string[];
  classes: Array<{ name: string; extends?: string }>;
  functions: Array<{ name: string; calls: string[] }>;
  lineCount: number;
}

export interface LanguageParser {
  language: SupportedLanguage;
  extensions: string[];
  parse(filePath: string, source: string): ParsedEntity;
}
