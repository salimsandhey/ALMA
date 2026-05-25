import { prisma } from '../lib/prisma'

export async function awardXP(userId: string, amount: number): Promise<number> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { xpTotal: { increment: amount } },
    select: { xpTotal: true },
  })
  return updated.xpTotal
}

export async function updateStreak(userId: string): Promise<{ streakCount: number; dailyVisitBonus: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true, lastActiveDate: true },
  })

  if (!user) return { streakCount: 0, dailyVisitBonus: false }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let newStreak = 1

  if (user.lastActiveDate) {
    const last = new Date(user.lastActiveDate)
    last.setHours(0, 0, 0, 0)

    if (last.getTime() === today.getTime()) {
      return { streakCount: user.streakCount, dailyVisitBonus: false }
    }

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    newStreak = last.getTime() === yesterday.getTime() ? user.streakCount + 1 : 1
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { streakCount: newStreak, lastActiveDate: today },
    select: { streakCount: true },
  })

  // Award 10 bonus pts at every 5th daily visit
  let dailyVisitBonus = false
  if (newStreak % 5 === 0) {
    await awardXP(userId, 10)
    dailyVisitBonus = true
  }

  return { streakCount: updated.streakCount, dailyVisitBonus }
}
