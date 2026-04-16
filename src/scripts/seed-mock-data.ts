import { User } from "../modules/user/user.model.js";
import { Trip } from "../modules/travel/travel.model.js";

interface MockUser {
  email: string;
  password: string;
  name: string;
  role: "user" | "admin";
}

interface MockExpense {
  title: string;
  amount: number;
  category: string;
}

interface MockTechnical {
  distanceKm?: number;
  elevationGainM?: number;
  movingTimeMin?: number;
  difficulty?: string;
  terrain?: string;
  gpxUrl?: string;
}

interface MockStage {
  title: string;
  activityType: string;
  dayNumber?: number;
  sequence?: number;
  startAt?: string;
  endAt?: string;
  location?: string;
  description?: string;
  technical?: MockTechnical;
  expenses: MockExpense[];
}

interface MockTrip {
  ownerEmail: string;
  title: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  locationSummary: string;
  description: string;
  notes: string | null;
  stages: MockStage[];
}

const MOCK_USERS: MockUser[] = [
  {
    email: "demo.user@example.com",
    password: "Password123!",
    name: "Demo User",
    role: "user"
  },
  {
    email: "demo.admin@example.com",
    password: "Password123!",
    name: "Demo Admin",
    role: "admin"
  }
];

const shouldSeedMockData = () => process.env.SEED_MOCK_DATA !== "false";

