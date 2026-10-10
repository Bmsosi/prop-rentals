import pkg from "@prisma/client";

// Prisma ships CommonJS; grab the pieces we need from the default export once.
const {
  PrismaClient,
  UserRole,
  LeaseStatus,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  PropertyCategory,
  ResidentialType,
  CommercialType,
  RentCycle,
  ApplicationStatus,
  PaymentType,
  PaymentStatus,
} = pkg;

const prisma = new PrismaClient();

try {
  await prisma.$connect();
  console.log("Database connected successfully");
} catch (error) {
  console.error("Database connection failed:", error.message);
  process.exit(1);
}

// Gracefully disconnect Prisma when Node exits
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export {
  prisma,
  PrismaClient,
  UserRole,
  LeaseStatus,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  PropertyCategory,
  ResidentialType,
  CommercialType,
  RentCycle,
  ApplicationStatus,
  PaymentType,
  PaymentStatus,
};
