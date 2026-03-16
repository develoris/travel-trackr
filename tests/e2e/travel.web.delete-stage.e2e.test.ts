import request from "supertest";
import session from "express-session";
import { createApp } from "../../src/app/create-app.js";
import { createUser } from "../../src/modules/user/user.service.js";
import { Trip } from "../../src/modules/travel/travel.model.js";
import {
  clearTestDatabase,
  startTestDatabase,
  stopTestDatabase
} from "../helpers/test-db.js";

let app: ReturnType<typeof createApp>;
let agent: ReturnType<typeof request.agent>;
let sessionStore: session.MemoryStore;

beforeAll(async () => {
  const mongoUrl = await startTestDatabase("travel-trackr-e2e");
  sessionStore = new session.MemoryStore();
  app = createApp({
    mongoUrl,
    isProduction: false,
    sessionStore
  });
  agent = request.agent(app);
});

afterAll(async () => {
  await stopTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  agent = request.agent(app);
});

test("E2E web: login, crea stage, elimina stage", async () => {
  const user = await createUser({
    email: "e2e.user@example.com",
    name: "E2E User",
    passwordHash: "Password123!",
    role: "user",
    mustChangePassword: false
  });

  const loginResponse = await agent
    .post("/users/app/login")
    .type("form")
    .redirects(0)
    .send({
      email: user.email,
      password: "Password123!"
    });

  expect(loginResponse.status).toBe(302);

  const createTripResponse = await agent
    .post("/users/app/travels")
    .type("form")
    .redirects(0)
    .send({
      title: "Trip E2E",
      category: "vacanza",
      status: "planned",
      startDate: "2026-06-10",
      endDate: "2026-06-11",
      locationSummary: "Roma"
    });

  expect(createTripResponse.status).toBe(302);

  const trip = await Trip.findOne({ owner: user._id }).sort({ createdAt: -1 });
  expect(trip).toBeTruthy();

  const addStageResponse = await agent
    .post(`/users/app/travels/${trip!._id}/stages`)
    .type("form")
    .redirects(0)
    .send({
      title: "Stage da cancellare",
      dayMode: "new",
      startTime: "09:00",
      activityType: "visita"
    });

  expect(addStageResponse.status).toBe(302);

  const tripWithStage = await Trip.findById(trip!._id);
  expect(tripWithStage!.stages.length).toBe(1);

  const stageId = tripWithStage!.stages[0]._id;

  const deleteStageResponse = await agent
    .post(`/users/app/travels/${trip!._id}/stages/${stageId}/delete`)
    .type("form")
    .redirects(0)
    .send({});

  expect(deleteStageResponse.status).toBe(302);
  expect(deleteStageResponse.headers.location).toBe(
    `/users/app/travels/${trip!._id}`
  );

  const reloadedTrip = await Trip.findById(trip!._id);
  expect(reloadedTrip!.stages.length).toBe(0);
});
