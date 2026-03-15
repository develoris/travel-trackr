import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import yaml from "js-yaml";

const yamlPath = resolve(process.cwd(), "docs/openapi/travel-trackr.openapi.yaml");
const jsonPath = resolve(process.cwd(), "docs/openapi/travel-trackr.openapi.json");

const run = async () => {
  const yamlSource = await readFile(yamlPath, "utf8");
  const parsed = yaml.load(yamlSource);

  await writeFile(jsonPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  console.log(`[openapi] JSON exported to ${jsonPath}`);
};

run().catch((error) => {
  console.error("[openapi] Export failed", error);
  process.exit(1);
});
