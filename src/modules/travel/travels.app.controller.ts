import type { Request, Response, NextFunction } from "express";
import PDFDocument from "pdfkit";
import {
  addExpenseToStage,
  addStageToTrip,
  createTripForOwner,
  deleteStageFromTrip,
  deleteTripForOwner,
  getTripByIdForOwner,
  listTripsByOwnerPaged,
  updateStageInTrip,
  updateTripForOwner
} from "./travel.service.js";
import { AppError } from "../../core/errors/app-error.js";
import type { StageDocument } from "./travel.types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const setFlash = (req: Request, type: string, message: string): void => {
  req.session.flash = { [type]: message };
};

const getWebUserId = (req: Request): string => req.session?.webUser?._id ?? "";

const startOfDay = (value: unknown): Date | null => {
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const inferDayNumber = (
  tripStartDate: unknown,
  stageStartAt: unknown
): number | null => {
  if (!tripStartDate || !stageStartAt) return null;
  const tripStart = startOfDay(tripStartDate);
  const stageDay = startOfDay(stageStartAt);
  if (!tripStart || !stageDay) return null;
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor(
    (stageDay.getTime() - tripStart.getTime()) / millisecondsPerDay
  );
  return diff >= 0 ? diff + 1 : 1;
};

const toTimeStamp = (value: unknown): number => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const date = new Date(value as string);
  const time = date.getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

const toCurrency = (value: unknown): string =>
  `EUR ${Number(value || 0).toFixed(2)}`;

const formatDate = (value: unknown): string => {
  if (!value) return "n/d";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "n/d";
  return date.toLocaleDateString("it-IT");
};

const formatTime = (value: unknown): string => {
  if (!value) return "--:--";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
};

const getStageSpent = (stage: Record<string, unknown>): number => {
  const expenses = (stage.expenses || []) as Array<Record<string, unknown>>;
  return expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );
};

const getTechnicalSummary = (stage: Record<string, unknown>): string | null => {
  const technical = stage?.technical as Record<string, unknown> | undefined;
  if (!technical) return null;

  const chunks: string[] = [];

  if (technical.distanceKm !== null && technical.distanceKm !== undefined) {
    chunks.push(`${Number(technical.distanceKm).toFixed(1)} km`);
  }
  if (technical.elevationGainM !== null && technical.elevationGainM !== undefined) {
    chunks.push(`+${Math.round(Number(technical.elevationGainM))} m`);
  }
  if (technical.movingTimeMin !== null && technical.movingTimeMin !== undefined) {
    chunks.push(`${Math.round(Number(technical.movingTimeMin))} min`);
  }
  if (technical.difficulty) chunks.push(`Diff ${technical.difficulty}`);
  if (technical.terrain) chunks.push(`Terreno ${technical.terrain}`);

  return chunks.length ? chunks.join(" - ") : null;
};

const normalizeFileName = (value: unknown): string =>
  String(value || "viaggio")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "viaggio";

const ensurePdfSpace = (doc: PDFKit.PDFDocument, minSpace = 70): void => {
  if (doc.y > doc.page.height - doc.page.margins.bottom - minSpace) {
    doc.addPage();
  }
};

const getCalendarDateForDayNumber = (
  tripStartDate: unknown,
  dayNumber: unknown
): Date | null => {
  const normalizedDayNumber = Number(dayNumber);
  if (
    !tripStartDate ||
    !Number.isInteger(normalizedDayNumber) ||
    normalizedDayNumber < 1 ||
    normalizedDayNumber === Number.MAX_SAFE_INTEGER
  ) {
    return null;
  }
  const baseDate = startOfDay(tripStartDate);
  if (!baseDate) return null;
  baseDate.setDate(baseDate.getDate() + (normalizedDayNumber - 1));
  return baseDate;
};

type StageTimelineEntry = Record<string, unknown> & {
  timelineDayNumber: number;
  timelineSequence: number;
  inferredDayNumber: number | null;
  hasDayMismatch: boolean;
  activityType: string;
  startAt?: unknown;
  title?: unknown;
  expenses?: Array<Record<string, unknown>>;
};

interface DayGroup {
  dayNumber: number;
  dayDate: Date | null;
  activities: StageTimelineEntry[];
}

