import { Router } from "express";
import fs from "fs-extra";
import path from "path";
import multer from "multer";
import type { GraphEdgeType, GraphNodeType } from "@repo-nebula/shared";
import { z } from "zod";
import { queryGraph } from "../analysis/graphQuery";
import { repositoryStore } from "../models/repositoryStore";
import { analyzeRepository } from "../services/analysisService";
import { getRepositoryById, ingestRepository, ingestRepositoryZip } from "../services/repositoryService";

const submitRepositorySchema = z.object({
  repoUrl: z.string().url()
});

export const apiRouter = Router();

const uploadRoot = path.resolve(process.cwd(), "storage", "tmp");
const upload = multer({ dest: uploadRoot });

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

apiRouter.post("/repositories/upload", upload.single("repoZip"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "Missing zip file. Use form field 'repoZip'." });
    return;
  }

  try {
    const repository = await ingestRepositoryZip(req.file.path, req.file.originalname);
    res.status(201).json(repository);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "ZIP ingestion failed" });
  } finally {
    await fs.remove(req.file.path);
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

  const nodeTypes = typeof req.query.nodeTypes === "string" ? (req.query.nodeTypes.split(",") as GraphNodeType[]) : undefined;
  const edgeTypes = typeof req.query.edgeTypes === "string" ? (req.query.edgeTypes.split(",") as GraphEdgeType[]) : undefined;
  const depth = typeof req.query.depth === "string" ? Number(req.query.depth) : undefined;
  const maxNodes = typeof req.query.maxNodes === "string" ? Number(req.query.maxNodes) : undefined;
  const focusNodeId = typeof req.query.focusNodeId === "string" ? req.query.focusNodeId : undefined;

  const filtered = queryGraph(analysis.graph, {
    nodeTypes,
    edgeTypes,
    maxDepth: Number.isFinite(depth) ? depth : undefined,
    maxNodes: Number.isFinite(maxNodes) ? maxNodes : undefined,
    focusNodeId
  });

  res.json(filtered);
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
