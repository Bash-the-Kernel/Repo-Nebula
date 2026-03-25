import axios from "axios";
import type { ArchitectureGraph, GraphEdgeType, GraphInsights, GraphNodeType } from "@repo-nebula/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const http = axios.create({
  baseURL: API_BASE_URL
});

export interface RepositoryDto {
  id: string;
  repoUrl: string;
  sourceType: "github" | "gitlab" | "zip";
  name: string;
  detectedLanguages: string[];
  status: "ingested" | "analyzing" | "analyzed" | "failed";
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export async function submitRepository(repoUrl: string): Promise<RepositoryDto> {
  const response = await http.post<RepositoryDto>("/api/repositories", { repoUrl });
  return response.data;
}

export async function uploadRepositoryZip(file: File): Promise<RepositoryDto> {
  const formData = new FormData();
  formData.append("repoZip", file);
  const response = await http.post<RepositoryDto>("/api/repositories/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
}

export async function getRepository(repositoryId: string): Promise<RepositoryDto> {
  const response = await http.get<RepositoryDto>(`/api/repositories/${repositoryId}`);
  return response.data;
}

export async function triggerAnalysis(repositoryId: string): Promise<{ status: string }> {
  const response = await http.post<{ status: string }>(`/api/analyze/${repositoryId}`);
  return response.data;
}

export async function getGraph(
  repositoryId: string,
  options?: {
    nodeTypes?: GraphNodeType[];
    edgeTypes?: GraphEdgeType[];
    depth?: number;
    maxNodes?: number;
    focusNodeId?: string;
  }
): Promise<ArchitectureGraph> {
  const response = await http.get<ArchitectureGraph>(`/api/graph/${repositoryId}`, {
    params: {
      nodeTypes: options?.nodeTypes?.join(","),
      edgeTypes: options?.edgeTypes?.join(","),
      depth: options?.depth,
      maxNodes: options?.maxNodes,
      focusNodeId: options?.focusNodeId
    }
  });
  return response.data;
}

export async function getInsights(repositoryId: string): Promise<GraphInsights> {
  const response = await http.get<GraphInsights>(`/api/insights/${repositoryId}`);
  return response.data;
}

export async function getSummary(repositoryId: string): Promise<string> {
  const response = await http.get<{ summary: string }>(`/api/summary/${repositoryId}`);
  return response.data.summary;
}
