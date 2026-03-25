import fs from "fs-extra";
import path from "path";
import { globSync } from "glob";
import type { ArchitectureGraph, SupportedLanguage } from "@repo-nebula/shared";
import { buildArchitectureGraph } from "./graphBuilder";
import { getParserByExtension } from "./parsers";
import type { ParsedEntity } from "./parsers/types";

const IGNORED_PATHS = ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**", "**/.next/**", "**/target/**", "**/vendor/**"];

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export interface AnalysisEngineResult {
  graph: ArchitectureGraph;
  languages: SupportedLanguage[];
}

export function runAnalysisEngine(params: {
  repositoryId: string;
  repositoryName: string;
  repositoryPath: string;
}): AnalysisEngineResult {
  const { repositoryId, repositoryName, repositoryPath } = params;

  const files = globSync("**/*.*", {
    cwd: repositoryPath,
    absolute: true,
    nodir: true,
    ignore: IGNORED_PATHS
  });

  const entities: ParsedEntity[] = [];
  const languageSet = new Set<SupportedLanguage>();

  for (const absolutePath of files) {
    const extension = path.extname(absolutePath).toLowerCase();
    const parser = getParserByExtension(extension);
    if (!parser) {
      continue;
    }

    const source = fs.readFileSync(absolutePath, "utf-8");
    const relativePath = normalizePath(path.relative(repositoryPath, absolutePath));
    const parsed = parser.parse(relativePath, source);
    entities.push(parsed);
    languageSet.add(parsed.language);
  }

  const languages = Array.from(languageSet).sort() as SupportedLanguage[];

  const graph = buildArchitectureGraph({
    repositoryId,
    repositoryName,
    sourceRoot: repositoryPath,
    entities,
    languages
  });

  return { graph, languages };
}
