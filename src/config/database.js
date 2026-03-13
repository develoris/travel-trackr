import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer = null;
let disconnectPromise = null;

const useInMemoryDb = () => process.env.USE_IN_MEMORY_DB === "true";

export const connectDatabase = async () => {
  let mongoUrl = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/travel-trackr";

  if (useInMemoryDb()) {
    memoryServer = await MongoMemoryServer.create();
    mongoUrl = memoryServer.getUri("travel-trackr");
  }

  await mongoose.connect(mongoUrl);
  return { mongoUrl, isInMemory: useInMemoryDb() };
};

export const disconnectDatabase = async () => {
  if (disconnectPromise) {
    return disconnectPromise;
  }

  disconnectPromise = (async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    if (!memoryServer) {
      return;
    }

    const serverToStop = memoryServer;
    memoryServer = null;

    try {
      await serverToStop.stop({ doCleanup: true, force: true });
    } catch (error) {
      const message = String(error?.message || "");

      // Alcune versioni di mongodb-memory-server lanciano qui in caso di stop concorrenti.
      if (message.includes('instance.mongodProcess') || message.includes("Cannot cleanup")) {
        console.warn("[db] In-memory Mongo already stopping/stopped.");
        return;
      }

      throw error;
    }
  })();

  try {
    await disconnectPromise;
  } finally {
    disconnectPromise = null;
  }
};
