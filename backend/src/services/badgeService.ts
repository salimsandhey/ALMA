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

type BadgeCheckOptions = {
  hasPerfectLessonScore?: boolean
  hasModuleWithAllPerfect?: boolean
}

export async function checkAndAwardBadges(
  userId: string,
  options: BadgeCheckOptions = {},
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      lessonProgress: {
        where: { isCompleted: true },
        include: { lesson: { select: { moduleId: true, gameType: true } } },
      },
      moduleProgress: { where: { isCompleted: true }, include: { module: { select: { orderIndex: true } } } },
      entertainmentAttempts: { select: { id: true } },
    },
  })
  if (!user) return []

  const awarded: string[] = []

  const completedLessons = user.lessonProgress.length
  const completedDialogueLessons = user.lessonProgress.filter(
    (progress) => progress.lesson.gameType === 'DIALOGUE',
  ).length
  const completedModules = user.moduleProgress.length
  const entertainmentAttempts = user.entertainmentAttempts.length

  // Hotel & Hospitality is orderIndex 9
  const completedHotel = user.moduleProgress.some((mp) => mp.module.orderIndex === 9)

  const checks: { condition: string; met: boolean }[] = [
    { condition: 'complete_first_lesson', met: completedLessons >= 1 },
    { condition: 'complete_first_dialogue', met: completedDialogueLessons >= 1 },
    { condition: 'complete_module_hotel', met: completedHotel },
    { condition: 'complete_10_lessons', met: completedLessons >= 10 },
    { condition: 'quiz_perfect_score', met: options.hasPerfectLessonScore === true },
    { condition: 'streak_3', met: user.streakCount >= 3 },
    { condition: 'streak_7', met: user.streakCount >= 7 },
    { condition: 'streak_30', met: user.streakCount >= 30 },
    { condition: 'complete_half_modules', met: completedModules >= 6 },
    { condition: 'complete_all_modules', met: completedModules >= 11 },
    { condition: 'perfect_module', met: options.hasModuleWithAllPerfect === true },
    { condition: 'first_entertainment', met: entertainmentAttempts >= 1 },
  ]

  for (const check of checks) {
    if (check.met) {
      const name = await evaluateAndAward(userId, check.condition)
      if (name) awarded.push(name)
    }
  }

  return awarded
}
