import { prisma } from '../lib/prisma'

export async function awardXP(userId: string, amount: number): Promise<number> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { xpTotal: { increment: amount } },
    select: { xpTotal: true },
  })
  return updated.xpTotal
}

export async function updateStreak(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true, lastActiveDate: true },
  })

  if (!user) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (user.lastActiveDate) {
    const last = new Date(user.lastActiveDate)
    last.setHours(0, 0, 0, 0)

    if (last.getTime() === today.getTime()) return user.streakCount

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const newStreak = last.getTime() === yesterday.getTime() ? user.streakCount + 1 : 1

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { streakCount: newStreak, lastActiveDate: today },
      select: { streakCount: true },
    })
    return updated.streakCount
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { streakCount: 1, lastActiveDate: today },
    select: { streakCount: true },
  })
  return updated.streakCount
}
