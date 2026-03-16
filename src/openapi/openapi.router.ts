import { Router } from "express";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";

const openApiYamlPath = resolve(
  process.cwd(),
  "docs/openapi/travel-trackr.openapi.yaml"
);

const loadOpenApiSpec = (): object => {
  if (!existsSync(openApiYamlPath)) {
    throw new Error(`OpenAPI file not found at ${openApiYamlPath}`);
  }

  const source = readFileSync(openApiYamlPath, "utf8");
  return yaml.load(source) as object;
};

export const createOpenApiRouter = (): Router => {
  const router = Router();
  const spec = loadOpenApiSpec();

  router.use(
    "/",
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true
      }
    })
  );

  router.get("/openapi.yaml", (_req, res) => {
    res.type("text/yaml").send(readFileSync(openApiYamlPath, "utf8"));
  });

  router.get("/openapi.json", (_req, res) => {
    res.json(spec);
  });

  return router;
};
