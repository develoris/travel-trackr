import request from "supertest";
import session from "express-session";
import { createApp } from "../../src/app/create-app.js";
import { createUser } from "../../src/modules/user/user.service.js";
import {
  clearTestDatabase,
  startTestDatabase,
  stopTestDatabase
} from "../helpers/test-db.js";

let app;

const loginAndGetAccessToken = async (credentials) => {
  const response = await request(app)
    .post("/users/login")
    .send(credentials);

  expect(response.status).toBe(200);
  return response.body.accessToken;
};

beforeAll(async () => {
  const mongoUrl = await startTestDatabase("travel-trackr-user-auth-e2e");
  app = createApp({
    mongoUrl,
    isProduction: false,
    sessionStore: new session.MemoryStore()
  });
});

afterAll(async () => {
  await stopTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
});

test("API users: GET /users richiede autenticazione", async () => {
  const response = await request(app).get("/users");

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Token mancante");
});

test("API users: GET /users consente accesso solo agli admin", async () => {
  await createUser({
    email: "user.only@example.com",
    name: "Normal User",
    passwordHash: "Password123!",
    role: "user",
    mustChangePassword: false
  });

  const accessToken = await loginAndGetAccessToken({
    email: "user.only@example.com",
    password: "Password123!"
  });

  const response = await request(app)
    .get("/users")
    .set("Authorization", `Bearer ${accessToken}`);

  expect(response.status).toBe(403);
  expect(response.body.message).toBe("Non autorizzato");
});

test("API users: GET /users permette accesso a un admin autenticato", async () => {
  await createUser({
    email: "admin.only@example.com",
    name: "Admin User",
    passwordHash: "Password123!",
    role: "admin",
    mustChangePassword: false
  });

  const accessToken = await loginAndGetAccessToken({
    email: "admin.only@example.com",
    password: "Password123!"
  });

  const response = await request(app)
    .get("/users")
    .set("Authorization", `Bearer ${accessToken}`);

  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body).toHaveLength(1);
  expect(response.body[0].email).toBe("admin.only@example.com");
});