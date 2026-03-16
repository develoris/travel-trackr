import { body, param, query, validationResult } from "express-validator";
import { AppError } from "../../core/errors/app-error.js";

const tripCategories = ["escursione", "trekking", "visita", "vacanza", "roadtrip", "altro"];
const tripStatuses = ["planned", "ongoing", "completed", "cancelled"];
const stageActivityTypes = ["trek", "visita", "trasferimento", "food", "relax", "outdoor", "altro"];
const expenseCategories = ["trasporto", "alloggio", "cibo", "attivita", "attrezzatura", "altro"];
const stageDifficultyLevels = ["facile", "media", "impegnativa", "esperto"];
const stageTerrains = ["asfalto", "sterrato", "sentiero", "misto"];

export const listTripsValidator = [
  query("status").optional().isIn(tripStatuses).withMessage("status non valido"),
  query("category").optional().isIn(tripCategories).withMessage("category non valida")
];

export const tripIdValidator = [param("tripId").isMongoId().withMessage("tripId non valido")];

export const createTripValidator = [
  body("title").trim().notEmpty().withMessage("title obbligatorio").isLength({ max: 140 }),
  body("category").optional().isIn(tripCategories).withMessage("category non valida"),
  body("status").optional().isIn(tripStatuses).withMessage("status non valido"),
  body("startDate").notEmpty().withMessage("startDate obbligatoria").isISO8601(),
  body("endDate").optional({ values: "falsy" }).isISO8601().withMessage("endDate non valida"),
  body("locationSummary").optional({ values: "falsy" }).isString().isLength({ max: 180 }),
  body("description").optional({ values: "falsy" }).isString().isLength({ max: 2000 }),
  body("notes").optional({ values: "falsy" }).isString().isLength({ max: 2000 })
];

export const updateTripValidator = [
  ...tripIdValidator,
  body("title").optional().trim().notEmpty().isLength({ max: 140 }),
  body("category").optional().isIn(tripCategories).withMessage("category non valida"),
  body("status").optional().isIn(tripStatuses).withMessage("status non valido"),
  body("startDate").optional({ values: "falsy" }).isISO8601().withMessage("startDate non valida"),
  body("endDate").optional({ values: "falsy" }).isISO8601().withMessage("endDate non valida"),
  body("locationSummary").optional({ values: "falsy" }).isString().isLength({ max: 180 }),
  body("description").optional({ values: "falsy" }).isString().isLength({ max: 2000 }),
  body("notes").optional({ values: "falsy" }).isString().isLength({ max: 2000 })
];

export const addStageValidator = [
  ...tripIdValidator,
  body("title").trim().notEmpty().withMessage("title obbligatorio").isLength({ max: 120 }),
  body("activityType").optional().isIn(stageActivityTypes).withMessage("activityType non valido"),
  body("kind").optional().isIn(stageActivityTypes).withMessage("kind non valido"),
  body("dayNumber").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("dayNumber non valido"),
  body("existingDayNumber").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("existingDayNumber non valido"),
  body("newDayNumber").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("newDayNumber non valido"),
  body("startTime").optional({ values: "falsy" }).matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("startTime non valido"),
  body("location").optional({ values: "falsy" }).isString().isLength({ max: 120 }),
  body("description").optional({ values: "falsy" }).isString().isLength({ max: 1000 }),
  body("startAt").optional({ values: "falsy" }).isISO8601().withMessage("startAt non valido"),
  body("endAt").optional({ values: "falsy" }).isISO8601().withMessage("endAt non valido"),
  body("parentStageId").optional({ values: "falsy" }).isMongoId().withMessage("parentStageId non valido"),
  body("notes").optional({ values: "falsy" }).isString().isLength({ max: 1000 }),
  body("technical.distanceKm").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("distanceKm non valido"),
  body("technical.elevationGainM").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("elevationGainM non valido"),
  body("technical.movingTimeMin").optional({ values: "falsy" }).isInt({ min: 0 }).withMessage("movingTimeMin non valido"),
  body("technical.difficulty").optional({ values: "falsy" }).isIn(stageDifficultyLevels).withMessage("difficulty non valida"),
  body("technical.terrain").optional({ values: "falsy" }).isIn(stageTerrains).withMessage("terrain non valido"),
  body("technical.gpxUrl").optional({ values: "falsy" }).isURL().withMessage("gpxUrl non valido")
];

export const addExpenseValidator = [
  ...tripIdValidator,
  param("stageId").isMongoId().withMessage("stageId non valido"),
  body("title").trim().notEmpty().withMessage("title obbligatorio").isLength({ max: 120 }),
  body("amount").notEmpty().withMessage("amount obbligatorio").isFloat({ min: 0 }),
  body("currency").optional({ values: "falsy" }).isLength({ min: 3, max: 3 }).isString(),
  body("category").optional().isIn(expenseCategories).withMessage("category non valida"),
  body("paidAt").optional({ values: "falsy" }).isISO8601().withMessage("paidAt non valido"),
  body("notes").optional({ values: "falsy" }).isString().isLength({ max: 500 })
];

export const deleteStageValidator = [
  ...tripIdValidator,
  param("stageId").isMongoId().withMessage("stageId non valido")
];

