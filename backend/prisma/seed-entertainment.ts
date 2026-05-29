import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding entertainment content...')

  await prisma.entertainmentContent.deleteMany()

  const videos = [
    {
      type: 'VIDEO' as const,
      title: 'Two Minute English: At a Hotel',
      description: '2 min 15 sec — Short, focused hotel English conversations for beginners.',
      url: 'https://www.youtube.com/watch?v=UQFbdxkOR_M',
      duration: '2 min 15 sec',
      xpReward: 30,
      orderIndex: 1,
      questions: [
        {
          question: 'When a guest needs something brought to their room, which hotel service are they talking to?',
          expectedAnswer: 'Room service or housekeeping',
          keywords: ['room service', 'housekeeping', 'room'],
          orderIndex: 1,
        },
        {
          question: 'What must a user do while watching this video to build fluency?',
          expectedAnswer: 'Repeat the words and phrases aloud',
          keywords: ['repeat', 'aloud', 'say', 'practice', 'speak'],
          orderIndex: 2,
        },
      ],
    },
    {
      type: 'VIDEO' as const,
      title: 'Two Minute English: Booking and Vacations',
      description: '4 min — Learn how to talk about booking trips and vacation planning in English.',
      url: 'https://www.youtube.com/watch?v=GxJzTpfBPwA',
      duration: '4 min',
      xpReward: 30,
      orderIndex: 2,
      questions: [
        {
          question: 'What phrase would you use to ask if a hotel room is available for a specific date?',
          expectedAnswer: 'Do you have any rooms available?',
          keywords: ['available', 'rooms', 'vacancy', 'booking'],
          orderIndex: 1,
        },
        {
          question: 'What information do you typically need to give when making a hotel reservation?',
          expectedAnswer: 'Your name, dates of stay, and number of guests',
          keywords: ['name', 'dates', 'guests', 'check-in', 'check in'],
          orderIndex: 2,
        },
      ],
    },
    {
      type: 'VIDEO' as const,
      title: 'Oxford Online English: Rapid Hotel Check-In',
      description: '~4 min roleplay — Professional check-in conversation with tone and hospitality tips.',
      url: 'https://www.youtube.com/watch?v=7a5nPMB5lBk',
      duration: '~4 min',
      xpReward: 30,
      orderIndex: 3,
      questions: [
        {
          question: 'What is the first thing a front desk agent should say when a guest approaches?',
          expectedAnswer: 'Welcome or good morning/afternoon, how can I help you?',
          keywords: ['welcome', 'good morning', 'good afternoon', 'help', 'assist'],
          orderIndex: 1,
        },
        {
          question: 'What document does a guest usually need to present at hotel check-in?',
          expectedAnswer: 'A passport or ID card',
          keywords: ['passport', 'id', 'identification', 'document'],
          orderIndex: 2,
        },
      ],
    },
    {
      type: 'VIDEO' as const,
      title: 'Easy English: Short Fast-Food Transactions',
      description: '3 min 30 sec — Simple, slow-paced fast-food ordering conversations for learners.',
      url: 'https://www.youtube.com/watch?v=E7U7FoQXPrc',
      duration: '3 min 30 sec',
      xpReward: 30,
      orderIndex: 4,
      questions: [
        {
          question: 'What is a polite way to ask for the total amount owed at a fast-food counter?',
          expectedAnswer: 'How much is that? or What is the total?',
          keywords: ['total', 'how much', 'price', 'cost'],
          orderIndex: 1,
        },
        {
          question: 'How do you ask if an item is available when ordering food?',
          expectedAnswer: 'Do you have or Is there available?',
          keywords: ['do you have', 'available', 'have', 'stock'],
          orderIndex: 2,
        },
      ],
    },
    {
      type: 'VIDEO' as const,
      title: 'Everyday English: Handling a Quick Amenity Request',
      description: '3 min — Learn how hotel staff handle in-house guest requests professionally.',
      url: 'https://www.youtube.com/watch?v=2VsTrA1SYEQ',
      duration: '3 min',
      xpReward: 30,
      orderIndex: 5,
      questions: [
        {
          question: 'What should you say when a guest asks for extra towels and you are about to fulfill the request?',
          expectedAnswer: 'Certainly, I will have that brought to your room right away.',
          keywords: ['certainly', 'right away', 'of course', 'bring', 'deliver'],
          orderIndex: 1,
        },
        {
          question: 'How long should a guest typically wait for an in-room amenity request?',
          expectedAnswer: 'A few minutes or as soon as possible',
          keywords: ['minutes', 'soon', 'shortly', 'quickly', 'right away'],
          orderIndex: 2,
        },
      ],
    },
  ]

  const articles = [
    {
      type: 'ARTICLE' as const,
      title: 'EnglishClub: 2-Minute Hotel Check-In Dialogue',
      description: 'A short, clear hotel check-in and check-out dialogue. Perfect for front desk vocabulary.',
      url: 'https://www.englishclub.com/english-for-work/hotel-check-in.php',
      duration: null,
      xpReward: 30,
      orderIndex: 6,
      questions: [
        {
          question: 'What phrase does the receptionist use to greet a guest checking in?',
          expectedAnswer: 'Good morning, can I help you? or Welcome to our hotel.',
          keywords: ['good morning', 'welcome', 'help', 'check in', 'checking in'],
          orderIndex: 1,
        },
        {
          question: 'What does the receptionist ask for before handing over the room key?',
          expectedAnswer: 'A credit card or ID for deposit',
          keywords: ['credit card', 'id', 'passport', 'deposit', 'identification'],
          orderIndex: 2,
        },
      ],
    },
    {
      type: 'ARTICLE' as const,
      title: 'British Council: Hotel Amenities Picture Match',
      description: 'Match hotel amenity pictures to vocabulary. Great for learning facility names.',
      url: 'https://learnenglish.britishcouncil.org/vocabulary/beginner-to-pre-intermediate/hotel',
      duration: null,
      xpReward: 30,
      orderIndex: 7,
      questions: [
        {
          question: 'If a guest wants to dry themselves after a shower, what should you bring them?',
          expectedAnswer: 'A towel',
          keywords: ['towel', 'bath towel', 'dry'],
          orderIndex: 1,
        },
        {
          question: 'What is the name of the place near the hotel entrance where guests check-in?',
          expectedAnswer: 'Reception or Front desk',
          keywords: ['reception', 'front desk', 'lobby', 'check in'],
          orderIndex: 2,
        },
      ],
    },
    {
      type: 'ARTICLE' as const,
      title: 'ThoughtCo: The 60-Second Restaurant Script',
      description: 'A direct, practical restaurant dialogue script for ESL learners.',
      url: 'https://www.thoughtco.com/restaurant-english-1210136',
      duration: null,
      xpReward: 30,
      orderIndex: 8,
      questions: [
        {
          question: 'What is the first thing a waiter says when a customer sits down at a restaurant?',
          expectedAnswer: 'Good evening, welcome. Can I take your order or what would you like?',
          keywords: ['welcome', 'order', 'what would you like', 'ready to order', 'help you'],
          orderIndex: 1,
        },
        {
          question: 'How do you ask for the bill at the end of a restaurant meal?',
          expectedAnswer: 'Can I have the bill please? or Check please.',
          keywords: ['bill', 'check', 'pay', 'receipt'],
          orderIndex: 2,
        },
      ],
    },
    {
      type: 'ARTICLE' as const,
      title: 'EnglishClub: Front Desk Phone Bookings',
      description: 'Learn how to handle hotel reservation calls with professional English phrases.',
      url: 'https://www.englishclub.com/english-for-work/hotel-reservations.php',
      duration: null,
      xpReward: 30,
      orderIndex: 9,
      questions: [
        {
          question: 'How should a hotel receptionist answer the phone professionally?',
          expectedAnswer: 'Good morning, thank you for calling. How may I assist you?',
          keywords: ['good morning', 'thank you', 'calling', 'assist', 'help'],
          orderIndex: 1,
        },
        {
          question: 'What key information must you confirm when taking a phone reservation?',
          expectedAnswer: 'The guest name, arrival date, departure date, and room type',
          keywords: ['name', 'arrival', 'departure', 'date', 'room', 'check in', 'check out'],
          orderIndex: 2,
        },
      ],
    },
    {
      type: 'ARTICLE' as const,
      title: 'Global English Test: Core Hotel Booking Terms',
      description: 'Essential vocabulary guide for hotel bookings and guest services.',
      url: 'https://globalenglishtest.com/hotel-vocabulary',
      duration: null,
      xpReward: 30,
      orderIndex: 10,
      questions: [
        {
          question: 'What does "complimentary" mean in a hotel context?',
          expectedAnswer: 'Free or included at no extra charge',
          keywords: ['free', 'no charge', 'included', 'no cost', 'complimentary'],
          orderIndex: 1,
        },
        {
          question: 'What is the difference between a single room and a double room?',
          expectedAnswer: 'A single room has one bed and a double room has a larger bed or two beds.',
          keywords: ['one bed', 'two beds', 'larger bed', 'double bed', 'single bed'],
          orderIndex: 2,
        },
      ],
    },
  ]

  for (const item of [...videos, ...articles]) {
    const { questions, ...contentData } = item
    await prisma.entertainmentContent.create({
      data: {
        ...contentData,
        questions: {
          create: questions,
        },
      },
    })
    console.log(`  Created: ${contentData.title}`)
  }

  console.log('Entertainment seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
