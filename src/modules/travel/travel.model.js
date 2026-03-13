import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const startOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const inferDayNumber = (tripStartDate, stageStartAt) => {
  if (!tripStartDate || !stageStartAt) {
    return null;
  }

  const tripStart = startOfDay(tripStartDate);
  const stageDay = startOfDay(stageStartAt);

  if (!tripStart || !stageDay) {
    return null;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((stageDay.getTime() - tripStart.getTime()) / millisecondsPerDay);

  return diff >= 0 ? diff + 1 : 1;
};

const ExpenseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "EUR", uppercase: true, trim: true, maxlength: 3 },
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

const StageSchema = new Schema(
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
    expenses: [ExpenseSchema]
  },
  { _id: true, timestamps: true }
);

const TripSchema = new Schema(
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

TripSchema.pre("validate", function preValidate() {
  if (!this.endDate) {
    this.endDate = this.startDate;
  }

  this.isMultiDay = Boolean(this.startDate && this.endDate && this.endDate > this.startDate);
});

TripSchema.virtual("stats").get(function getStats() {
  let totalSpent = 0;
  let expensesCount = 0;
  const dayNumbers = new Set();

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

TripSchema.methods.findStageById = function findStageById(stageId) {
  if (!stageId) {
    return null;
  }

  const id = stageId instanceof Types.ObjectId ? stageId.toString() : String(stageId);
  return (this.stages || []).find((stage) => String(stage._id) === id) || null;
};

export const Trip = model("Trip", TripSchema);
