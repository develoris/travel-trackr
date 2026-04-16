import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

const source = resolve(projectRoot, "src", "views");
const destination = resolve(projectRoot, "dist", "src", "views");

if (!existsSync(source)) {
  console.warn(`[copy-views] Source not found: ${source}`);
  process.exit(0);
}

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true, force: true });

console.log(`[copy-views] Copied views from ${source} to ${destination}`);
