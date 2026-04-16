import mongoose from "mongoose";
let disconnectPromise: Promise<void> | null = null;

export interface ConnectResult {
  mongoUrl: string;
}

export const connectDatabase = async (): Promise<ConnectResult> => {
  const mongoUrl =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/travel-trackr";

  await mongoose.connect(mongoUrl, {
    dbName: process.env.MONGODB_DB_NAME || "travel-trackr"
  });
  return { mongoUrl };
};

export const disconnectDatabase = async (): Promise<void> => {
  if (disconnectPromise) {
    return disconnectPromise;
  }

  disconnectPromise = (async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  })();

  try {
    await disconnectPromise;
  } finally {
    disconnectPromise = null;
  }
};
