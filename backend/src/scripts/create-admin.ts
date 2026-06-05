import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@alma.com'
  const password = 'Admin@1234'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } })
      console.log(`Promoted ${email} to ADMIN`)
    } else {
      console.log(`Admin already exists: ${email}`)
    }
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: 'Admin',
      role: 'ADMIN',
      isEmailVerified: true,
      isOnboardingComplete: true,
      isActive: true,
    },
  })

  console.log('Admin created successfully!')
  console.log('Email:   ', email)
  console.log('Password:', password)
}

main().catch(console.error).finally(() => prisma.$disconnect())
