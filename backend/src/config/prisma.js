import { PrismaClient } from "../../prisma/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  // Explicit pool config to prevent pool exhaustion under high concurrency
  max: parseInt(process.env.DATABASE_POOL_SIZE) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
