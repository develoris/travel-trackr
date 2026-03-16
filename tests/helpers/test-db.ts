import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer: MongoMemoryServer | null = null;
let currentUri: string | null = null;

export const startTestDatabase = async (
  dbName = "travel-trackr-test"
): Promise<string> => {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
    currentUri = memoryServer.getUri(dbName);
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(currentUri!);
  }

  return currentUri!;
};

export const clearTestDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
  }
};

export const stopTestDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (memoryServer) {
    await memoryServer.stop({ doCleanup: true, force: true });
    memoryServer = null;
    currentUri = null;
  }
};
