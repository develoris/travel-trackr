import { User } from "../modules/user/user.model.js";

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
};
