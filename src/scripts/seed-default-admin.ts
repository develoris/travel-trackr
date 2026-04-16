import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { User } from "../modules/user/user.model.js";

const DEFAULT_ADMIN_EMAIL =
  process.env.DEFAULT_ADMIN_EMAIL || "admin@travel-trackr.local";
const DEFAULT_ADMIN_PASSWORD =
  process.env.DEFAULT_ADMIN_PASSWORD || "ChangeMe123!";
const DEFAULT_ADMIN_NAME =
  process.env.DEFAULT_ADMIN_NAME || "Default Admin";

const seedDefaultAdmin = async (): Promise<void> => {
  await connectDatabase();

  const email = DEFAULT_ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(
      `[default-admin] Skipped. User already exists: ${existing.email} (role=${existing.role})`
    );
    return;
  }

  await User.create({
    email,
    passwordHash: DEFAULT_ADMIN_PASSWORD,
    name: DEFAULT_ADMIN_NAME,
    role: "admin",
    mustChangePassword: true,
    temporaryPasswordIssuedAt: new Date(),
    isBlocked: false
  });

  console.log(
    `[default-admin] Created admin user ${email}. Temporary password has been set.`
  );
};

seedDefaultAdmin()
  .catch((error) => {
    console.error("[default-admin] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
