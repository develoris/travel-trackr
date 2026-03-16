import mongoose, { Schema, model, Types } from "mongoose";
import type {
  ExpenseDocument,
  IExpense,
  IStage,
  IStageTechnical,
  ITrip,
  ITripMethods,
  ITripStats,
  ITripVirtuals,
  StageDocument,
  TripDocument,
  TripModelType
} from "./travel.types.js";

// Normalizza una data a mezzanotte (00:00:00) per confronti "solo giorno".
const startOfDay = (value: Date | string): Date | null => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

// Calcola il numero di giorno dell'attività rispetto alla data di inizio del viaggio.
const inferDayNumber = (
  tripStartDate: Date | undefined,
  stageStartAt: Date | undefined
): number | null => {
  if (!tripStartDate || !stageStartAt) {
    return null;
  }

  const tripStart = startOfDay(tripStartDate);
  const stageDay = startOfDay(stageStartAt);

  if (!tripStart || !stageDay) {
    return null;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor(
    (stageDay.getTime() - tripStart.getTime()) / millisecondsPerDay
  );

  return diff >= 0 ? diff + 1 : 1;
};

// Schema per una singola voce di spesa associata a un'attività.
const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      default: "EUR",
      uppercase: true,
      trim: true,
      maxlength: 3
    },
    category: {
      type: String,
      enum: ["trasporto", "alloggio", "cibo", "attivita", "attrezzatura", "altro"],
      default: "altro"
    },
    paidAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true, maxlength: 500 }
  },
  { _id: true, timestamps: true }
);

// Dati tecnici opzionali per attività outdoor (trekking, bikepack, ecc.).
const StageTechnicalSchema = new Schema<IStageTechnical>(
  {
    distanceKm: { type: Number, min: 0, default: null },
    elevationGainM: { type: Number, min: 0, default: null },
    movingTimeMin: { type: Number, min: 0, default: null },
    difficulty: {
      type: String,
      enum: ["facile", "media", "impegnativa", "esperto"],
      default: null
    },
    terrain: {
      type: String,
      enum: ["asfalto", "sterrato", "sentiero", "misto"],
      default: null
    },
    gpxUrl: { type: String, trim: true, maxlength: 500, default: null }
  },
  { _id: false }
);

const StageSchema = new Schema<IStage>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    location: { type: String, trim: true, maxlength: 120 },
    dayNumber: { type: Number, min: 1, default: null },
    sequence: { type: Number, min: 1, default: 1 },
    startAt: { type: Date },
    endAt: { type: Date },
    activityType: {
      type: String,
      enum: ["trek", "visita", "trasferimento", "food", "relax", "outdoor", "altro"],
      default: "altro"
    },
    // Backward-compatibility con dati seed/versioni precedenti.
    kind: { type: String, default: null },
    parentStageId: { type: Schema.Types.ObjectId, default: null },
    media: [{ type: String, trim: true, maxlength: 500 }],
    notes: { type: String, trim: true, maxlength: 1000 },
    technical: { type: StageTechnicalSchema, default: () => ({}) },
    expenses: [ExpenseSchema]
  },
  { _id: true, timestamps: true }
);

const TripSchema = new Schema<ITrip, TripModelType, ITripMethods & ITripVirtuals>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 2000 },
    category: {
      type: String,
      enum: ["escursione", "trekking", "visita", "vacanza", "roadtrip", "altro"],
      default: "altro"
    },
    status: {
      type: String,
      enum: ["planned", "ongoing", "completed", "cancelled"],
      default: "planned"
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isMultiDay: { type: Boolean, default: false },
    locationSummary: { type: String, trim: true, maxlength: 180 },
    notes: { type: String, trim: true, maxlength: 2000 },
    stages: [StageSchema]
  },
  { timestamps: true }
);

// Se endDate non viene fornita, la imposta uguale a startDate (viaggio di un giorno).
TripSchema.pre("validate", function preValidate(this: TripDocument) {
  if (!this.endDate) {
    this.endDate = this.startDate;
  }

  this.isMultiDay = Boolean(
    this.startDate && this.endDate && this.endDate > this.startDate
  );
});

// Virtual calcolato al volo: non viene salvato su DB.
TripSchema.virtual("stats").get(function getStats(this: TripDocument): ITripStats {
  let totalSpent = 0;
  let expensesCount = 0;
  const dayNumbers = new Set<number>();

  for (const stage of this.stages || []) {
    const explicitDay = stage.dayNumber ? Number(stage.dayNumber) : null;
    const inferredDay = inferDayNumber(this.startDate, stage.startAt);
    const timelineDay = explicitDay || inferredDay || null;

    if (timelineDay) {
      dayNumbers.add(timelineDay);
    }

    for (const expense of stage.expenses || []) {
      totalSpent += Number(expense.amount || 0);
      expensesCount += 1;
    }
  }

  return {
    daysCount: dayNumbers.size,
    activitiesCount: (this.stages || []).length,
    stagesCount: (this.stages || []).length,
    expensesCount,
    totalSpent: Number(totalSpent.toFixed(2))
  };
});

TripSchema.set("toJSON", {
  virtuals: true
});

// Helper per trovare un'attività embedded per id senza query aggiuntive.
TripSchema.methods.findStageById = function findStageById(
  this: TripDocument,
  stageId: Types.ObjectId | string | null | undefined
): StageDocument | null {
  if (!stageId) {
    return null;
  }

  const id =
    stageId instanceof Types.ObjectId
      ? stageId.toString()
      : String(stageId);
  return (
    (this.stages || []).find((stage) => String(stage._id) === id) || null
  );
};

export const Trip = model<ITrip, TripModelType>("Trip", TripSchema);
