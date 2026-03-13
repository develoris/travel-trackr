import { User } from "../modules/user/user.model.js";
import { Trip } from "../modules/travel/travel.model.js";

const MOCK_USERS = [
  {
    email: "demo.user@travel-trackr.local",
    password: "Password123!", // viene hashata dal pre-save hook nel model
    name: "Demo User",
    role: "user"
  },
  {
    email: "demo.admin@travel-trackr.local",
    password: "Password123!", // viene hashata dal pre-save hook nel model
    name: "Demo Admin",
    role: "admin"
  }
];

const shouldSeedMockData = () => process.env.SEED_MOCK_DATA !== "false";

const DEMO_TRIPS = [
  {
    ownerEmail: "demo.user@travel-trackr.local",
    title: "Weekend Dolomiti",
    category: "trekking",
    status: "completed",
    startDate: "2026-02-14",
    endDate: "2026-02-16",
    locationSummary: "Cortina, Tre Cime, Braies",
    description: "Trekking invernale tra rifugi e laghi.",
    notes: "Portare ramponcini e strati termici.",
    stages: [
      {
        title: "Arrivo a Cortina",
        activityType: "trasferimento",
        dayNumber: 1,
        sequence: 1,
        startAt: "2026-02-14T09:30:00",
        endAt: "2026-02-14T14:30:00",
        location: "Cortina d'Ampezzo",
        description: "Viaggio in auto e check-in.",
        expenses: [
          { title: "Carburante", amount: 62.4, category: "trasporto" },
          { title: "Parcheggio", amount: 14, category: "trasporto" }
        ]
      },
      {
        title: "Museo della Grande Guerra",
        activityType: "visita",
        dayNumber: 2,
        sequence: 1,
        startAt: "2026-02-15T10:00:00",
        endAt: "2026-02-15T12:00:00",
        location: "Passo Falzarego",
        description: "Visita museo storico locale.",
        expenses: [
          { title: "Biglietto museo", amount: 12, category: "attivita" }
        ]
      },
      {
        title: "Trek Tre Cime",
        activityType: "trek",
        dayNumber: 2,
        sequence: 2,
        startAt: "2026-02-15T14:00:00",
        endAt: "2026-02-15T18:30:00",
        location: "Tre Cime di Lavaredo",
        description: "Anello principale con soste fotografiche.",
        expenses: [
          { title: "Pranzo rifugio", amount: 24.5, category: "cibo" },
          { title: "Ingresso area", amount: 30, category: "attivita" }
        ]
      }
    ]
  },
  {
    ownerEmail: "demo.admin@travel-trackr.local",
    title: "Milano culturale",
    category: "visita",
    status: "planned",
    startDate: "2026-04-20",
    endDate: "2026-04-21",
    locationSummary: "Duomo, Brera, Navigli",
    description: "City-break con visite museo e food tour.",
    notes: "Prenotare Pinacoteca di Brera.",
    stages: [
      {
        title: "Centro storico",
        activityType: "visita",
        dayNumber: 1,
        sequence: 1,
        startAt: "2026-04-20T09:00:00",
        endAt: "2026-04-20T12:30:00",
        location: "Piazza Duomo",
        description: "Duomo + Galleria Vittorio Emanuele II",
        expenses: [
          { title: "Biglietto Duomo", amount: 16, category: "attivita" }
        ]
      }
    ]
  }
];

const seedTrips = async () => {
  let createdTrips = 0;

  for (const tripData of DEMO_TRIPS) {
    const owner = await User.findOne({ email: tripData.ownerEmail });

    if (!owner) {
      continue;
    }

    const existingTrip = await Trip.findOne({ owner: owner._id, title: tripData.title });

    if (existingTrip) {
      continue;
    }

    await Trip.create({
      owner: owner._id,
      title: tripData.title,
      category: tripData.category,
      status: tripData.status,
      startDate: new Date(tripData.startDate),
      endDate: new Date(tripData.endDate),
      locationSummary: tripData.locationSummary,
      description: tripData.description,
      notes: tripData.notes,
      stages: tripData.stages
    });

    createdTrips += 1;
  }

  return createdTrips;
};

export const seedMockData = async () => {
  if (!shouldSeedMockData()) {
    console.log("[mock-seed] Skipped (SEED_MOCK_DATA=false)");
    return;
  }

  let created = 0;

  for (const userData of MOCK_USERS) {
    const existing = await User.findOne({ email: userData.email });

    if (existing) {
      continue;
    }

    // Nel seed teniamo password in chiaro, poi la passiamo al campo passwordHash
    // per sfruttare il pre-save che la converte in hash bcrypt.
    await User.create({
      email: userData.email,
      passwordHash: userData.password,
      name: userData.name,
      role: userData.role
    });
    created += 1;
  }

  console.log(`[mock-seed] Ready. Created ${created}/${MOCK_USERS.length} users.`);

  const createdTrips = await seedTrips();
  console.log(`[mock-seed] Ready. Created ${createdTrips}/${DEMO_TRIPS.length} trips.`);
};
