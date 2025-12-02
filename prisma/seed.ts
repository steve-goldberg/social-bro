import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line no-console
  console.info('Seeding database...');

  // Create admin user
  const adminEmail = 'admin@socialbro.com';
  const adminPassword = 'admin123123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    // eslint-disable-next-line no-console
    console.info('Admin user already exists, skipping...');
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        inviteToken: null,
        createdAt: new Date(),
      },
    });

    // eslint-disable-next-line no-console
    console.info(`Created admin user: ${adminEmail}`);
  }

  // eslint-disable-next-line no-console
  console.info('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
