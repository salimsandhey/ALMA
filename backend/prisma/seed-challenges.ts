import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CHALLENGE_QUESTIONS = [
  {
    orderIndex: 1,
    question: 'How do you greet a guest at a hotel?',
    sampleAnswer: 'Welcome to our hotel',
    keywords: ['welcome', 'hotel', 'greet'],
    xpReward: 10,
  },
  {
    orderIndex: 2,
    question: 'What do you say when a guest checks in?',
    sampleAnswer: 'Good morning, welcome.',
    keywords: ['welcome', 'morning'],
    xpReward: 10,
  },
  {
    orderIndex: 3,
    question: 'How do you apologize to an unhappy guest?',
    sampleAnswer: "I'm very sorry for the inconvenience. Let me fix that right away.",
    keywords: ['sorry', 'apologize', 'fix', 'inconvenience'],
    xpReward: 10,
  },
  {
    orderIndex: 4,
    question: 'What is the word for a meal at the start of a restaurant order?',
    sampleAnswer: 'Appetizer',
    keywords: ['appetizer', 'starter'],
    xpReward: 10,
  },
  {
    orderIndex: 5,
    question: 'What do you call the special dish of the day?',
    sampleAnswer: 'The specialty of the day',
    keywords: ['specialty', 'special'],
    xpReward: 10,
  },
  {
    orderIndex: 6,
    question: 'How do you ask if a guest is ready to order?',
    sampleAnswer: 'Are you ready to order?',
    keywords: ['ready', 'order'],
    xpReward: 10,
  },
  {
    orderIndex: 7,
    question: 'What do you say when you bring the bill?',
    sampleAnswer: 'Here is your bill, sir. Thank you for dining with us.',
    keywords: ['bill', 'thank', 'dining'],
    xpReward: 10,
  },
  {
    orderIndex: 8,
    question: 'Name a unique animal found in Madagascar.',
    sampleAnswer: 'Lemur',
    keywords: ['lemur'],
    xpReward: 10,
  },
  {
    orderIndex: 9,
    question: 'What is the capital city of Madagascar?',
    sampleAnswer: 'Antananarivo',
    keywords: ['antananarivo'],
    xpReward: 10,
  },
  {
    orderIndex: 10,
    question: "How do you say 'mother tongue' in simple English?",
    sampleAnswer: 'It is the language you learned first at home.',
    keywords: ['first', 'home'],
    xpReward: 10,
  },
  {
    orderIndex: 11,
    question: "What does 'fluent' mean?",
    sampleAnswer: 'It means you can speak a language very well and easily.',
    keywords: ['speak', 'well', 'easily', 'language'],
    xpReward: 10,
  },
  {
    orderIndex: 12,
    question: 'How do you tell a tourist about the weather in Madagascar?',
    sampleAnswer: 'The weather in Madagascar is warm and tropical.',
    keywords: ['warm', 'tropical', 'weather'],
    xpReward: 10,
  },
  {
    orderIndex: 13,
    question: 'What do you call the list of food at a restaurant?',
    sampleAnswer: 'Menu',
    keywords: ['menu'],
    xpReward: 10,
  },
  {
    orderIndex: 14,
    question: "What is a 'reservation' in a hotel?",
    sampleAnswer: 'A reservation is a booking made in advance.',
    keywords: ['booking', 'advance', 'reservation'],
    xpReward: 10,
  },
  {
    orderIndex: 15,
    question: 'How do you offer help to a lost tourist?',
    sampleAnswer: 'Excuse me, can I help you?',
    keywords: ['help', 'excuse'],
    xpReward: 10,
  },
  {
    orderIndex: 16,
    question: 'What is the word for the extra money given for good service?',
    sampleAnswer: 'Tip',
    keywords: ['tip'],
    xpReward: 10,
  },
  {
    orderIndex: 17,
    question: 'How do you describe your hobby to a guest?',
    sampleAnswer: 'My hobby is photography. I love taking pictures of nature.',
    keywords: ['hobby', 'photography', 'pictures', 'nature'],
    xpReward: 10,
  },
  {
    orderIndex: 18,
    question: "What does 'check-in' mean at a hotel?",
    sampleAnswer: 'Check-in means when a guest arrives and registers at the hotel.',
    keywords: ['arrive', 'register', 'hotel', 'check'],
    xpReward: 10,
  },
  {
    orderIndex: 19,
    question: 'Name one famous landmark in Madagascar.',
    sampleAnswer: 'The Avenue of the Baobabs',
    keywords: ['baobab', 'avenue'],
    xpReward: 10,
  },
  {
    orderIndex: 20,
    question: 'What do you say to a guest who has a complaint?',
    sampleAnswer: 'I understand your concern. Let me find a solution right away.',
    keywords: ['understand', 'concern', 'solution'],
    xpReward: 10,
  },
  {
    orderIndex: 21,
    question: "What is a 'tour guide'?",
    sampleAnswer: 'A tour guide helps visitors explore a new place.',
    keywords: ['guide', 'visitors', 'explore'],
    xpReward: 10,
  },
  {
    orderIndex: 22,
    question: 'How do you recommend a local dish?',
    sampleAnswer: 'I recommend trying our local specialty. It is very delicious!',
    keywords: ['recommend', 'local', 'specialty', 'delicious'],
    xpReward: 10,
  },
  {
    orderIndex: 23,
    question: "What does 'souvenir' mean?",
    sampleAnswer: 'A souvenir is a small gift you buy to remember a trip.',
    keywords: ['gift', 'remember', 'trip', 'buy'],
    xpReward: 10,
  },
  {
    orderIndex: 24,
    question: "How do you say 'the weather is sunny today' naturally?",
    sampleAnswer: "It's a beautiful sunny day today!",
    keywords: ['sunny', 'beautiful', 'today'],
    xpReward: 10,
  },
  {
    orderIndex: 25,
    question: "What is a 'best friend'?",
    sampleAnswer: 'A best friend is your closest and most trusted friend.',
    keywords: ['closest', 'trusted', 'friend'],
    xpReward: 10,
  },
  {
    orderIndex: 26,
    question: "How do you politely ask someone's name?",
    sampleAnswer: 'May I ask your name please?',
    keywords: ['name', 'may', 'please'],
    xpReward: 10,
  },
  {
    orderIndex: 27,
    question: "What does 'passport' mean?",
    sampleAnswer: 'A passport is an official document needed to travel abroad.',
    keywords: ['passport', 'official', 'travel', 'abroad'],
    xpReward: 10,
  },
  {
    orderIndex: 28,
    question: 'How do you describe a hobby you enjoy?',
    sampleAnswer: 'In my free time, I enjoy hiking and exploring nature.',
    keywords: ['free time', 'enjoy', 'hiking'],
    xpReward: 10,
  },
  {
    orderIndex: 29,
    question: 'What do you say when a guest leaves the hotel?',
    sampleAnswer: 'Thank you for staying with us. We hope to see you again soon!',
    keywords: ['thank', 'staying', 'hope', 'see you again'],
    xpReward: 10,
  },
  {
    orderIndex: 30,
    question: 'What is the difference between breakfast, lunch, and dinner?',
    sampleAnswer: 'Breakfast is in the morning, lunch is at midday, and dinner is in the evening.',
    keywords: ['morning', 'midday', 'evening', 'breakfast', 'lunch', 'dinner'],
    xpReward: 10,
  },
]

async function main() {
  console.log('Seeding daily challenge questions...')

  for (const q of CHALLENGE_QUESTIONS) {
    await prisma.dailyChallenge.upsert({
      where: { orderIndex: q.orderIndex },
      update: {
        question: q.question,
        sampleAnswer: q.sampleAnswer,
        keywords: q.keywords,
        xpReward: q.xpReward,
      },
      create: q,
    })
  }

  console.log(`✓ Seeded ${CHALLENGE_QUESTIONS.length} daily challenge questions`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
