import {
  addExpenseToStage,
  addStageToTrip,
  createTripForOwner,
  deleteTripForOwner,
  getTripByIdForOwner,
  listTripsByOwnerPaged,
  updateStageInTrip,
  updateTripForOwner
} from "./travel.service.js";
import { AppError } from "../../core/errors/app-error.js";

const setFlash = (req, type, message) => {
  req.session.flash = { [type]: message };
};

const getWebUserId = (req) => req.session?.webUser?._id;

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

const toTimeStamp = (value) => {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

const buildStageTimeline = (trip) => {
  const stages = [...(trip.stages || [])].map((stage) => {
    const inferredDay = inferDayNumber(trip.startDate, stage.startAt);
    const explicitDay = stage.dayNumber ? Number(stage.dayNumber) : null;
    const timelineDayNumber = explicitDay || inferredDay || Number.MAX_SAFE_INTEGER;
    const timelineSequence = stage.sequence ? Number(stage.sequence) : Number.MAX_SAFE_INTEGER;

    const activityType = stage.activityType || stage.kind || "altro";

    return {
      ...stage.toObject(),
      activityType,
      timelineDayNumber,
      timelineSequence,
      inferredDayNumber: inferredDay,
      hasDayMismatch: Boolean(explicitDay && inferredDay && explicitDay !== inferredDay)
    };
  });

  return stages.sort((a, b) => {
    const dayA = a.timelineDayNumber;
    const dayB = b.timelineDayNumber;

    if (dayA !== dayB) {
      return dayA - dayB;
    }

    const seqA = a.timelineSequence;
    const seqB = b.timelineSequence;

    if (seqA !== seqB) {
      return seqA - seqB;
    }

    const timeA = toTimeStamp(a.startAt);
    const timeB = toTimeStamp(b.startAt);

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return String(a.title || "").localeCompare(String(b.title || ""));
  });
};

const buildDayGroups = (stageTimeline) => {
  const groupsMap = new Map();

  for (const activity of stageTimeline) {
    const dayKey = activity.timelineDayNumber;

    if (!groupsMap.has(dayKey)) {
      groupsMap.set(dayKey, {
        dayNumber: dayKey,
        activities: []
      });
    }

    groupsMap.get(dayKey).activities.push(activity);
  }

  return [...groupsMap.values()].sort((a, b) => a.dayNumber - b.dayNumber);
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

export const requireWebAuth = (req, res, next) => {
  if (!req.session.webUser) {
    return res.redirect("/users/app/login");
  }

  return next();
};

export const getAppTravels = async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 6);
  const sort = req.query.sort === "startDateAsc" ? "startDateAsc" : "startDateDesc";
  const status = req.query.status || "";
  const category = req.query.category || "";

  const result = await listTripsByOwnerPaged(getWebUserId(req), {
    page,
    limit,
    sort,
    status,
    category
  });

  return res.render("travels/index", {
    user: req.session.webUser,
    trips: result.items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasPrev: result.page > 1,
      hasNext: result.page < result.totalPages
    },
    filters: {
      sort,
      status,
      category
    }
  });
};

export const getAppNewTravel = (req, res) => {
  return res.render("travels/new", { user: req.session.webUser });
};

export const postAppTravel = async (req, res) => {
  const trip = await createTripForOwner(getWebUserId(req), req.body);

  setFlash(req, "success", "Viaggio creato con successo.");
  return res.redirect(`/users/app/travels/${trip._id}`);
};

export const postAppUpdateTravel = async (req, res) => {
  const trip = await updateTripForOwner(req.params.tripId, getWebUserId(req), req.body);

  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      redirectTo: "/users/app/travels"
    });
  }

  setFlash(req, "success", "Viaggio aggiornato.");
  return res.redirect(`/users/app/travels/${req.params.tripId}`);
};

export const getAppTravelDetail = async (req, res) => {
  const trip = await getTripByIdForOwner(req.params.tripId, getWebUserId(req));

  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      redirectTo: "/users/app/travels"
    });
  }

  const stageTimeline = buildStageTimeline(trip).sort((a, b) => {
    const dayA = a.timelineDayNumber;
    const dayB = b.timelineDayNumber;

    if (dayA !== dayB) {
      return dayA - dayB;
    }

    const timeA = toTimeStamp(a.startAt);
    const timeB = toTimeStamp(b.startAt);

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return a.timelineSequence - b.timelineSequence;
  });
  const dayGroups = buildDayGroups(stageTimeline);
  const dayOptions = dayGroups
    .map((group) => group.dayNumber)
    .filter((dayNumber) => Number(dayNumber) !== Number.MAX_SAFE_INTEGER);

  return res.render("travels/show", {
    user: req.session.webUser,
    trip,
    totalSpent: trip.stats?.totalSpent || 0,
    stageTimeline,
    dayGroups,
    dayOptions
  });
};

export const postAppTravelStage = async (req, res) => {
  const result = await addStageToTrip(req.params.tripId, getWebUserId(req), req.body);

  if (!result?.trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      redirectTo: "/users/app/travels"
    });
  }

  setFlash(req, "success", "Attivita aggiunta.");
  return res.redirect(`/users/app/travels/${req.params.tripId}`);
};

export const postAppUpdateTravelStage = async (req, res) => {
  const result = await updateStageInTrip(
    req.params.tripId,
    req.params.stageId,
    getWebUserId(req),
    req.body
  );

  if (!result.trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      redirectTo: "/users/app/travels"
    });
  }

  if (!result.stage) {
    throw new AppError({
      code: "STAGE_NOT_FOUND",
      status: 404,
      userMessage: "Attivita non trovata.",
      redirectTo: `/users/app/travels/${req.params.tripId}`
    });
  }

  setFlash(req, "success", "Attivita aggiornata.");
  return res.redirect(`/users/app/travels/${req.params.tripId}`);
};

export const postAppTravelExpense = async (req, res) => {
  const result = await addExpenseToStage(
    req.params.tripId,
    req.params.stageId,
    getWebUserId(req),
    req.body
  );

  if (!result.trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      redirectTo: "/users/app/travels"
    });
  }

  if (!result.stage) {
    throw new AppError({
      code: "STAGE_NOT_FOUND",
      status: 404,
      userMessage: "Attivita non trovata.",
      redirectTo: `/users/app/travels/${req.params.tripId}`
    });
  }

  setFlash(req, "success", "Spesa aggiunta all'attivita.");
  return res.redirect(`/users/app/travels/${req.params.tripId}`);
};

export const postAppDeleteTravel = async (req, res) => {
  const deleted = await deleteTripForOwner(req.params.tripId, getWebUserId(req));

  if (!deleted) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      redirectTo: "/users/app/travels"
    });
  }

  setFlash(req, "success", "Viaggio eliminato.");
  return res.redirect("/users/app/travels");
};