const buildStageTimeline = (
  trip: Record<string, unknown>
): StageTimelineEntry[] => {
  const stages = [...((trip.stages || []) as StageDocument[])].map(
    (stage): StageTimelineEntry => {
      const stageObj = stage.toObject() as unknown as Record<string, unknown>;
      const inferredDay = inferDayNumber(trip.startDate, stageObj.startAt);
      const explicitDay = stageObj.dayNumber ? Number(stageObj.dayNumber) : null;
      const timelineDayNumber =
        explicitDay || inferredDay || Number.MAX_SAFE_INTEGER;
      const timelineSequence = stageObj.sequence
        ? Number(stageObj.sequence)
        : Number.MAX_SAFE_INTEGER;
      const activityType =
        (stageObj.activityType as string) ||
        (stageObj.kind as string) ||
        "altro";

      return {
        ...stageObj,
        activityType,
        timelineDayNumber,
        timelineSequence,
        inferredDayNumber: inferredDay,
        hasDayMismatch: Boolean(
          explicitDay && inferredDay && explicitDay !== inferredDay
        )
      };
    }
  );

  return stages.sort((a, b) => {
    if (a.timelineDayNumber !== b.timelineDayNumber)
      return a.timelineDayNumber - b.timelineDayNumber;
    if (a.timelineSequence !== b.timelineSequence)
      return a.timelineSequence - b.timelineSequence;
    const timeA = toTimeStamp(a.startAt);
    const timeB = toTimeStamp(b.startAt);
    if (timeA !== timeB) return timeA - timeB;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
};

const sortStageTimelineByDayAndTime = (
  stageTimeline: StageTimelineEntry[]
): StageTimelineEntry[] =>
  [...stageTimeline].sort((a, b) => {
    if (a.timelineDayNumber !== b.timelineDayNumber)
      return a.timelineDayNumber - b.timelineDayNumber;
    const timeA = toTimeStamp(a.startAt);
    const timeB = toTimeStamp(b.startAt);
    if (timeA !== timeB) return timeA - timeB;
    return a.timelineSequence - b.timelineSequence;
  });

const buildDayGroups = (
  stageTimeline: StageTimelineEntry[],
  tripStartDate: unknown
): DayGroup[] => {
  const groupsMap = new Map<number, DayGroup>();

  for (const activity of stageTimeline) {
    const dayKey = activity.timelineDayNumber;
    if (!groupsMap.has(dayKey)) {
      groupsMap.set(dayKey, {
        dayNumber: dayKey,
        dayDate: getCalendarDateForDayNumber(tripStartDate, dayKey),
        activities: []
      });
    }
    groupsMap.get(dayKey)!.activities.push(activity);
  }

  return [...groupsMap.values()].sort((a, b) => a.dayNumber - b.dayNumber);
};

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
};

// ─── Middleware ────────────────────────────────────────────────────────────────

export const requireWebAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  if (!req.session.webUser) return res.redirect("/users/app/login");
  if (req.session.webUser.mustChangePassword)
    return res.redirect("/users/app/profile");
  return next();
};

// ─── Web Controllers ──────────────────────────────────────────────────────────

export const getAppTravels = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 6);
  const sort =
    req.query.sort === "startDateAsc" ? "startDateAsc" : "startDateDesc";
  const status = (req.query.status as string) || "";
  const category = (req.query.category as string) || "";

  const result = await listTripsByOwnerPaged(getWebUserId(req), {
    page,
    limit,
    sort,
    status,
    category
  });

  res.render("travels/index", {
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
    filters: { sort, status, category }
  });
};

export const getAppNewTravel = (req: Request, res: Response): void => {
  res.render("travels/new", { user: req.session.webUser });
};

export const postAppTravel = async (
  req: Request,
  res: Response
): Promise<void> => {
  const trip = await createTripForOwner(
    getWebUserId(req),
    req.body as Record<string, unknown>
  );

  setFlash(req, "success", "Viaggio creato con successo.");
  res.redirect(`/users/app/travels/${trip._id}`);
};

export const postAppUpdateTravel = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tripId = String(req.params.tripId);
  const trip = await updateTripForOwner(
    tripId,
    getWebUserId(req),
    req.body as Record<string, unknown>
  );

  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      redirectTo: "/users/app/travels"
    });
  }

  setFlash(req, "success", "Viaggio aggiornato.");
  res.redirect(`/users/app/travels/${tripId}`);
};

