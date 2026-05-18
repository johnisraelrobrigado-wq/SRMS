import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin login account — no resident profile
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { fullName: 'System Administrator' },
    create: {
      fullName: 'System Administrator',
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN'
    }
  });
  console.log('Created/updated admin user: admin');

  // Resident login account — no resident profile
  await prisma.user.upsert({
    where: { username: 'resident' },
    update: { fullName: 'Default Resident' },
    create: {
      fullName: 'Default Resident',
      username: 'resident',
      password: await bcrypt.hash('12345678', 10),
      role: 'RESIDENT'
    }
  });
  console.log('Created/updated resident user: resident');

  // Delete any other stray user accounts
  const all = await prisma.user.findMany({ select: { id: true, username: true } });
  for (const u of all) {
    if (u.username !== 'admin' && u.username !== 'resident') {
      await prisma.user.delete({ where: { id: u.id } });
      console.log('Deleted stray user:', u.username);
    }
  }

  console.log('\nSeed complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