const DEMO_TRIPS: MockTrip[] = [
  {
    ownerEmail: "demo.user@example.com",
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
        technical: {
          distanceKm: 10.8,
          elevationGainM: 740,
          movingTimeMin: 275,
          difficulty: "media",
          terrain: "sentiero",
          gpxUrl: "https://example.org/gpx/tre-cime-anello"
        },
        expenses: [
          { title: "Pranzo rifugio", amount: 24.5, category: "cibo" },
          { title: "Ingresso area", amount: 30, category: "attivita" }
        ]
      }
    ]
  },
  {
    ownerEmail: "demo.admin@example.com",
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
  },
  {
    ownerEmail: "demo.user@example.com",
    title: "Bikepack Langhe 2 giorni",
    category: "roadtrip",
    status: "ongoing",
    startDate: "2026-05-09",
    endDate: "2026-05-10",
    locationSummary: "Alba, Barolo, La Morra",
    description: "Micro-avventura bikepacking con asfalto e sterrato leggero.",
    notes: "Test assetto borse e alimentazione in sella.",
    stages: [
      {
        title: "Trasferimento in treno + setup bici",
        activityType: "trasferimento",
        dayNumber: 1,
        sequence: 1,
        startAt: "2026-05-09T07:20:00",
        endAt: "2026-05-09T09:00:00",
        location: "Stazione Alba",
        description: "Arrivo e check veloce attrezzatura.",
        expenses: [
          { title: "Biglietto treno", amount: 18.9, category: "trasporto" }
        ]
      },
      {
        title: "Anello Alba-Barolo",
        activityType: "outdoor",
        dayNumber: 1,
        sequence: 2,
        startAt: "2026-05-09T09:15:00",
        endAt: "2026-05-09T14:45:00",
        location: "Colline del Barolo",
        description: "Saliscendi continui su strade bianche e secondarie.",
        technical: {
          distanceKm: 46.2,
          elevationGainM: 980,
          movingTimeMin: 265,
          difficulty: "impegnativa",
          terrain: "misto"
        },
        expenses: [
          { title: "Snack e acqua", amount: 9.7, category: "cibo" }
        ]
      },
      {
        title: "Rientro panoramico",
        activityType: "outdoor",
        dayNumber: 2,
        sequence: 1,
        startAt: "2026-05-10T10:00:00",
        endAt: "2026-05-10T13:00:00",
        location: "La Morra -> Alba",
        description: "Rientro rilassato con soste fotografiche.",
        technical: {
          distanceKm: 24,
          movingTimeMin: 120,
          terrain: "asfalto"
        },
        expenses: []
      }
    ]
  },
  {
    ownerEmail: "demo.user@example.com",
    title: "Sardegna estate",
    category: "vacanza",
    status: "planned",
    startDate: "2026-07-20",
    endDate: "2026-07-27",
    locationSummary: "Cagliari, Costa Rei, Villasimius",
    description: "Settimana balneara con escursioni e snorkeling.",
    notes: "Prenotare traghetto entro aprile.",
    stages: []
  },
  {
    ownerEmail: "demo.user@example.com",
    title: "Escursione Monte Grappa",
    category: "escursione",
    status: "completed",
    startDate: "2026-03-01",
    endDate: "2026-03-01",
    locationSummary: "Cima Grappa, Crespano del Grappa",
    description: "Gita in giornata con partenza alle prime luci dell'alba.",
    notes: null,
    stages: [
      {
        title: "Salita al Sacrario",
        activityType: "trek",
        dayNumber: 1,
        sequence: 1,
        startAt: "2026-03-01T07:00:00",
        endAt: "2026-03-01T10:30:00",
        location: "Cima Grappa",
        description: "Salita su sentiero, arrivo al sacrario militare.",
        technical: {
          distanceKm: 6.5,
          elevationGainM: 620,
          movingTimeMin: 155,
          difficulty: "media",
          terrain: "sentiero"
        },
        expenses: []
      },
      {
        title: "Pranzo al rifugio Bassano",
        activityType: "food",
        dayNumber: 1,
        sequence: 2,
        startAt: "2026-03-01T11:00:00",
        endAt: "2026-03-01T12:30:00",
        location: "Rifugio Bassano",
        description: "Polenta taragna con funghi.",
        expenses: [
          { title: "Pranzo", amount: 18, category: "cibo" }
        ]
      },
      {
        title: "Discesa e rientro",
        activityType: "trek",
        dayNumber: 1,
        sequence: 3,
        startAt: "2026-03-01T13:00:00",
        endAt: "2026-03-01T15:00:00",
        location: "Crespano del Grappa",
        description: "Discesa per la cresta nord.",
        technical: {
          distanceKm: 7.2,
          elevationGainM: 0,
          movingTimeMin: 105,
          difficulty: "facile",
          terrain: "sentiero"
        },
        expenses: []
      }
    ]
  },
  {
    ownerEmail: "demo.user@example.com",
    title: "Roadtrip Sicilia",
    category: "roadtrip",
    status: "cancelled",
    startDate: "2026-04-05",
    endDate: "2026-04-12",
    locationSummary: "Palermo, Agrigento, Siracusa, Etna",
    description: "Giro dell'isola in auto, 7 notti.",
    notes: "Cancellato: guasto auto. Da riprogrammare.",
    stages: [
      {
        title: "Volo Venezia-Palermo",
        activityType: "trasferimento",
        dayNumber: 1,
        sequence: 1,
        startAt: "2026-04-05T06:30:00",
        endAt: "2026-04-05T09:00:00",
        location: "Aeroporto Falcone-Borsellino",
        description: "Volo diretto.",
        expenses: [
          { title: "Biglietto aereo A/R", amount: 148, category: "trasporto" },
          { title: "Bagaglio stiva", amount: 25, category: "trasporto" }
        ]
      },
      {
        title: "Noleggio auto",
        activityType: "trasferimento",
        dayNumber: 1,
        sequence: 2,
        startAt: "2026-04-05T09:30:00",
        location: "Palermo aeroporto",
        description: "Ritiro auto noleggiata, poi cancellato.",
        expenses: [
          { title: "Noleggio auto (rimborso parziale)", amount: 210, category: "trasporto" }
        ]
      }
    ]
  },
  {
    ownerEmail: "demo.user@example.com",
    title: "Alta Via 1 Dolomiti",
    category: "trekking",
    status: "planned",
    startDate: "2026-08-10",
    endDate: "2026-08-17",
    locationSummary: "Lago di Braies → Belluno, 8 giorni",
    description: "Traversata classica delle Dolomiti. Rifugio in rifugio con stacco totale dalla città.",
    notes: "Prenotare rifugi a febbraio. Carry 10kg.",
    stages: [
      {
        title: "Partenza Lago di Braies → Rif. Biella",
        activityType: "trek",
        dayNumber: 1,
        sequence: 1,
        startAt: "2026-08-10T08:00:00",
        location: "Lago di Braies",
        description: "Prima tappa, salita al Passo Sella di Sennes.",
        technical: {
          distanceKm: 14.3,
          elevationGainM: 1050,
          movingTimeMin: 330,
          difficulty: "impegnativa",
          terrain: "sentiero"
        },
        expenses: [
          { title: "Pernottamento Rif. Biella", amount: 65, category: "alloggio" },
          { title: "Cena rifugio", amount: 22, category: "cibo" }
        ]
      },
      {
        title: "Rif. Biella → Rif. Fodara Vedla",
        activityType: "trek",
        dayNumber: 2,
        sequence: 1,
        startAt: "2026-08-11T07:30:00",
        location: "Alta Badia",
        description: "Panorami sull'Antelao e attraversamento dell'altopiano.",
        technical: {
          distanceKm: 11.8,
          elevationGainM: 720,
          movingTimeMin: 285,
          difficulty: "media",
          terrain: "sentiero"
        },
        expenses: [
          { title: "Pernottamento Rif. Fodara Vedla", amount: 70, category: "alloggio" }
        ]
      },
      {
        title: "Giorno di riposo a Cortina",
        activityType: "relax",
        dayNumber: 3,
        sequence: 1,
        startAt: "2026-08-12T10:00:00",
        location: "Cortina d'Ampezzo",
        description: "Pausa in paese, rifornimento viveri, recupero muscolare.",
        expenses: [
          { title: "Cibo e scorte", amount: 38.5, category: "cibo" },
          { title: "Alloggio B&B", amount: 90, category: "alloggio" }
        ]
      }
    ]
  },
  {
    ownerEmail: "demo.admin@example.com",
    title: "Barcellona long weekend",
    category: "visita",
    status: "completed",
    startDate: "2026-03-06",
    endDate: "2026-03-09",
    locationSummary: "Barcellona, Gotic, Gracia, Sagrada Familia",
    description: "4 giorni tra architettura modernista, tapas e spiaggia.",
    notes: null,
    stages: [
      {
        title: "Volo Milano-Barcellona",
        activityType: "trasferimento",
        dayNumber: 1,
        sequence: 1,
        startAt: "2026-03-06T06:45:00",
        endAt: "2026-03-06T08:30:00",
        location: "El Prat",
        description: "Volo diretto Ryanair.",
        expenses: [
          { title: "Biglietto aereo A/R", amount: 96, category: "trasporto" }
        ]
      },
      {
        title: "Sagrada Familia",
        activityType: "visita",
        dayNumber: 1,
        sequence: 2,
        startAt: "2026-03-06T11:00:00",
        endAt: "2026-03-06T13:30:00",
        location: "Eixample",
        description: "Visita con biglietto skip-the-line e accesso alle torri.",
        expenses: [
          { title: "Biglietto Sagrada Familia", amount: 36, category: "attivita" }
        ]
      },
      {
        title: "Tapas tour Barceloneta",
        activityType: "food",
        dayNumber: 2,
        sequence: 1,
        startAt: "2026-03-07T13:00:00",
        endAt: "2026-03-07T16:00:00",
        location: "Barceloneta",
        description: "Giro guidato tra bar di tapas storici.",
        expenses: [
          { title: "Food tour guidato", amount: 55, category: "attivita" },
          { title: "Vino e extra", amount: 18, category: "cibo" }
        ]
      },
      {
        title: "Parco Guell e quartiere Gracia",
        activityType: "visita",
        dayNumber: 3,
        sequence: 1,
        startAt: "2026-03-08T09:30:00",
        endAt: "2026-03-08T12:00:00",
        location: "Gracia",
        description: "Passeggiata nel parco e giro nel quartiere.",
        expenses: [
          { title: "Biglietto Parco Guell", amount: 14, category: "attivita" }
        ]
      },
      {
        title: "Rientro volo serale",
        activityType: "trasferimento",
        dayNumber: 4,
        sequence: 1,
        startAt: "2026-03-09T19:00:00",
        endAt: "2026-03-09T21:00:00",
        location: "El Prat → Malpensa",
        description: "Check-out mattina, pomeriggio libero, volo serale.",
        expenses: [
          { title: "Metro aeroporto", amount: 5.9, category: "trasporto" }
        ]
      }
    ]
  },
  {
    ownerEmail: "demo.admin@example.com",
    title: "Toscana in bici",
    category: "roadtrip",
    status: "ongoing",
    startDate: "2026-03-13",
    endDate: "2026-03-16",
    locationSummary: "Siena, Val d'Orcia, Montalcino",
    description: "Cicloturismo dolce tra borghi e vigneti.",
    notes: "Bike noleggiata a Siena. Borse anteriori + posteriori.",
    stages: [
      {
        title: "Arrivo Siena + check-in",
        activityType: "trasferimento",
        dayNumber: 1,
        sequence: 1,
        startAt: "2026-03-13T10:30:00",
        location: "Siena centro",
        description: "Treno da Firenze, ritiro bici nolo.",
        expenses: [
          { title: "Treno Firenze-Siena", amount: 12, category: "trasporto" },
          { title: "Noleggio bici 4 giorni", amount: 110, category: "attrezzatura" }
        ]
      },
      {
        title: "Siena → Buonconvento",
        activityType: "outdoor",
        dayNumber: 1,
        sequence: 2,
        startAt: "2026-03-13T14:00:00",
        endAt: "2026-03-13T17:30:00",
        location: "Via Francigena",
        description: "Prima semitappa su sterrato della Francigena.",
        technical: {
          distanceKm: 32.4,
          elevationGainM: 310,
          movingTimeMin: 135,
          difficulty: "facile",
          terrain: "sterrato"
        },
        expenses: []
      },
      {
        title: "Buonconvento → Montalcino",
        activityType: "outdoor",
        dayNumber: 2,
        sequence: 1,
        startAt: "2026-03-14T09:00:00",
        endAt: "2026-03-14T12:30:00",
        location: "Val d'Orcia",
        description: "Salita ripida verso Montalcino con vista sulla val d'Orcia.",
        technical: {
          distanceKm: 28.1,
          elevationGainM: 680,
          movingTimeMin: 175,
          difficulty: "impegnativa",
          terrain: "misto"
        },
        expenses: [
          { title: "Degustazione Brunello", amount: 24, category: "attivita" }
        ]
      },
      {
        title: "Relax e visita Pienza",
        activityType: "visita",
        dayNumber: 3,
        sequence: 1,
        startAt: "2026-03-15T10:00:00",
        endAt: "2026-03-15T14:00:00",
        location: "Pienza",
        description: "Giornata leggera, borgo rinascimentale e pecorino.",
        expenses: [
          { title: "Pranzo osteria", amount: 26, category: "cibo" }
        ]
      }
    ]
  },
  {
    ownerEmail: "demo.admin@example.com",
    title: "Giappone autunno",
    category: "vacanza",
    status: "planned",
    startDate: "2026-11-01",
    endDate: "2026-11-15",
    locationSummary: "Tokyo, Kyoto, Osaka, Hiroshima",
    description: "15 giorni tra cultura, gastronomia e foliage autunnale.",
    notes: "Prenotare voli entro giugno. JR Pass da comprare in anticipo.",
    stages: []
  },
  {
    ownerEmail: "demo.admin@example.com",
    title: "Ferrata Michielli-Strobel",
    category: "escursione",
    status: "completed",
    startDate: "2026-02-28",
    endDate: "2026-02-28",
    locationSummary: "Monte Schiara, Dolomiti Bellunesi",
    description: "Ferrata impegnativa con tratti verticali e viste spettacolari.",
    notes: "Usare casco e imbragatura. Non adatta a neofiti.",
    stages: [
      {
        title: "Avvicinamento da Pian de Fontana",
        activityType: "trek",
        dayNumber: 1,
        sequence: 1,
        startAt: "2026-02-28T06:30:00",
        endAt: "2026-02-28T09:00:00",
        location: "Pian de Fontana",
        description: "Sentiero di avvicinamento alla base della ferrata.",
        technical: {
          distanceKm: 4.8,
          elevationGainM: 480,
          movingTimeMin: 110,
          difficulty: "media",
          terrain: "sentiero"
        },
        expenses: []
      },
      {
        title: "Ferrata Michielli-Strobel",
        activityType: "outdoor",
        dayNumber: 1,
        sequence: 2,
        startAt: "2026-02-28T09:00:00",
        endAt: "2026-02-28T14:00:00",
        location: "Monte Schiara",
        description: "Tratti verticali su roccia fino alla vetta a 2565m.",
        technical: {
          distanceKm: 3.2,
          elevationGainM: 820,
          movingTimeMin: 240,
          difficulty: "esperto",
          terrain: "sentiero",
          gpxUrl: "https://example.org/gpx/ferrata-michielli"
        },
        expenses: []
      },
      {
        title: "Discesa e pranzo al sacco",
        activityType: "trek",
        dayNumber: 1,
        sequence: 3,
        startAt: "2026-02-28T14:30:00",
        endAt: "2026-02-28T17:00:00",
        location: "Val di Piero",
        description: "Rientro per sentiero alternativo.",
        technical: {
          distanceKm: 5.5,
          movingTimeMin: 90,
          terrain: "sentiero"
        },
        expenses: [
          { title: "Parcheggio", amount: 5, category: "trasporto" }
        ]
      }
    ]
  }
];

