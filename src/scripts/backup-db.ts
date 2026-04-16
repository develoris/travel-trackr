import "dotenv/config";
import { mkdir, readdir, rm, writeFile } from "fs/promises";
import { resolve, join } from "path";
import { MongoClient } from "mongodb";

const DEFAULT_URI = "mongodb://127.0.0.1:27017/travel-trackr";
const DEFAULT_OUTPUT_DIR = "./backups";
const DEFAULT_RETENTION_COUNT = 7;

interface BackupResult {
  collection: string;
  documents: number;
  filePath: string;
}

interface BackupMetadata {
  startedAt: string;
  finishedAt: string;
  uri: string;
  dbName: string;
  outputDir: string;
  collections: BackupResult[];
}

interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const parseRetentionCount = (value?: string): number => {
  if (!value?.trim()) return DEFAULT_RETENTION_COUNT;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_RETENTION_COUNT;
  return parsed;
};

const getDbNameFromUri = (uri: string): string => {
  try {
    const url = new URL(uri);
    const dbName = (url.pathname || "").replace(/^\//, "").trim();
    return dbName || "travel-trackr";
  } catch {
    return "travel-trackr";
  }
};

const buildBackupFolderName = (date = new Date()): string => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
};

interface RunMongoBackupOptions {
  uri?: string;
  dbName?: string;
  outputDir?: string;
  retentionCount?: number;
  logger?: Logger;
}

const applyBackupRetention = async ({
  rootDir,
  retentionCount,
  logger
}: {
  rootDir: string;
  retentionCount: number;
  logger: Logger;
}): Promise<void> => {
  if (retentionCount <= 0) return;

  const dirEntries = await readdir(rootDir, { withFileTypes: true });
  const backupFolders = dirEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  const foldersToDelete = backupFolders.slice(retentionCount);

  for (const folderName of foldersToDelete) {
    await rm(join(rootDir, folderName), { recursive: true, force: true });
    logger.log(`[backup] Retention removed old backup: ${folderName}`);
  }
};

export const runMongoBackup = async ({
  uri = process.env.MONGODB_URI || DEFAULT_URI,
  dbName =
    process.env.BACKUP_DB_NAME ||
    getDbNameFromUri(process.env.MONGODB_URI || DEFAULT_URI),
  outputDir = process.env.BACKUP_OUTPUT_DIR || DEFAULT_OUTPUT_DIR,
  retentionCount = parseRetentionCount(process.env.DB_BACKUP_RETENTION_COUNT),
  logger = console
}: RunMongoBackupOptions = {}): Promise<BackupMetadata> => {
  const startedAt = new Date();
  const folderName = buildBackupFolderName(startedAt);
  const rootDir = resolve(outputDir);
  const backupDir = join(rootDir, folderName);

  await mkdir(backupDir, { recursive: true });

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collections = await db
      .listCollections({}, { nameOnly: true })
      .toArray();

    const results: BackupResult[] = [];

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const docs = await db.collection(collectionName).find({}).toArray();
      const filePath = join(backupDir, `${collectionName}.json`);
      await writeFile(filePath, JSON.stringify(docs, null, 2), "utf8");
      results.push({ collection: collectionName, documents: docs.length, filePath });
    }

    const metadata: BackupMetadata = {
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      uri,
      dbName,
      outputDir: backupDir,
      collections: results
    };

    await writeFile(
      join(backupDir, "metadata.json"),
      JSON.stringify(metadata, null, 2),
      "utf8"
    );

    await applyBackupRetention({ rootDir, retentionCount, logger });

    logger.log(
      `[backup] Completed: ${results.length} collections in ${backupDir}`
    );
    return metadata;
  } finally {
    await client.close();
  }
};

if (process.argv[1] && process.argv[1].endsWith("backup-db.js")) {
  runMongoBackup().catch((error) => {
    console.error("[backup] Failed:", error);
    process.exit(1);
  });
}
