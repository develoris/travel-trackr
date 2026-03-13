import { Router } from "express";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";

const openApiYamlPath = resolve(process.cwd(), "docs/openapi/travel-trackr.openapi.yaml");

const loadOpenApiSpec = () => {
  if (!existsSync(openApiYamlPath)) {
    throw new Error(`OpenAPI file not found at ${openApiYamlPath}`);
  }

  const source = readFileSync(openApiYamlPath, "utf8");
  return yaml.load(source);
};

export const createOpenApiRouter = () => {
  const router = Router();
  const spec = loadOpenApiSpec();

  // Swagger UI leggibile per API REST (esclude EJS by design nella spec esterna).
  router.use("/", swaggerUi.serve, swaggerUi.setup(spec, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  // Esposizione raw YAML per integrazioni esterne.
  router.get("/openapi.yaml", (_req, res) => {
    res.type("text/yaml").send(readFileSync(openApiYamlPath, "utf8"));
  });

  // Esposizione JSON derivato dal YAML, senza duplicare manutenzione.
  router.get("/openapi.json", (_req, res) => {
    res.json(spec);
  });

  return router;
};
