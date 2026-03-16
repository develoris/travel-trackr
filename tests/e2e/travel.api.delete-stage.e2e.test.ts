import request from "supertest";
import session from "express-session";
import { createApp } from "../../src/app/create-app.js";
import { createUser } from "../../src/modules/user/user.service.js";
import { Trip } from "../../src/modules/travel/travel.model.js";
import {
  addStageToTrip,
  createTripForOwner
} from "../../src/modules/travel/travel.service.js";
import {
  clearTestDatabase,
  startTestDatabase,
  stopTestDatabase
} from "../helpers/test-db.js";

let app: ReturnType<typeof createApp>;

const loginAndGetAccessToken = async (credentials: {
  email: string;
  password: string;
}): Promise<string> => {
  const response = await request(app)
    .post("/users/login")
    .send(credentials);

  expect(response.status).toBe(200);
  expect(response.body.accessToken).toBeTruthy();

  return response.body.accessToken as string;
};

beforeAll(async () => {
  const mongoUrl = await startTestDatabase("travel-trackr-api-e2e");
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

test("API REST: delete stage elimina la stage del proprietario", async () => {
  const user = await createUser({
    email: "api.delete.stage@example.com",
    name: "API Delete Stage",
    passwordHash: "Password123!",
    role: "user",
    mustChangePassword: false
  });

  const trip = await createTripForOwner(user._id, {
    title: "Trip API",
    startDate: "2026-06-10",
    endDate: "2026-06-11"
  });

  await addStageToTrip(trip._id, user._id, {
    title: "Stage API da eliminare",
    dayNumber: 1,
    startTime: "08:30",
    activityType: "visita"
  });

  const tripWithStage = await Trip.findById(trip._id);
  const stageId = tripWithStage!.stages[0]._id;

  const accessToken = await loginAndGetAccessToken({
    email: user.email,
    password: "Password123!"
  });

  const response = await request(app)
    .delete(`/users/travels/${trip._id}/stages/${stageId}`)
    .set("Authorization", `Bearer ${accessToken}`);

  expect(response.status).toBe(204);

  const reloadedTrip = await Trip.findById(trip._id);
  expect(reloadedTrip!.stages).toHaveLength(0);
});

test("API REST: delete stage non permette di toccare viaggi di un altro owner", async () => {
  const owner = await createUser({
    email: "api.owner@example.com",
    name: "Owner",
    passwordHash: "Password123!",
    role: "user",
    mustChangePassword: false
  });
  const attacker = await createUser({
    email: "api.attacker@example.com",
    name: "Attacker",
    passwordHash: "Password123!",
    role: "user",
    mustChangePassword: false
  });

  const trip = await createTripForOwner(owner._id, {
    title: "Trip Owner",
    startDate: "2026-06-10"
  });

  await addStageToTrip(trip._id, owner._id, {
    title: "Stage protetta",
    dayNumber: 1,
    startTime: "10:00"
  });

  const tripWithStage = await Trip.findById(trip._id);
  const stageId = tripWithStage!.stages[0]._id;

  const accessToken = await loginAndGetAccessToken({
    email: attacker.email,
    password: "Password123!"
  });

  const response = await request(app)
    .delete(`/users/travels/${trip._id}/stages/${stageId}`)
    .set("Authorization", `Bearer ${accessToken}`);

  expect(response.status).toBe(404);
  expect(response.body.error.code).toBe("TRIP_NOT_FOUND");

  const reloadedTrip = await Trip.findById(trip._id);
  expect(reloadedTrip!.stages).toHaveLength(1);
});