export const getAppTravelDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const trip = await getTripByIdForOwner(
    String(req.params.tripId),
    getWebUserId(req)
  );

  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      redirectTo: "/users/app/travels"
    });
  }

  // Usa il cast per usare trip come oggetto generico in buildStageTimeline
  const tripObj = trip.toObject() as unknown as Record<string, unknown>;
  tripObj.stages = trip.stages;

  const stageTimeline = sortStageTimelineByDayAndTime(
    buildStageTimeline({ ...tripObj, stages: trip.stages })
  );
  const dayGroups = buildDayGroups(stageTimeline, trip.startDate);
  const dayOptions = dayGroups
    .map((g) => g.dayNumber)
    .filter((n) => n !== Number.MAX_SAFE_INTEGER);

  res.render("travels/show", {
    user: req.session.webUser,
    trip,
    totalSpent: trip.stats?.totalSpent || 0,
    stageTimeline,
    dayGroups,
    dayOptions
  });
};

export const getAppTravelReportPdf = async (
  req: Request,
  res: Response
): Promise<void> => {
  const trip = await getTripByIdForOwner(
    String(req.params.tripId),
    getWebUserId(req)
  );

  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      redirectTo: "/users/app/travels"
    });
  }

  const tripObj = trip.toObject() as unknown as Record<string, unknown>;
  const stageTimeline = sortStageTimelineByDayAndTime(
    buildStageTimeline({ ...tripObj, stages: trip.stages })
  );
  const dayGroups = buildDayGroups(stageTimeline, trip.startDate);
  const generatedAt = new Date();
  const safeTitle = normalizeFileName(trip.title);
  const stamp = generatedAt.toISOString().replace(/[:.]/g, "-");
  const allExpenses = stageTimeline.flatMap(
    (stage) => (stage.expenses || []) as Array<Record<string, unknown>>
  );
  const spendingByCategory = allExpenses.reduce<Record<string, number>>(
    (acc, expense) => {
      const category = (expense.category as string) || "altro";
      acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
      return acc;
    },
    {}
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="report-${safeTitle}-${stamp}.pdf"`
  );
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const doc = new PDFDocument({ size: "A4", margin: 44 });
  doc.pipe(res);

  const pageWidth = doc.page.width;
  const contentWidth =
    pageWidth - doc.page.margins.left - doc.page.margins.right;
  const palette = {
    ink: "#0f172a",
    muted: "#475569",
    accent: "#0ea5e9",
    accentDark: "#0369a1",
    panel: "#f8fafc",
    panelBorder: "#e2e8f0"
  };

  const drawSectionTitle = (label: string): void => {
    ensurePdfSpace(doc, 70);
    doc.moveDown(0.6);
    const y = doc.y;
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(palette.ink)
      .text(label, doc.page.margins.left, y, { width: contentWidth });
    const lineY = doc.y + 4;
    doc
      .strokeColor(palette.panelBorder)
      .lineWidth(1)
      .moveTo(doc.page.margins.left, lineY)
      .lineTo(doc.page.margins.left + contentWidth, lineY)
      .stroke();
    doc.moveDown(0.8);
  };

  const drawStatCard = (opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    value: string;
  }): void => {
    const { x, y, w, h, label, value } = opts;
    doc.roundedRect(x, y, w, h, 8).fillAndStroke(palette.panel, palette.panelBorder);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(palette.muted)
      .text(label, x + 10, y + 9, { width: w - 20 });
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(palette.ink)
      .text(value, x + 10, y + 24, { width: w - 20 });
  };

  // Cover
  doc.rect(0, 0, pageWidth, 160).fill(palette.accentDark);
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor("#ffffff")
    .text(trip.title, doc.page.margins.left, 52, { width: contentWidth });
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#e0f2fe")
    .text(
      (trip.locationSummary as string | undefined) || "Localita da definire",
      doc.page.margins.left,
      88,
      { width: contentWidth }
    );
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#bae6fd")
    .text(
      `Generato il ${generatedAt.toLocaleDateString("it-IT")} alle ${generatedAt.toLocaleTimeString("it-IT")}`,
      doc.page.margins.left,
      108,
      { width: contentWidth }
    );

  doc.y = 182;

  const cardGap = 12;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardHeight = 62;
  const cardsY = doc.y;

  drawStatCard({
    x: doc.page.margins.left,
    y: cardsY,
    w: cardWidth,
    h: cardHeight,
    label: "Periodo",
    value: `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
  });
  drawStatCard({
    x: doc.page.margins.left + cardWidth + cardGap,
    y: cardsY,
    w: cardWidth,
    h: cardHeight,
    label: "Stato / Categoria",
    value: `${trip.status || "n/d"} - ${trip.category || "n/d"}`
  });
  drawStatCard({
    x: doc.page.margins.left,
    y: cardsY + cardHeight + 10,
    w: cardWidth,
    h: cardHeight,
    label: "Giorni / Attivita",
    value: `${trip.stats?.daysCount || 0} / ${stageTimeline.length}`
  });
  drawStatCard({
    x: doc.page.margins.left + cardWidth + cardGap,
    y: cardsY + cardHeight + 10,
    w: cardWidth,
    h: cardHeight,
    label: "Spesa Totale",
    value: toCurrency(trip.stats?.totalSpent || 0)
  });

  doc.y = cardsY + cardHeight * 2 + 24;

  drawSectionTitle("Descrizione");
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(palette.ink)
    .text(
      (trip.description as string | undefined) ||
        "Nessuna descrizione generale inserita.",
      { width: contentWidth, align: "left" }
    );

  if (trip.notes) {
    doc.moveDown(0.4);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(palette.muted)
      .text(`Note: ${trip.notes}`, { width: contentWidth });
  }

  drawSectionTitle("Riepilogo Spese per Categoria");
  const categoryEntries = Object.entries(spendingByCategory).sort(
    (a, b) => b[1] - a[1]
  );

  if (categoryEntries.length === 0) {
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(palette.muted)
      .text("Nessuna spesa registrata.");
  } else {
    const maxValue = categoryEntries[0][1] || 1;
    categoryEntries.forEach(([category, amount]) => {
      ensurePdfSpace(doc, 50);
      const rowTop = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(palette.ink)
        .text(category.toUpperCase(), doc.page.margins.left, rowTop, {
          width: contentWidth * 0.5
        });
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(palette.muted)
        .text(
          toCurrency(amount),
          doc.page.margins.left + contentWidth * 0.65,
          rowTop,
          { width: contentWidth * 0.35, align: "right" }
        );
      const barY = rowTop + 16;
      const ratio = amount / maxValue;
      doc
        .roundedRect(doc.page.margins.left, barY, contentWidth, 8, 4)
        .fill(palette.panelBorder);
      doc
        .roundedRect(
          doc.page.margins.left,
          barY,
          Math.max(8, contentWidth * ratio),
          8,
          4
        )
        .fill(palette.accent);
      doc.y = barY + 14;
    });
  }

  drawSectionTitle("Itinerario Dettagliato");

  if (dayGroups.length === 0) {
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(palette.muted)
      .text("Nessuna attivita presente nel viaggio.");
  }

  dayGroups.forEach((group) => {
    ensurePdfSpace(doc, 95);

    const dayLabel =
      group.dayNumber === Number.MAX_SAFE_INTEGER
        ? "Senza giorno assegnato"
        : `Giorno ${group.dayNumber}${
            group.dayDate ? ` (${formatDate(group.dayDate)})` : ""
          }`;
    const daySpent = group.activities.reduce(
      (sum, activity) => sum + getStageSpent(activity),
      0
    );

    const dayHeaderY = doc.y;
    doc
      .roundedRect(doc.page.margins.left, dayHeaderY, contentWidth, 24, 6)
      .fillAndStroke("#e0f2fe", "#bae6fd");
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(palette.accentDark)
      .text(
        `${dayLabel}  -  ${group.activities.length} attivita`,
        doc.page.margins.left + 10,
        dayHeaderY + 7,
        { width: contentWidth * 0.65 }
      );
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#075985")
      .text(
        `Spese: ${toCurrency(daySpent)}`,
        doc.page.margins.left + contentWidth * 0.65,
        dayHeaderY + 7,
        { width: contentWidth * 0.35, align: "right" }
      );
    doc.y = dayHeaderY + 30;

    group.activities.forEach((activity) => {
      ensurePdfSpace(doc, 120);

      const cardY = doc.y;
      const activitySpent = getStageSpent(activity);
      const activityHeader = `${formatTime(activity.startAt)}  ·  ${
        activity.activityType || "altro"
      }`;
      const technicalSummary = getTechnicalSummary(activity);

      doc
        .roundedRect(doc.page.margins.left, cardY, contentWidth, 90, 6)
        .fillAndStroke("#ffffff", palette.panelBorder);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(palette.ink)
        .text(
          (activity.title as string | undefined) || "Attivita",
          doc.page.margins.left + 10,
          cardY + 8,
          { width: contentWidth * 0.64 }
        );
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(palette.muted)
        .text(activityHeader, doc.page.margins.left + 10, cardY + 24, {
          width: contentWidth * 0.64
        });
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(palette.muted)
        .text(
          `Luogo: ${(activity.location as string | undefined) || "n/d"}`,
          doc.page.margins.left + 10,
          cardY + 38,
          { width: contentWidth * 0.64 }
        );

      if (technicalSummary) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#334155")
          .text(
            `Tecnico: ${technicalSummary}`,
            doc.page.margins.left + 10,
            cardY + 52,
            { width: contentWidth * 0.64, ellipsis: true }
          );
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(palette.ink)
        .text(
          toCurrency(activitySpent),
          doc.page.margins.left + contentWidth * 0.7,
          cardY + 12,
          { width: contentWidth * 0.28, align: "right" }
        );

      if (activity.description) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#334155")
          .text(
            activity.description as string,
            doc.page.margins.left + contentWidth * 0.7,
            cardY + 30,
            { width: contentWidth * 0.28, height: 54, ellipsis: true }
          );
      }

      doc.y = cardY + 96;

      if (activity.expenses?.length) {
        activity.expenses.forEach((expense) => {
          ensurePdfSpace(doc, 26);
          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#64748b")
            .text(
              `   - ${expense.title} (${expense.category || "altro"})`,
              { continued: true, width: contentWidth * 0.75 }
            )
            .text(toCurrency(expense.amount), {
              align: "right",
              width: contentWidth * 0.25
            });
        });
      }

      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
  });

  doc
    .moveDown(0.8)
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#94a3b8")
    .text("Documento generato automaticamente da Travel Trackr.", {
      align: "center"
    });

  doc.end();
};

