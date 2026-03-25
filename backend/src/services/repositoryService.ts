import fs from "fs-extra";
import path from "path";
import simpleGit from "simple-git";
import AdmZip from "adm-zip";
import { v4 as uuidv4 } from "uuid";
import { RepositoryRecord, RepositorySourceType, repositoryStore } from "../models/repositoryStore";

const REPOSITORY_ROOT = path.resolve(process.cwd(), "storage", "repos");

function detectSourceType(repoUrl: string): RepositorySourceType {
  if (/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/i.test(repoUrl.trim())) {
    return "github";
  }

  if (/^https:\/\/gitlab\.com\/[\w./-]+(\.git)?$/i.test(repoUrl.trim())) {
    return "gitlab";
  }

  throw new Error("Only valid GitHub or GitLab repository URLs are supported.");
}

function extractRepositoryName(repoUrl: string): string {
  const cleanUrl = repoUrl.replace(/\.git$/i, "");
  return cleanUrl.split("/").slice(-2).join("/");
}

export async function ingestRepository(repoUrl: string): Promise<RepositoryRecord> {
  const sourceType = detectSourceType(repoUrl);

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
    sourceType,
    name: extractRepositoryName(repoUrl),
    localPath,
    detectedLanguages: [],
    status: "ingested",
    createdAt: now,
    updatedAt: now
  };

  return repositoryStore.upsertRepository(record);
}

export async function ingestRepositoryZip(zipFilePath: string, originalFileName: string): Promise<RepositoryRecord> {
  const repositoryId = uuidv4();
  const localPath = path.join(REPOSITORY_ROOT, repositoryId);

  await fs.ensureDir(REPOSITORY_ROOT);
  await fs.remove(localPath);
  await fs.ensureDir(localPath);

  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(localPath, true);

  const entries = await fs.readdir(localPath);
  if (entries.length === 1) {
    const nested = path.join(localPath, entries[0]);
    const stats = await fs.stat(nested);
    if (stats.isDirectory()) {
      for (const child of await fs.readdir(nested)) {
        await fs.move(path.join(nested, child), path.join(localPath, child), { overwrite: true });
      }
      await fs.remove(nested);
    }
  }

  const now = new Date().toISOString();
  const record: RepositoryRecord = {
    id: repositoryId,
    repoUrl: "zip://local-upload",
    sourceType: "zip",
    name: originalFileName.replace(/\.zip$/i, ""),
    localPath,
    detectedLanguages: [],
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
