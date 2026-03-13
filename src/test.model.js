// models.ts
import mongoose from "mongoose";
const { Schema, model } = mongoose;

/* ------------------------- User ------------------------- */
const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    name: String
}, { timestamps: true });

export const User = model("User", UserSchema);

// un viaggio potrebbe avere piu tappe
// esempio se è un escursione è solo una
// se p un trekking è di più giorni
// le tappe potrebbero avere sotto tappe, ad esempio un viaggio nel nord italia potrebbe avere una tappa a milano, con sotto tappe a duomo, castello, etc
// le tappe potrebbero avere spese, media, etc
// un viaggio potrebbe essere associato a più tappe, ad esempio un viaggio in italia potrebbe avere una tappa a milano, una a roma, etc
// ok AI, genera i modelli per me
/* ------------------------- Trip ------------------------- */
const TripSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    startDate: Date,
    endDate: Date,
    type: { type: String, enum: ["escursione", "trekking", "viaggio"], required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stages: [{ type: Schema.Types.ObjectId, ref: "Stage" }], // un viaggio può avere più tappe
    note: String
}, { timestamps: true });

export const Trip = model("Trip", TripSchema);

/* ------------------------- Stage ------------------------- */
// una tappa potrebbe essere una citta che a sua volta potrebbe avere sotto tappe, ad esempio una tappa a milano potrebbe avere sotto tappe a duomo, castello, etc
const StageSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    location: String,
    date: Date,
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    parentStage: { type: Schema.Types.ObjectId, ref: "Stage", default: null }, // per le sotto tappe
    expenses: [{ type: Schema.Types.ObjectId, ref: "Expense" }], // una tappa può avere più spese
    note: String
}, { timestamps: true });

export const Stage = model("Stage", StageSchema);

/* ------------------------- Expense ------------------------- */
const ExpenseSchema = new Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    date: Date,
    stage: { type: Schema.Types.ObjectId, ref: "Stage", required: true },
    note: String
}, { timestamps: true });

export const Expense = model("Expense", ExpenseSchema);