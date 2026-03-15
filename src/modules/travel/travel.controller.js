import {
  addExpenseToStage,
  addStageToTrip,
  createTripForOwner,
  deleteStageFromTrip,
  deleteTripForOwner,
  getTripByIdForOwner,
  listTripsByOwner,
  updateTripForOwner
} from "./travel.service.js";
import { AppError } from "../../core/errors/app-error.js";

const getAuthUserId = (req) => req.user?._id;

export const getTrips = async (req, res) => {
  const trips = await listTripsByOwner(getAuthUserId(req), req.query);
  return res.json(trips);
};

export const getTrip = async (req, res) => {
  const trip = await getTripByIdForOwner(req.params.tripId, getAuthUserId(req));

  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      developerMessage: `Trip ${req.params.tripId} not found`
    });
  }

  return res.json(trip);
};

export const postTrip = async (req, res) => {
  const trip = await createTripForOwner(getAuthUserId(req), req.body);
  return res.status(201).json(trip);
};

export const patchTrip = async (req, res) => {
  const trip = await updateTripForOwner(req.params.tripId, getAuthUserId(req), req.body);

  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato."
    });
  }

  return res.json(trip);
};

export const removeTrip = async (req, res) => {
  const trip = await deleteTripForOwner(req.params.tripId, getAuthUserId(req));

  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato."
    });
  }

  return res.status(204).send();
};

export const postStage = async (req, res) => {
  const result = await addStageToTrip(req.params.tripId, getAuthUserId(req), req.body);

  if (!result?.trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato."
    });
  }

  return res.status(201).json(result.stage);
};

export const removeStage = async (req, res) => {
  const result = await deleteStageFromTrip(
    req.params.tripId,
    req.params.stageId,
    getAuthUserId(req)
  );

  if (!result.trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato."
    });
  }

  if (!result.stage) {
    throw new AppError({
      code: "STAGE_NOT_FOUND",
      status: 404,
      userMessage: "Attivita non trovata."
    });
  }

  return res.status(204).send();
};

export const postExpense = async (req, res) => {
  const result = await addExpenseToStage(
    req.params.tripId,
    req.params.stageId,
    getAuthUserId(req),
    req.body
  );

  if (!result.trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato."
    });
  }

  if (!result.stage) {
    throw new AppError({
      code: "STAGE_NOT_FOUND",
      status: 404,
      userMessage: "Attivita non trovata."
    });
  }

  return res.status(201).json(result.expense);
};