export const appCreateTripValidator = [
  body("title").trim().notEmpty().withMessage("Titolo obbligatorio").isLength({ max: 140 }),
  body("startDate").notEmpty().withMessage("Data inizio obbligatoria").isISO8601(),
  body("endDate").optional({ values: "falsy" }).isISO8601().withMessage("Data fine non valida"),
  body("category").optional().isIn(tripCategories).withMessage("Categoria non valida"),
  body("status").optional().isIn(tripStatuses).withMessage("Stato non valido")
];

export const appAddStageValidator = [
  ...tripIdValidator,
  body("title").trim().notEmpty().withMessage("Titolo attivita obbligatorio").isLength({ max: 120 }),
  body("activityType").optional().isIn(stageActivityTypes).withMessage("Tipo attivita non valido"),
  body("kind").optional().isIn(stageActivityTypes).withMessage("Tipo attivita non valido"),
  body("dayNumber").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Giorno non valido"),
  body("existingDayNumber").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Giorno esistente non valido"),
  body("newDayNumber").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Nuovo giorno non valido"),
  body("startTime").optional({ values: "falsy" }).matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("Orario non valido"),
  body("technical.distanceKm").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("Distanza non valida"),
  body("technical.elevationGainM").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("Dislivello non valido"),
  body("technical.movingTimeMin").optional({ values: "falsy" }).isInt({ min: 0 }).withMessage("Tempo in movimento non valido"),
  body("technical.difficulty").optional({ values: "falsy" }).isIn(stageDifficultyLevels).withMessage("Difficolta non valida"),
  body("technical.terrain").optional({ values: "falsy" }).isIn(stageTerrains).withMessage("Terreno non valido"),
  body("technical.gpxUrl").optional({ values: "falsy" }).isURL().withMessage("Link GPX non valido"),
  body().custom((_, { req }) => {
    const mode = req.body.dayMode;
    const hasAnyDayNumber = Boolean(req.body.dayNumber || req.body.existingDayNumber || req.body.newDayNumber);

    // Se l'utente sceglie giorno esistente, il numero deve essere specificato.
    if (mode === "existing" && !(req.body.existingDayNumber || req.body.dayNumber)) {
      throw new Error("Seleziona un giorno esistente");
    }

    // Se l'utente sceglie nuovo giorno, il numero puo essere vuoto:
    // verra assegnato automaticamente il prossimo giorno disponibile.
    if (mode === "new") {
      return true;
    }

    if (!hasAnyDayNumber) {
      throw new Error("Seleziona un giorno esistente o crea un nuovo giorno");
    }

    return true;
  })
];

export const appUpdateTripValidator = [
  ...tripIdValidator,
  body("title").trim().notEmpty().withMessage("Titolo obbligatorio").isLength({ max: 140 }),
  body("category").optional().isIn(tripCategories).withMessage("Categoria non valida"),
  body("status").optional().isIn(tripStatuses).withMessage("Stato non valido"),
  body("startDate").optional({ values: "falsy" }).isISO8601().withMessage("Data inizio non valida"),
  body("endDate").optional({ values: "falsy" }).isISO8601().withMessage("Data fine non valida"),
  body("locationSummary").optional({ values: "falsy" }).isString().isLength({ max: 180 }),
  body("description").optional({ values: "falsy" }).isString().isLength({ max: 2000 }),
  body("notes").optional({ values: "falsy" }).isString().isLength({ max: 2000 })
];

export const appUpdateStageValidator = [
  ...tripIdValidator,
  param("stageId").isMongoId().withMessage("Attivita non valida"),
  body("title").trim().notEmpty().withMessage("Titolo attivita obbligatorio").isLength({ max: 120 }),
  body("activityType").optional().isIn(stageActivityTypes).withMessage("Tipo attivita non valido"),
  body("dayNumber").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Giorno non valido"),
  body("existingDayNumber").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Giorno esistente non valido"),
  body("newDayNumber").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Nuovo giorno non valido"),
  body("startTime").optional({ values: "falsy" }).matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("Orario non valido"),
  body("startAt").optional({ values: "falsy" }).isISO8601().withMessage("Data/ora inizio non valida"),
  body("endAt").optional({ values: "falsy" }).isISO8601().withMessage("Data/ora fine non valida"),
  body("technical.distanceKm").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("Distanza non valida"),
  body("technical.elevationGainM").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("Dislivello non valido"),
  body("technical.movingTimeMin").optional({ values: "falsy" }).isInt({ min: 0 }).withMessage("Tempo in movimento non valido"),
  body("technical.difficulty").optional({ values: "falsy" }).isIn(stageDifficultyLevels).withMessage("Difficolta non valida"),
  body("technical.terrain").optional({ values: "falsy" }).isIn(stageTerrains).withMessage("Terreno non valido"),
  body("technical.gpxUrl").optional({ values: "falsy" }).isURL().withMessage("Link GPX non valido")
];

export const appDeleteStageValidator = [
  ...tripIdValidator,
  param("stageId").isMongoId().withMessage("Attivita non valida")
];

export const appAddExpenseValidator = [
  ...tripIdValidator,
  param("stageId").isMongoId().withMessage("Attivita non valida"),
  body("title").trim().notEmpty().withMessage("Titolo spesa obbligatorio").isLength({ max: 120 }),
  body("amount").notEmpty().withMessage("Importo obbligatorio").isFloat({ min: 0 })
];

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  return next();
};

export const validateWebRequest = (redirectTo) => (req, _res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return next(
    new AppError({
      code: "INVALID_FORM",
      status: 400,
      userMessage: errors.array()[0]?.msg || "Dati non validi",
      details: errors.array(),
      redirectTo
    })
  );
};
