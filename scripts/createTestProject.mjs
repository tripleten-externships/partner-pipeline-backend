import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a test project
  const project = await prisma.project.create({
    data: {
      name: "Test Project",
      project: "test-project",
      isActive: true,
    },
  });

  console.log("Created project:", project);
  console.log("Project ID:", project.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