export const postAppTravelStage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tripId = String(req.params.tripId);
  const result = await addStageToTrip(
    tripId,
    getWebUserId(req),
    req.body as Record<string, unknown>
  );

  if (!result?.trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      redirectTo: "/users/app/travels"
    });
  }

  setFlash(req, "success", "Attivita aggiunta.");
  res.redirect(`/users/app/travels/${tripId}`);
};

export const postAppUpdateTravelStage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tripId = String(req.params.tripId);
  const result = await updateStageInTrip(
    tripId,
    String(req.params.stageId),
    getWebUserId(req),
    req.body as Record<string, unknown>
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
      redirectTo: `/users/app/travels/${tripId}`
    });
  }

  setFlash(req, "success", "Attivita aggiornata.");
  res.redirect(`/users/app/travels/${tripId}`);
};

export const postAppTravelExpense = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tripId = String(req.params.tripId);
  const result = await addExpenseToStage(
    tripId,
    String(req.params.stageId),
    getWebUserId(req),
    req.body as Record<string, unknown>
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
      redirectTo: `/users/app/travels/${tripId}`
    });
  }

  setFlash(req, "success", "Spesa aggiunta all'attivita.");
  res.redirect(`/users/app/travels/${tripId}`);
};

export const postAppDeleteTravelStage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tripId = String(req.params.tripId);
  const result = await deleteStageFromTrip(
    tripId,
    String(req.params.stageId),
    getWebUserId(req)
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
      redirectTo: `/users/app/travels/${tripId}`
    });
  }

  setFlash(req, "success", "Attivita eliminata.");
  res.redirect(`/users/app/travels/${tripId}`);
};

export const postAppDeleteTravel = async (
  req: Request,
  res: Response
): Promise<void> => {
  const deleted = await deleteTripForOwner(
    String(req.params.tripId),
    getWebUserId(req)
  );

  if (!deleted) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      status: 404,
      userMessage: "Viaggio non trovato.",
      redirectTo: "/users/app/travels"
    });
  }

  setFlash(req, "success", "Viaggio eliminato.");
  res.redirect("/users/app/travels");
};
