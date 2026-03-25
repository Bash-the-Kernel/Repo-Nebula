import { Router } from "express";
import { z } from "zod";
import { repositoryStore } from "../models/repositoryStore";
import { analyzeRepository } from "../services/analysisService";
import { getRepositoryById, ingestRepository } from "../services/repositoryService";

const submitRepositorySchema = z.object({
  repoUrl: z.string().url()
});

export const apiRouter = Router();

apiRouter.post("/repositories", async (req, res) => {
  const parseResult = submitRepositorySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ message: "Invalid request body", errors: parseResult.error.issues });
    return;
  }

  try {
    const repository = await ingestRepository(parseResult.data.repoUrl);
    res.status(201).json(repository);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Repository ingestion failed" });
  }
});

apiRouter.get("/repositories/:id", (req, res) => {
  try {
    const repository = getRepositoryById(req.params.id);
    res.json(repository);
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : "Repository not found" });
  }
});

apiRouter.post("/analyze/:id", async (req, res) => {
  try {
    const repository = getRepositoryById(req.params.id);
    const result = await analyzeRepository(repository);
    res.json({
      status: "completed",
      repositoryId: repository.id,
      nodes: result.graph.nodes.length,
      edges: result.graph.edges.length
    });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Analysis failed" });
  }
});

apiRouter.get("/graph/:id", (req, res) => {
  const analysis = repositoryStore.getAnalysisResult(req.params.id);
  if (!analysis) {
    res.status(404).json({ message: "Graph not found. Trigger analysis first." });
    return;
  }

  res.json(analysis.graph);
});

apiRouter.get("/insights/:id", (req, res) => {
  const analysis = repositoryStore.getAnalysisResult(req.params.id);
  if (!analysis) {
    res.status(404).json({ message: "Insights not found. Trigger analysis first." });
    return;
  }

  res.json(analysis.insights);
});

apiRouter.get("/summary/:id", (req, res) => {
  const analysis = repositoryStore.getAnalysisResult(req.params.id);
  if (!analysis) {
    res.status(404).json({ message: "Summary not found. Trigger analysis first." });
    return;
  }

  res.json({ summary: analysis.summary, analyzedAt: analysis.analyzedAt });
});
