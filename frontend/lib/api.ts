import axios from "axios";
import type { ArchitectureGraph, GraphInsights } from "@repo-nebula/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const http = axios.create({
  baseURL: API_BASE_URL
});

export interface RepositoryDto {
  id: string;
  repoUrl: string;
  name: string;
  status: "ingested" | "analyzing" | "analyzed" | "failed";
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export async function submitRepository(repoUrl: string): Promise<RepositoryDto> {
  const response = await http.post<RepositoryDto>("/api/repositories", { repoUrl });
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

export async function getGraph(repositoryId: string): Promise<ArchitectureGraph> {
  const response = await http.get<ArchitectureGraph>(`/api/graph/${repositoryId}`);
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
