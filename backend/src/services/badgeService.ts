import { prisma } from '../lib/prisma'

export async function evaluateAndAward(userId: string, condition: string): Promise<string | null> {
  const badge = await prisma.badge.findFirst({ where: { condition } })
  if (!badge) return null

  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  })
  if (existing) return null

  await prisma.userBadge.create({ data: { userId, badgeId: badge.id } })
  return badge.name
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      lessonProgress: { where: { isCompleted: true } },
      moduleProgress: { where: { isCompleted: true } },
      userBadges: true,
    },
  })
  if (!user) return []

  const awarded: string[] = []
  const completedLessons = user.lessonProgress.length
  const completedModules = user.moduleProgress.length

  const checks: { condition: string; met: boolean }[] = [
    { condition: 'complete_first_lesson', met: completedLessons >= 1 },
    { condition: 'streak_3', met: user.streakCount >= 3 },
    { condition: 'streak_7', met: user.streakCount >= 7 },
    { condition: 'complete_1_module', met: completedModules >= 1 },
    { condition: 'complete_5_modules', met: completedModules >= 5 },
    { condition: 'complete_all_modules', met: completedModules >= 11 },
    { condition: 'leaderboard_top_10', met: false }, // checked separately
  ]

  for (const check of checks) {
    if (check.met) {
      const name = await evaluateAndAward(userId, check.condition)
      if (name) awarded.push(name)
    }
  }

  return awarded
}
