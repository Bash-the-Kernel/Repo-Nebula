import fs from "fs-extra";
import path from "path";
import simpleGit from "simple-git";
import { v4 as uuidv4 } from "uuid";
import { RepositoryRecord, repositoryStore } from "../models/repositoryStore";

const REPOSITORY_ROOT = path.resolve(process.cwd(), "storage", "repos");

function isValidGithubUrl(repoUrl: string): boolean {
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/i.test(repoUrl.trim());
}

function extractRepositoryName(repoUrl: string): string {
  const cleanUrl = repoUrl.replace(/\.git$/i, "");
  return cleanUrl.split("/").slice(-2).join("/");
}

export async function ingestRepository(repoUrl: string): Promise<RepositoryRecord> {
  if (!isValidGithubUrl(repoUrl)) {
    throw new Error("Only valid GitHub repository URLs are supported in this version.");
  }

  const repositoryId = uuidv4();
  const localPath = path.join(REPOSITORY_ROOT, repositoryId);

  await fs.ensureDir(REPOSITORY_ROOT);
  await fs.remove(localPath);

  const git = simpleGit();
  await git.clone(repoUrl, localPath, ["--depth", "1"]);

  const now = new Date().toISOString();
  const record: RepositoryRecord = {
    id: repositoryId,
    repoUrl,
    name: extractRepositoryName(repoUrl),
    localPath,
    status: "ingested",
    createdAt: now,
    updatedAt: now
  };

  return repositoryStore.upsertRepository(record);
}

export function getRepositoryById(repositoryId: string): RepositoryRecord {
  const record = repositoryStore.getRepository(repositoryId);
  if (!record) {
    throw new Error("Repository not found.");
  }
  return record;
}
