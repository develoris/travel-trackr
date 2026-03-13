import { Trip } from "./travel.model.js";

const normalizeDate = (value) => (value ? new Date(value) : null);

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const startOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const deriveDayNumber = (tripStartDate, stageStartAt) => {
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

const getDayNumberFromPayload = (payload = {}) => {
  const direct = toNumberOrNull(payload.dayNumber);
  const existingDay = toNumberOrNull(payload.existingDayNumber);
  const newDay = toNumberOrNull(payload.newDayNumber);

  return direct || existingDay || newDay || null;
};

const getNextDayNumber = (trip) => {
  const maxDay = (trip.stages || []).reduce((max, stage) => {
    const day = Number(stage.dayNumber || 0);
    return day > max ? day : max;
  }, 0);

  return maxDay + 1;
};

const buildStartAtFromDayAndTime = (tripStartDate, dayNumber, startTime) => {
  if (!tripStartDate || !dayNumber || !startTime) {
    return null;
  }

  const [hours, minutes] = String(startTime).split(":").map((value) => Number(value));
  const isValidTime = Number.isInteger(hours) && Number.isInteger(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;

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

const getStartTimeSortValue = (stage) => {
  if (!stage?.startAt) {
    return Number.MAX_SAFE_INTEGER;
  }

  const date = new Date(stage.startAt);
  const time = date.getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

const recalculateDaySequence = (trip, dayNumber) => {
  if (!dayNumber) {
    return;
  }

  const sameDayStages = (trip.stages || [])
    .filter((stage) => Number(stage.dayNumber || 0) === Number(dayNumber))
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

const getNextStageSequence = (trip, dayNumber) => {
  const inSameDay = (trip.stages || []).filter((stage) => {
    return Number(stage.dayNumber || 0) === Number(dayNumber || 0);
  });

  if (inSameDay.length === 0) {
    return 1;
  }

  const maxSequence = inSameDay.reduce((max, stage) => {
    const sequence = Number(stage.sequence || 0);
    return sequence > max ? sequence : max;
  }, 0);

  return maxSequence + 1;
};

export const listTripsByOwner = async (ownerId, filters = {}) => {
  const query = { owner: ownerId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  return Trip.find(query).sort({ startDate: -1, createdAt: -1 });
};

export const listTripsByOwnerPaged = async (ownerId, filters = {}) => {
  const query = { owner: ownerId };

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
    items,
    total,
    page,
    limit,
    totalPages
  };
};

export const getTripByIdForOwner = async (tripId, ownerId) => {
  return Trip.findOne({ _id: tripId, owner: ownerId });
};

export const createTripForOwner = async (ownerId, payload) => {
  const trip = new Trip({
    owner: ownerId,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    status: payload.status || "planned",
    startDate: normalizeDate(payload.startDate),
    endDate: normalizeDate(payload.endDate),
    locationSummary: payload.locationSummary,
    notes: payload.notes,
    stages: []
  });

  await trip.save();
  return trip;
};

export const updateTripForOwner = async (tripId, ownerId, payload) => {
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
  ];

  for (const field of mutableFields) {
    if (payload[field] !== undefined) {
      trip[field] = payload[field];
    }
  }

  if (payload.startDate !== undefined) {
    trip.startDate = normalizeDate(payload.startDate);
  }

  if (payload.endDate !== undefined) {
    trip.endDate = normalizeDate(payload.endDate);
  }

  await trip.save();
  return trip;
};

export const deleteTripForOwner = async (tripId, ownerId) => {
  return Trip.findOneAndDelete({ _id: tripId, owner: ownerId });
};

export const addStageToTrip = async (tripId, ownerId, payload) => {
  const trip = await getTripByIdForOwner(tripId, ownerId);

  if (!trip) {
    return null;
  }

  const explicitDayNumber = getDayNumberFromPayload(payload);
  const isNewDayMode = payload?.dayMode === "new";
  const resolvedDayNumber = explicitDayNumber || (isNewDayMode ? getNextDayNumber(trip) : null);
  const preciseStartAt = normalizeDate(payload.startAt);
  const inferredStartAt = buildStartAtFromDayAndTime(trip.startDate, resolvedDayNumber, payload.startTime);
  const startAt = preciseStartAt || inferredStartAt;
  const dayNumber = resolvedDayNumber || deriveDayNumber(trip.startDate, startAt);
  const sequence = getNextStageSequence(trip, dayNumber);

  trip.stages.push({
    title: payload.title,
    description: payload.description,
    location: payload.location,
    dayNumber,
    sequence,
    startAt,
    endAt: normalizeDate(payload.endAt),
    activityType: payload.activityType || payload.kind || "altro",
    parentStageId: payload.parentStageId || null,
    media: payload.media || [],
    notes: payload.notes,
    expenses: []
  });

  recalculateDaySequence(trip, dayNumber);

  await trip.save();

  return {
    trip,
    stage: trip.stages[trip.stages.length - 1]
  };
};

export const updateStageInTrip = async (tripId, stageId, ownerId, payload) => {
  const trip = await getTripByIdForOwner(tripId, ownerId);

  if (!trip) {
    return { trip: null, stage: null };
  }

  const stage = trip.findStageById(stageId);

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
  ];

  for (const field of mutableFields) {
    if (payload[field] !== undefined) {
      stage[field] = payload[field];
    }
  }

  if (payload.activityType !== undefined || payload.kind !== undefined) {
    stage.activityType = payload.activityType || payload.kind || "altro";
  }

  if (
    payload.dayNumber !== undefined ||
    payload.existingDayNumber !== undefined ||
    payload.newDayNumber !== undefined
  ) {
    stage.dayNumber = getDayNumberFromPayload(payload);
  }

  if (payload.startAt !== undefined) {
    stage.startAt = normalizeDate(payload.startAt);
  }

  if (payload.startTime !== undefined) {
    stage.startAt = buildStartAtFromDayAndTime(trip.startDate, stage.dayNumber, payload.startTime);
  }

  if (payload.endAt !== undefined) {
    stage.endAt = normalizeDate(payload.endAt);
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

export const addExpenseToStage = async (tripId, stageId, ownerId, payload) => {
  const trip = await getTripByIdForOwner(tripId, ownerId);

  if (!trip) {
    return { trip: null, stage: null, expense: null };
  }

  const stage = trip.findStageById(stageId);

  if (!stage) {
    return { trip, stage: null, expense: null };
  }

  stage.expenses.push({
    title: payload.title,
    amount: Number(payload.amount),
    currency: payload.currency || "EUR",
    category: payload.category,
    paidAt: normalizeDate(payload.paidAt) || new Date(),
    notes: payload.notes
  });

  await trip.save();

  return {
    trip,
    stage,
    expense: stage.expenses[stage.expenses.length - 1]
  };
};
