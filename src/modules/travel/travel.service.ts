import { Trip } from "./travel.model.js";
import type * as T from "./travel.types.js";
import type { Types } from "mongoose";

const normalizeDate = (value: string | Date | null | undefined): Date | null =>
  value ? new Date(value) : null;

const toNumberOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toStringOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const pickTechnicalValue = (payload: T.StagePayload, key: string): unknown => {
  if (payload.technical && (payload.technical as Record<string, unknown>)[key] !== undefined) {
    return (payload.technical as Record<string, unknown>)[key];
  }

  const dottedKey = `technical.${key}`;
  return payload[dottedKey];
};

const parseTechnicalPayload = (
  payload: T.StagePayload
): {
  distanceKm: number | null;
  elevationGainM: number | null;
  movingTimeMin: number | null;
  difficulty: T.StageDifficulty | null;
  terrain: T.StageTerrain | null;
  gpxUrl: string | null;
} | null => {
  const distanceKm = toNumberOrNull(pickTechnicalValue(payload, "distanceKm"));
  const elevationGainM = toNumberOrNull(
    pickTechnicalValue(payload, "elevationGainM")
  );
  const movingTimeMin = toNumberOrNull(
    pickTechnicalValue(payload, "movingTimeMin")
  );
  const difficulty = toStringOrNull(pickTechnicalValue(payload, "difficulty")) as T.StageDifficulty | null;
  const terrain = toStringOrNull(pickTechnicalValue(payload, "terrain")) as T.StageTerrain | null;
  const gpxUrl = toStringOrNull(pickTechnicalValue(payload, "gpxUrl"));

  if (
    distanceKm === null &&
    elevationGainM === null &&
    movingTimeMin === null &&
    !difficulty &&
    !terrain &&
    !gpxUrl
  ) {
    return null;
  }

  return { distanceKm, elevationGainM, movingTimeMin, difficulty, terrain, gpxUrl };
};

