import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('⚠️  PRODUCTION USER RESET — deleting all user data...\n')

  const [
    aiLogs,
    entertainmentAttempts,
    challengeAttempts,
    userBadges,
    feedbacks,
    lessonProgress,
    moduleProgress,
    otpCodes,
    users,
  ] = await Promise.all([
    prisma.aIUsageLog.deleteMany(),
    prisma.entertainmentAttempt.deleteMany(),
    prisma.dailyChallengeAttempt.deleteMany(),
    prisma.userBadge.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.lessonProgress.deleteMany(),
    prisma.moduleProgress.deleteMany(),
    prisma.oTPCode.deleteMany(),
    prisma.user.deleteMany(),
  ])

  console.log(`✓ ${aiLogs.count} AI usage logs deleted`)
  console.log(`✓ ${entertainmentAttempts.count} entertainment attempts deleted`)
  console.log(`✓ ${challengeAttempts.count} daily challenge attempts deleted`)
  console.log(`✓ ${userBadges.count} user badges deleted`)
  console.log(`✓ ${feedbacks.count} feedback entries deleted`)
  console.log(`✓ ${lessonProgress.count} lesson progress records deleted`)
  console.log(`✓ ${moduleProgress.count} module progress records deleted`)
  console.log(`✓ ${otpCodes.count} OTP codes deleted`)
  console.log(`✓ ${users.count} users deleted`)

  console.log('\n✅ All user data cleared. Modules, lessons, challenges, and content untouched.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
