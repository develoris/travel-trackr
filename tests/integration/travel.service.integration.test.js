import mongoose from "mongoose";
import {
  addStageToTrip,
  createTripForOwner,
  deleteStageFromTrip,
  getTripByIdForOwner
} from "../../src/modules/travel/travel.service.js";
import {
  clearTestDatabase,
  startTestDatabase,
  stopTestDatabase
} from "../helpers/test-db.js";

beforeAll(async () => {
  await startTestDatabase("travel-trackr-integration");
});

afterAll(async () => {
  await stopTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
});

test("deleteStageFromTrip elimina stage e ricalcola sequence nel giorno", async () => {
  const ownerId = new mongoose.Types.ObjectId();

  const trip = await createTripForOwner(ownerId, {
    title: "Trekking test",
    startDate: "2026-04-01",
    endDate: "2026-04-03"
  });

  await addStageToTrip(trip._id, ownerId, {
    title: "Prima",
    dayNumber: 1,
    startTime: "08:00"
  });
  await addStageToTrip(trip._id, ownerId, {
    title: "Seconda",
    dayNumber: 1,
    startTime: "10:00"
  });
  await addStageToTrip(trip._id, ownerId, {
    title: "Terza",
    dayNumber: 1,
    startTime: "12:00"
  });

  const afterInsert = await getTripByIdForOwner(trip._id, ownerId);
  const middleStageId = afterInsert.stages.find((stage) => stage.title === "Seconda")._id;

  const result = await deleteStageFromTrip(trip._id, middleStageId, ownerId);

  expect(result.trip).toBeTruthy();
  expect(result.stage).toBeTruthy();
  expect(result.stage.title).toBe("Seconda");

  const reloadedTrip = await getTripByIdForOwner(trip._id, ownerId);
  expect(reloadedTrip.stages.length).toBe(2);

  const sameDayStages = reloadedTrip.stages
    .filter((stage) => Number(stage.dayNumber) === 1)
    .sort((a, b) => Number(a.sequence) - Number(b.sequence));

  expect(sameDayStages.map((stage) => stage.title)).toEqual(["Prima", "Terza"]);
  expect(sameDayStages.map((stage) => Number(stage.sequence))).toEqual([1, 2]);
});

test("deleteStageFromTrip ritorna stage null se stageId non esiste", async () => {
  const ownerId = new mongoose.Types.ObjectId();

  const trip = await createTripForOwner(ownerId, {
    title: "Trip senza stage",
    startDate: "2026-04-01"
  });

  const result = await deleteStageFromTrip(
    trip._id,
    new mongoose.Types.ObjectId(),
    ownerId
  );

  expect(result.trip).toBeTruthy();
  expect(result.stage).toBeNull();
});
