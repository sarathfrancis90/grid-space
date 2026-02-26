import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Seeding database...");

  // Create test user
  // Note: In production, passwords are hashed with bcrypt.
  // This seed uses a placeholder hash for development only.
  const testUser = await prisma.user.upsert({
    where: { email: "test@gridspace.app" },
    update: {},
    create: {
      email: "test@gridspace.app",
      name: "Test User",
      // bcrypt hash of "password123" (10 rounds)
      passwordHash:
        "$2b$10$LQv3c1yqBo8HBMQNOPe8kuBFkL7pHBWcQYKg.0Jsd1c6V9d6WOEK6",
      emailVerified: true,
    },
  });

  console.log(`Created test user: ${testUser.email} (${testUser.id})`);

  // Create sample spreadsheet
  const spreadsheet = await prisma.spreadsheet.upsert({
    where: { id: "seed-spreadsheet-1" },
    update: {},
    create: {
      id: "seed-spreadsheet-1",
      title: "Sample Spreadsheet",
      ownerId: testUser.id,
    },
  });

  console.log(`Created spreadsheet: ${spreadsheet.title} (${spreadsheet.id})`);

  // Create Sheet 1 with sample data
  await prisma.sheet.upsert({
    where: {
      spreadsheetId_index: {
        spreadsheetId: spreadsheet.id,
        index: 0,
      },
    },
    update: {},
    create: {
      spreadsheetId: spreadsheet.id,
      name: "Sheet1",
      index: 0,
      cellData: {
        A1: { value: "Name" },
        B1: { value: "Age" },
        C1: { value: "City" },
        A2: { value: "Alice" },
        B2: { value: 30 },
        C2: { value: "New York" },
        A3: { value: "Bob" },
        B3: { value: 25 },
        C3: { value: "San Francisco" },
        A4: { value: "Charlie" },
        B4: { value: 35 },
        C4: { value: "Chicago" },
        A5: { value: "Total", formula: null },
        B5: { value: 90, formula: "=SUM(B2:B4)" },
      },
    },
  });

  // Create Sheet 2
  await prisma.sheet.upsert({
    where: {
      spreadsheetId_index: {
        spreadsheetId: spreadsheet.id,
        index: 1,
      },
    },
    update: {},
    create: {
      spreadsheetId: spreadsheet.id,
      name: "Sheet2",
      index: 1,
      cellData: {
        A1: { value: "Notes" },
        A2: { value: "This is a sample spreadsheet for development." },
      },
    },
  });

  console.log("Created 2 sheets with sample data");

  // Create owner access record
  await prisma.spreadsheetAccess.upsert({
    where: {
      spreadsheetId_userId: {
        spreadsheetId: spreadsheet.id,
        userId: testUser.id,
      },
    },
    update: {},
    create: {
      spreadsheetId: spreadsheet.id,
      userId: testUser.id,
      role: "owner",
    },
  });

  console.log("Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
