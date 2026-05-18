import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPw     = await bcrypt.hash('admin123', 10);
  const residentPw  = await bcrypt.hash('12345678', 10);

  // ── Admin account (upsert — keep created_at, never re-hash password) ──
  await prisma.user.upsert({
    where:     { username: 'admin' },
    update:    { fullName: 'System Administrator' },
    create:    { fullName: 'System Administrator', username: 'admin', password: adminPw, role: 'ADMIN' }
  });
  console.log('Admin user: admin / admin123');

  // ── Resident login account — password only set on create, never on update ──
  await prisma.user.upsert({
    where:     { username: 'resident' },
    update:    {},                              // keep existing password, only match create on first run
    create:    { fullName: 'Default Resident', username: 'resident', password: residentPw, role: 'RESIDENT' }
  });
  console.log('Resident user: resident / 12345678');

  // ── Remove any stray user accounts ──
  const all = await prisma.user.findMany({ select: { id: true, username: true } });
  let removed = 0;
  for (const u of all) {
    if (u.username !== 'admin' && u.username !== 'resident') {
      await prisma.user.delete({ where: { id: u.id } });
      removed++;
    }
  }
  if (removed) console.log(`Removed ${removed} stray user(s)`);

  console.log('\nSeed complete.');
}

main()
  .catch(console.error)
  .finally(async () => { await prisma.$disconnect(); });
