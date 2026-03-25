import type { ArchitectureGraph, GraphInsights } from "@repo-nebula/shared";

export type RepositoryStatus = "ingested" | "analyzing" | "analyzed" | "failed";
export type RepositorySourceType = "github" | "gitlab" | "zip";

export interface RepositoryRecord {
  id: string;
  repoUrl: string;
  sourceType: RepositorySourceType;
  name: string;
  localPath: string;
  detectedLanguages: string[];
  status: RepositoryStatus;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface AnalysisResult {
  repositoryId: string;
  graph: ArchitectureGraph;
  insights: GraphInsights;
  summary: string;
  analyzedAt: string;
}

class RepositoryStore {
  private readonly repositories = new Map<string, RepositoryRecord>();
  private readonly analysisResults = new Map<string, AnalysisResult>();

  upsertRepository(record: RepositoryRecord): RepositoryRecord {
    this.repositories.set(record.id, record);
    return record;
  }

  getRepository(id: string): RepositoryRecord | undefined {
    return this.repositories.get(id);
  }

  upsertAnalysisResult(result: AnalysisResult): AnalysisResult {
    this.analysisResults.set(result.repositoryId, result);
    return result;
  }

  getAnalysisResult(repositoryId: string): AnalysisResult | undefined {
    return this.analysisResults.get(repositoryId);
  }
}

export const repositoryStore = new RepositoryStore();