const seedTrips = async (): Promise<number> => {
  let createdTrips = 0;

  for (const tripData of DEMO_TRIPS) {
    const owner = await User.findOne({ email: tripData.ownerEmail });
    if (!owner) continue;

    const existingTrip = await Trip.findOne({
      owner: owner._id,
      title: tripData.title
    });

    if (existingTrip) continue;

    await Trip.create({
      owner: owner._id,
      title: tripData.title,
      category: tripData.category,
      status: tripData.status,
      startDate: new Date(tripData.startDate),
      endDate: new Date(tripData.endDate),
      locationSummary: tripData.locationSummary,
      description: tripData.description,
      notes: tripData.notes ?? undefined,
      stages: tripData.stages as unknown[]
    });

    createdTrips += 1;
  }

  return createdTrips;
};

export const seedMockData = async (): Promise<void> => {
  if (!shouldSeedMockData()) {
    console.log("[mock-seed] Skipped (SEED_MOCK_DATA=false)");
    return;
  }

  let created = 0;

  for (const userData of MOCK_USERS) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) continue;

    await User.create({
      email: userData.email,
      passwordHash: userData.password,
      name: userData.name,
      role: userData.role
    });
    created += 1;
  }

  console.log(
    `[mock-seed] Ready. Created ${created}/${MOCK_USERS.length} users.`
  );

  const createdTrips = await seedTrips();
  console.log(
    `[mock-seed] Ready. Created ${createdTrips}/${DEMO_TRIPS.length} trips.`
  );
};
