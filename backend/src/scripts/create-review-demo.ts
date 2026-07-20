// Creates (or resets) a pre-verified STUDENT demo account for App Store /
// Google Play review — so reviewers can log in directly without going
// through email OTP verification, and see a populated (not empty) app.
//
// Run with: npx ts-node --transpile-only src/scripts/create-review-demo.ts

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const email = 'reviewer@alma-demo.com'
const password = 'Review@1234'

async function main() {
  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'STUDENT',
      isEmailVerified: true,
      isOnboardingComplete: true,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      displayName: 'Demo Student',
      role: 'STUDENT',
      age: 24,
      nativeLanguage: 'Spanish',
      country: 'Spain',
      isEmailVerified: true,
      isOnboardingComplete: true,
      isActive: true,
      xpTotal: 240,
      streakCount: 4,
      lastActiveDate: new Date(),
    },
  })

  // ─── Give it some completed lessons + modules, so the app isn't empty ──────
  const modules = await prisma.module.findMany({
    orderBy: { orderIndex: 'asc' },
    take: 2,
    include: { lessons: { orderBy: { orderIndex: 'asc' } } },
  })

  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
        update: { isCompleted: true, xpEarned: lesson.xpReward, completedAt: new Date() },
        create: {
          userId: user.id,
          lessonId: lesson.id,
          isCompleted: true,
          xpEarned: lesson.xpReward,
          attemptCount: 1,
          completedAt: new Date(),
        },
      })
    }

    const allCompleted = mod.lessons.length > 0
    if (allCompleted) {
      await prisma.moduleProgress.upsert({
        where: { userId_moduleId: { userId: user.id, moduleId: mod.id } },
        update: { isCompleted: true, completedAt: new Date() },
        create: { userId: user.id, moduleId: mod.id, isCompleted: true, completedAt: new Date() },
      })
    }
  }

  // ─── Award a couple of badges ───────────────────────────────────────────────
  const badges = await prisma.badge.findMany({
    where: { condition: { in: ['complete_first_lesson', 'streak_3'] } },
  })
  for (const badge of badges) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: user.id, badgeId: badge.id } },
      update: {},
      create: { userId: user.id, badgeId: badge.id },
    })
  }

  console.log('Review demo account ready!')
  console.log('Email:   ', email)
  console.log('Password:', password)
}

main().catch(console.error).finally(() => prisma.$disconnect())
