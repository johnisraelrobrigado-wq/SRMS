import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const residentPassword = await bcrypt.hash('sanroque', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      fullName: 'System Administrator',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('Created admin user:', admin.username);

const resident = await prisma.user.upsert({
    where: { username: 'resident' },
    update: { fullName: 'Default Resident' },
    create: {
      fullName: 'Default Resident',
      username: 'resident',
      password: residentPassword,
      role: 'RESIDENT'
    }
  });

  console.log('Created resident user:', resident.username);

  // Ensure the resident user has a matching Resident profile
  await prisma.resident.upsert({
    where: { user_id: resident.id },
    update: { full_name: resident.fullName },
    create: {
      user_id: resident.id,
      full_name: resident.fullName,
      age: 0,
      gender: '',
      address: '',
      civil_status: 'Single',
      status: 'Active'
    }
  });

  console.log('Linked resident profile to user:', resident.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
