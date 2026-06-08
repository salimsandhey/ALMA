import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding test user...')

  const passwordHash = await bcrypt.hash('Admin@123', 10)

  await prisma.user.upsert({
    where: { email: 'test@alma.com' },
    update: { passwordHash },
    create: {
      email: 'test@alma.com',
      displayName: 'Test User',
      passwordHash,
      role: 'STUDENT',
      isActive: true,
      isEmailVerified: true,
      isOnboardingComplete: true,
    },
  })

  console.log('  ✓ test@alma.com / Admin@123')
  console.log('Done.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