const startOfDay = (value: Date | string): Date | null => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const deriveDayNumber = (
  tripStartDate: Date | undefined,
  stageStartAt: Date | null | undefined
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

const getDayNumberFromPayload = (payload: T.StagePayload): number | null => {
  const direct = toNumberOrNull(payload.dayNumber);
  const existingDay = toNumberOrNull(payload.existingDayNumber);
  const newDay = toNumberOrNull(payload.newDayNumber);

  return direct || existingDay || newDay || null;
};

const getNextDayNumber = (trip: T.TripDocument): number => {
  const maxDay = (trip.stages || []).reduce((max, stage) => {
    const day = Number(stage.dayNumber || 0);
    return day > max ? day : max;
  }, 0);

  return maxDay + 1;
};

const buildStartAtFromDayAndTime = (
  tripStartDate: Date | undefined,
  dayNumber: number | null | undefined,
  startTime: string | unknown
): Date | null => {
  if (!tripStartDate || !dayNumber || !startTime) {
    return null;
  }

  const [hours, minutes] = String(startTime)
    .split(":")
    .map((v) => Number(v));
  const isValidTime =
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59;

  if (!isValidTime) {
    return null;
  }

  const date = startOfDay(tripStartDate);

  if (!date) {
    return null;
  }

  date.setDate(date.getDate() + (Number(dayNumber) - 1));
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const getStartTimeSortValue = (stage: T.StageDocument): number => {
  if (!stage?.startAt) {
    return Number.MAX_SAFE_INTEGER;
  }

  const date = new Date(stage.startAt);
  const time = date.getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

const recalculateDaySequence = (
  trip: T.TripDocument,
  dayNumber: number | null | undefined
): void => {
  if (!dayNumber) {
    return;
  }

  const sameDayStages = (trip.stages || [])
    .filter(
      (stage) => Number(stage.dayNumber || 0) === Number(dayNumber)
    )
    .sort((a, b) => {
      const timeA = getStartTimeSortValue(a);
      const timeB = getStartTimeSortValue(b);

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      return String(a.title || "").localeCompare(String(b.title || ""));
    });

  sameDayStages.forEach((stage, index) => {
    stage.sequence = index + 1;
  });
};

const getNextStageSequence = (
  trip: T.TripDocument,
  dayNumber: number | null | undefined
): number => {
  const inSameDay = (trip.stages || []).filter(
    (stage) => Number(stage.dayNumber || 0) === Number(dayNumber || 0)
  );

  if (inSameDay.length === 0) {
    return 1;
  }

  const maxSequence = inSameDay.reduce((max, stage) => {
    const sequence = Number(stage.sequence || 0);
    return sequence > max ? sequence : max;
  }, 0);

  return maxSequence + 1;
};

export const listTripsByOwner = async (
  ownerId: Types.ObjectId | string,
  filters: T.TripFilters = {}
) => {
  const query: Record<string, unknown> = { owner: ownerId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  return Trip.find(query).sort({ startDate: -1, createdAt: -1 });
};

export const listTripsByOwnerPaged = async (
  ownerId: Types.ObjectId | string,
  filters: T.TripFilters = {}
): Promise<T.TripPage> => {
  const query: Record<string, unknown> = { owner: ownerId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(24, Math.max(1, Number(filters.limit || 6)));
  const sortDirection = filters.sort === "startDateAsc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Trip.find(query)
      .sort({ startDate: sortDirection, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Trip.countDocuments(query)
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items: items as T.TripDocument[],
    total,
    page,
    limit,
    totalPages
  };
};

export const getTripByIdForOwner = async (
  tripId: string | Types.ObjectId,
  ownerId: string | Types.ObjectId
) =>
  Trip.findOne({ _id: tripId, owner: ownerId }) as Promise<T.TripDocument | null>;

export const createTripForOwner = async (
  ownerId: string | Types.ObjectId,
  payload: T.TripPayload
): Promise<T.TripDocument> => {
  const trip = new Trip({
    owner: ownerId,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    status: payload.status || "planned",
    startDate: normalizeDate(payload.startDate as string | Date),
    endDate: normalizeDate(payload.endDate as string | Date),
    locationSummary: payload.locationSummary,
    notes: payload.notes,
    stages: []
  });

  await trip.save();
  return trip as T.TripDocument;
};

export const updateTripForOwner = async (
  tripId: string | Types.ObjectId,
  ownerId: string | Types.ObjectId,
  payload: T.TripPayload
): Promise<T.TripDocument | null> => {
  const trip = await getTripByIdForOwner(tripId, ownerId);

  if (!trip) {
    return null;
  }

  const mutableFields = [
    "title",
    "description",
    "category",
    "status",
    "locationSummary",
    "notes"
  ] as const;

  for (const field of mutableFields) {
    if (payload[field] !== undefined) {
      (trip as unknown as Record<string, unknown>)[field] = payload[field];
    }
  }

  if (payload.startDate !== undefined) {
    trip.startDate = normalizeDate(payload.startDate as string | Date) as Date;
  }

  if (payload.endDate !== undefined) {
    trip.endDate = normalizeDate(payload.endDate as string | Date) ?? undefined;
  }

  await trip.save();
  return trip;
};

export const deleteTripForOwner = async (
  tripId: string | Types.ObjectId,
  ownerId: string | Types.ObjectId
) => Trip.findOneAndDelete({ _id: tripId, owner: ownerId }) as Promise<T.TripDocument | null>;

export const addStageToTrip = async (
  tripId: string | Types.ObjectId,
  ownerId: string | Types.ObjectId,
  payload: T.StagePayload
): Promise<T.StageResult | null> => {
  const trip = await getTripByIdForOwner(tripId, ownerId);

  if (!trip) {
    return null;
  }

  const explicitDayNumber = getDayNumberFromPayload(payload);
  const isNewDayMode = payload?.dayMode === "new";

  const resolvedDayNumber =
    explicitDayNumber || (isNewDayMode ? getNextDayNumber(trip) : null);

  const preciseStartAt = normalizeDate(payload.startAt as string | Date);
  const inferredStartAt = buildStartAtFromDayAndTime(
    trip.startDate,
    resolvedDayNumber,
    payload.startTime
  );
  const startAt = preciseStartAt || inferredStartAt;

  const dayNumber =
    resolvedDayNumber || deriveDayNumber(trip.startDate, startAt);
  const sequence = getNextStageSequence(trip, dayNumber);

  const technical = parseTechnicalPayload(payload);

  trip.stages.push({
    title: payload.title as string,
    description: payload.description as string | undefined,
    location: payload.location as string | undefined,
    dayNumber,
    sequence,
    startAt: startAt ?? undefined,
    endAt: normalizeDate(payload.endAt as string | Date) ?? undefined,
    activityType: ((payload.activityType || payload.kind || "altro") as T.StageActivityType),
    parentStageId: (payload.parentStageId as Types.ObjectId) || null,
    media: (payload.media as string[]) || [],
    notes: payload.notes as string | undefined,
    technical: technical || undefined,
    expenses: []
  } as unknown as T.StageDocument);

  recalculateDaySequence(trip, dayNumber);

  await trip.save();

  return {
    trip,
    stage: trip.stages[trip.stages.length - 1]
  };
};

export const updateStageInTrip = async (
  tripId: string | Types.ObjectId,
  stageId: string | Types.ObjectId,
  ownerId: string | Types.ObjectId,
  payload: T.StagePayload
): Promise<T.StageUpdateResult> => {
  const trip = await getTripByIdForOwner(tripId, ownerId);

  if (!trip) {
    return { trip: null, stage: null };
  }

  const stage = trip.findStageById(stageId as string);

  if (!stage) {
    return { trip, stage: null };
  }

  const previousDayNumber = stage.dayNumber ? Number(stage.dayNumber) : null;

  const mutableFields = [
    "title",
    "description",
    "location",
    "notes",
    "parentStageId"
  ] as const;

  for (const field of mutableFields) {
    if (payload[field] !== undefined) {
      (stage as unknown as Record<string, unknown>)[field] = payload[field];
    }
  }

  if (payload.activityType !== undefined || payload.kind !== undefined) {
    stage.activityType = (
      payload.activityType || payload.kind || "altro"
    ) as T.StageActivityType;
  }

  if (
    payload.dayNumber !== undefined ||
    payload.existingDayNumber !== undefined ||
    payload.newDayNumber !== undefined
  ) {
    stage.dayNumber = getDayNumberFromPayload(payload);
  }

  if (payload.startAt !== undefined) {
    stage.startAt = normalizeDate(payload.startAt as string | Date) ?? undefined;
  }

  if (payload.startTime !== undefined) {
    stage.startAt =
      buildStartAtFromDayAndTime(
        trip.startDate,
        stage.dayNumber,
        payload.startTime
      ) ?? undefined;
  }

  if (payload.endAt !== undefined) {
    stage.endAt = normalizeDate(payload.endAt as string | Date) ?? undefined;
  }

  const hasTechnicalPayload = [
    "distanceKm",
    "elevationGainM",
    "movingTimeMin",
    "difficulty",
    "terrain",
    "gpxUrl"
  ].some((key) => pickTechnicalValue(payload, key) !== undefined);

  if (hasTechnicalPayload) {
    stage.technical = parseTechnicalPayload(payload) || undefined;
  }

  if (!stage.dayNumber && stage.startAt) {
    stage.dayNumber = deriveDayNumber(trip.startDate, stage.startAt);
  }

  if (!stage.sequence) {
    stage.sequence = getNextStageSequence(trip, stage.dayNumber);
  }

  recalculateDaySequence(trip, previousDayNumber);
  recalculateDaySequence(trip, stage.dayNumber);

  await trip.save();
  return { trip, stage };
};

export const deleteStageFromTrip = async (
  tripId: string | Types.ObjectId,
  stageId: string | Types.ObjectId,
  ownerId: string | Types.ObjectId
): Promise<T.StageUpdateResult> => {
  const trip = await getTripByIdForOwner(tripId, ownerId);

  if (!trip) {
    return { trip: null, stage: null };
  }

  const stage = trip.findStageById(stageId as string);

  if (!stage) {
    return { trip, stage: null };
  }

  const dayNumber = stage.dayNumber ? Number(stage.dayNumber) : null;
  trip.stages.pull({ _id: stage._id });
  recalculateDaySequence(trip, dayNumber);

  await trip.save();
  return { trip, stage };
};

export const addExpenseToStage = async (
  tripId: string | Types.ObjectId,
  stageId: string | Types.ObjectId,
  ownerId: string | Types.ObjectId,
  payload: Record<string, unknown>
): Promise<T.ExpenseResult> => {
  const trip = await getTripByIdForOwner(tripId, ownerId);

  if (!trip) {
    return { trip: null, stage: null, expense: null };
  }

  const stage = trip.findStageById(stageId as string);

  if (!stage) {
    return { trip, stage: null, expense: null };
  }

  stage.expenses.push({
    title: payload.title as string,
    amount: Number(payload.amount),
    currency: (payload.currency as string) || "EUR",
    category: payload.category as T.IExpense["category"],
    paidAt: normalizeDate(payload.paidAt as string | Date) || new Date(),
    notes: payload.notes as string | undefined
  } as unknown as T.ExpenseDocument);

  await trip.save();

  return {
    trip,
    stage,
    expense: stage.expenses[stage.expenses.length - 1]
  };
};
