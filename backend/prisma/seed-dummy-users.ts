import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DUMMY_USERS = [
  { displayName: 'Sheilah M. Torres',   email: 'sheilah@dummy.alma',   country: 'PH', xpTotal: 2270, streakCount: 14 },
  { displayName: 'Jacquelin E. Bellido',email: 'jacquelin@dummy.alma', country: 'PH', xpTotal: 1650, streakCount: 9  },
  { displayName: 'Wesley U. Seufer',    email: 'wesley@dummy.alma',    country: 'PH', xpTotal: 820,  streakCount: 5  },
  { displayName: 'Tessa V. Rebecchi',   email: 'tessa@dummy.alma',     country: 'PH', xpTotal: 680,  streakCount: 7  },
  { displayName: 'Latricia W. Silletti',email: 'latricia@dummy.alma',  country: 'PH', xpTotal: 450,  streakCount: 4  },
  { displayName: 'Estell P. Lolo',      email: 'estell@dummy.alma',    country: 'PH', xpTotal: 120,  streakCount: 3  },
  { displayName: 'Elvira E. Aus',       email: 'elvira@dummy.alma',    country: 'PH', xpTotal: 97,   streakCount: 2  },
  { displayName: 'Florine H. Kotoff',   email: 'florine@dummy.alma',   country: 'PH', xpTotal: 64,   streakCount: 2  },
  { displayName: 'Samantha C. Umphries',email: 'samantha@dummy.alma',  country: 'PH', xpTotal: 40,   streakCount: 1  },
  { displayName: 'Vonnie G. Simeus',    email: 'vonnie@dummy.alma',    country: 'PH', xpTotal: 10,   streakCount: 1  },
  { displayName: 'Alta H. Desroche',    email: 'alta@dummy.alma',      country: 'PH', xpTotal: 10,   streakCount: 1  },
  { displayName: 'Margert J. Swon',     email: 'margert@dummy.alma',   country: 'PH', xpTotal: 10,   streakCount: 1  },
  { displayName: 'Judi E. Ravert',      email: 'judi@dummy.alma',      country: 'PH', xpTotal: 10,   streakCount: 1  },
  { displayName: 'Shari Y. Pento',      email: 'shari@dummy.alma',     country: 'PH', xpTotal: 10,   streakCount: 1  },
  { displayName: 'Robt P. Delvalle',    email: 'robt@dummy.alma',      country: 'PH', xpTotal: 5,    streakCount: 1  },
]

async function main() {
  console.log('Seeding dummy users...')
  for (const u of DUMMY_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { xpTotal: u.xpTotal, streakCount: u.streakCount },
      create: {
        email: u.email,
        displayName: u.displayName,
        country: u.country,
        xpTotal: u.xpTotal,
        streakCount: u.streakCount,
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: true,
        isOnboardingComplete: true,
      },
    })
    console.log(`  ✓ ${u.displayName} (${u.xpTotal} XP)`)
  }
  console.log('Done.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
