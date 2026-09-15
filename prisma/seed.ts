import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Brice321", 10);

  const admin = await prisma.profile.upsert({
    where: { email: "bricemunji06@gmail.com" },
    update: {
      passwordHash: hashedPassword,
      role: "ADMIN",
      disabled: false,
    },
    create: {
      email: "bricemunji06@gmail.com",
      name: "Brice Munji",
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Seeded Admin user:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });