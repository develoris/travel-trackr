import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer = null;
let currentUri = null;

export const startTestDatabase = async (dbName = "travel-trackr-test") => {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
    currentUri = memoryServer.getUri(dbName);
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(currentUri);
  }

  return currentUri;
};

export const clearTestDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
  }
};

export const stopTestDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (memoryServer) {
    await memoryServer.stop({ doCleanup: true, force: true });
    memoryServer = null;
    currentUri = null;
  }
};
