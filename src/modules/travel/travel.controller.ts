import type { Request, Response } from "express";
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
import type { Types } from "mongoose";

const getAuthUserId = (req: Request): Types.ObjectId =>
  req.user!._id as unknown as Types.ObjectId;

export const getTrips = async (req: Request, res: Response): Promise<Response> => {
  const trips = await listTripsByOwner(getAuthUserId(req), req.query);
  return res.json(trips);
};

export const getTrip = async (req: Request, res: Response): Promise<Response> => {
  const tripId = String(req.params.tripId);
  const trip = await getTripByIdForOwner(tripId, getAuthUserId(req));

  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      developerMessage: `Trip ${tripId} not found`
    });
  }

  return res.json(trip);
};

export const postTrip = async (req: Request, res: Response): Promise<Response> => {
  const trip = await createTripForOwner(getAuthUserId(req), req.body as Record<string, unknown>);
  return res.status(201).json(trip);
};

export const patchTrip = async (req: Request, res: Response): Promise<Response> => {
  const trip = await updateTripForOwner(
    String(req.params.tripId),
    getAuthUserId(req),
    req.body as Record<string, unknown>
  );

  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato."
    });
  }

  return res.json(trip);
};

export const removeTrip = async (req: Request, res: Response): Promise<Response> => {
  const trip = await deleteTripForOwner(String(req.params.tripId), getAuthUserId(req));

  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato."
    });
  }

  return res.status(204).send();
};

export const postStage = async (req: Request, res: Response): Promise<Response> => {
  const result = await addStageToTrip(
    String(req.params.tripId),
    getAuthUserId(req),
    req.body as Record<string, unknown>
  );

  if (!result?.trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato."
    });
  }

  return res.status(201).json(result.stage);
};

export const removeStage = async (req: Request, res: Response): Promise<Response> => {
  const result = await deleteStageFromTrip(
    String(req.params.tripId),
    String(req.params.stageId),
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

export const postExpense = async (req: Request, res: Response): Promise<Response> => {
  const result = await addExpenseToStage(
    String(req.params.tripId),
    String(req.params.stageId),
    getAuthUserId(req),
    req.body as Record<string, unknown>
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
