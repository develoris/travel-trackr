import mongoose from "mongoose";
import { Trip } from "../../src/modules/travel/travel.model.js";

const ownerId = () => new mongoose.Types.ObjectId();

test("Trip stats conta giorni/attivita/spese in modo coerente", () => {
  const trip = new Trip({
    owner: ownerId(),
    title: "Test trip",
    startDate: new Date("2026-03-10T00:00:00.000Z"),
    endDate: new Date("2026-03-12T00:00:00.000Z"),
    stages: [
      {
        title: "Stage 1",
        dayNumber: 1,
        expenses: [{ title: "Bus", amount: 10 }]
      },
      {
        title: "Stage 2",
        dayNumber: 2,
        expenses: [
          { title: "Pranzo", amount: 12.5 },
          { title: "Museo", amount: 8 }
        ]
      }
    ]
  });

  const stats = trip.stats;

  expect(stats.daysCount).toBe(2);
  expect(stats.activitiesCount).toBe(2);
  expect(stats.expensesCount).toBe(3);
  expect(stats.totalSpent).toBe(30.5);
});

test("Trip.findStageById trova la stage embedded per id", () => {
  const trip = new Trip({
    owner: ownerId(),
    title: "Lookup trip",
    startDate: new Date("2026-03-10T00:00:00.000Z"),
    stages: [{ title: "Unica stage", dayNumber: 1 }]
  });

  const stageId = trip.stages[0]._id;
  const found = trip.findStageById(stageId);

  expect(found).toBeTruthy();
  expect(String(found!._id)).toBe(String(stageId));
  expect(found!.title).toBe("Unica stage");
});
