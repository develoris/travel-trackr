import { Router } from "express";
import authenticate from "../../middlewares/authenticate.js";
import { asyncHandler } from "../../core/errors/error-utils.js";
import * as api from "./travel.controller.js";
import * as app from "./travels.app.controller.js";
import * as v from "./travel.validator.js";
import { withFlash } from "../user/users.app.controller.js";

const router = Router();

// EJS routes
router.get("/app/travels", withFlash, app.requireWebAuth, asyncHandler(app.getAppTravels));
router.get("/app/travels/new", withFlash, app.requireWebAuth, asyncHandler(app.getAppNewTravel));
router.post(
  "/app/travels",
  app.requireWebAuth,
  v.appCreateTripValidator,
  v.validateWebRequest("/users/app/travels/new"),
  asyncHandler(app.postAppTravel)
);
router.post(
  "/app/travels/:tripId/update",
  app.requireWebAuth,
  v.appUpdateTripValidator,
  v.validateWebRequest("/users/app/travels"),
  asyncHandler(app.postAppUpdateTravel)
);
router.get("/app/travels/:tripId", withFlash, app.requireWebAuth, v.tripIdValidator, v.validateWebRequest("/users/app/travels"), asyncHandler(app.getAppTravelDetail));
router.get(
  "/app/travels/:tripId/report.pdf",
  withFlash,
  app.requireWebAuth,
  v.tripIdValidator,
  v.validateWebRequest("/users/app/travels"),
  asyncHandler(app.getAppTravelReportPdf)
);
router.post(
  "/app/travels/:tripId/stages",
  app.requireWebAuth,
  v.appAddStageValidator,
  v.validateWebRequest("/users/app/travels"),
  asyncHandler(app.postAppTravelStage)
);
router.post(
  "/app/travels/:tripId/stages/:stageId/update",
  app.requireWebAuth,
  v.appUpdateStageValidator,
  v.validateWebRequest("/users/app/travels"),
  asyncHandler(app.postAppUpdateTravelStage)
);
router.post(
  "/app/travels/:tripId/stages/:stageId/expenses",
  app.requireWebAuth,
  v.appAddExpenseValidator,
  v.validateWebRequest("/users/app/travels"),
  asyncHandler(app.postAppTravelExpense)
);
router.post(
  "/app/travels/:tripId/delete",
  app.requireWebAuth,
  v.tripIdValidator,
  v.validateWebRequest("/users/app/travels"),
  asyncHandler(app.postAppDeleteTravel)
);

// API routes
router.get("/travels", authenticate, v.listTripsValidator, v.validateRequest, asyncHandler(api.getTrips));
router.post("/travels", authenticate, v.createTripValidator, v.validateRequest, asyncHandler(api.postTrip));
router.get("/travels/:tripId", authenticate, v.tripIdValidator, v.validateRequest, asyncHandler(api.getTrip));
router.patch(
  "/travels/:tripId",
  authenticate,
  v.updateTripValidator,
  v.validateRequest,
  asyncHandler(api.patchTrip)
);
router.delete(
  "/travels/:tripId",
  authenticate,
  v.tripIdValidator,
  v.validateRequest,
  asyncHandler(api.removeTrip)
);
router.post(
  "/travels/:tripId/stages",
  authenticate,
  v.addStageValidator,
  v.validateRequest,
  asyncHandler(api.postStage)
);
router.post(
  "/travels/:tripId/stages/:stageId/expenses",
  authenticate,
  v.addExpenseValidator,
  v.validateRequest,
  asyncHandler(api.postExpense)
);

export default router;
