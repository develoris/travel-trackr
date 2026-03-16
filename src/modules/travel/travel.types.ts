import type { Document, HydratedDocument, Model, Types } from "mongoose";

export type TripCategory =
  | "escursione"
  | "trekking"
  | "visita"
  | "vacanza"
  | "roadtrip"
  | "altro";

export type TripStatus = "planned" | "ongoing" | "completed" | "cancelled";

export type StageActivityType =
  | "trek"
  | "visita"
  | "trasferimento"
  | "food"
  | "relax"
  | "outdoor"
  | "altro";

export type ExpenseCategory =
  | "trasporto"
  | "alloggio"
  | "cibo"
  | "attivita"
  | "attrezzatura"
  | "altro";

export type StageDifficulty = "facile" | "media" | "impegnativa" | "esperto";

export type StageTerrain = "asfalto" | "sterrato" | "sentiero" | "misto";

export interface IExpense {
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidAt: Date;
  notes?: string;
}

export interface IStageTechnical {
  distanceKm: number | null;
  elevationGainM: number | null;
  movingTimeMin: number | null;
  difficulty: StageDifficulty | null;
  terrain: StageTerrain | null;
  gpxUrl: string | null;
}

export interface IStage {
  title: string;
  description?: string;
  location?: string;
  dayNumber: number | null;
  sequence: number;
  startAt?: Date;
  endAt?: Date;
  activityType: StageActivityType;
  kind?: string | null;
  parentStageId?: Types.ObjectId | null;
  media: string[];
  notes?: string;
  technical?: IStageTechnical;
  expenses: Types.DocumentArray<ExpenseDocument>;
}

export type ExpenseDocument = Document<Types.ObjectId, Record<string, never>, IExpense> &
  IExpense & { _id: Types.ObjectId };

export type StageDocument = Document<Types.ObjectId, Record<string, never>, IStage> &
  IStage & {
    _id: Types.ObjectId;
    expenses: Types.DocumentArray<ExpenseDocument>;
  };

export interface ITripStats {
  daysCount: number;
  activitiesCount: number;
  stagesCount: number;
  expensesCount: number;
  totalSpent: number;
}

export interface ITrip {
  owner: Types.ObjectId;
  title: string;
  description?: string;
  category: TripCategory;
  status: TripStatus;
  startDate: Date;
  endDate?: Date;
  isMultiDay: boolean;
  locationSummary?: string;
  notes?: string;
  stages: Types.DocumentArray<StageDocument>;
}

export interface ITripMethods {
  findStageById(stageId: Types.ObjectId | string | null | undefined): StageDocument | null;
}

export interface ITripVirtuals {
  stats: ITripStats;
}

export type TripDocument = HydratedDocument<ITrip, ITripMethods & ITripVirtuals>;

export type TripModelType = Model<ITrip, Record<string, never>, ITripMethods & ITripVirtuals>;

export type StagePayload = Record<string, unknown> & {
  technical?: Record<string, unknown>;
};

export type TripPayload = Record<string, unknown>;

export interface TripPage {
  items: TripDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TripFilters {
  status?: string;
  category?: string;
  page?: number | string;
  limit?: number | string;
  sort?: string;
}

export interface StageResult {
  trip: TripDocument;
  stage: StageDocument;
}

export interface StageUpdateResult {
  trip: TripDocument | null;
  stage: StageDocument | null;
}

export interface ExpenseResult {
  trip: TripDocument | null;
  stage: StageDocument | null;
  expense: ExpenseDocument | null;
}
