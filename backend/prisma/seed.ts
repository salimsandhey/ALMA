import { PrismaClient, GameType, ContentCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ─── 1. Badges ──────────────────────────────────────────────────────────────
  const badges = [
    { name: 'First Step',        description: 'Complete your first lesson',             condition: 'complete_first_lesson' },
    { name: 'Warm Up',           description: 'Complete your first warm-up session',    condition: 'complete_first_warmup' },
    { name: 'On a Roll',         description: 'Maintain a 3-day streak',                condition: 'streak_3' },
    { name: 'Week Warrior',      description: 'Maintain a 7-day streak',                condition: 'streak_7' },
    { name: 'Module Master',     description: 'Complete one full module',               condition: 'complete_1_module' },
    { name: 'Polyglot Path',     description: 'Complete five modules',                  condition: 'complete_5_modules' },
    { name: 'All In',            description: 'Complete all 11 modules',                condition: 'complete_all_modules' },
    { name: 'Chatterbox',        description: 'Send 50 messages to AI Coach',           condition: 'coach_messages_50' },
    { name: 'Pronunciation Pro', description: 'Score 90%+ on 10 pronunciation exercises', condition: 'pronunciation_90_10' },
    { name: 'Hospitality Hero',  description: 'Complete the Hotel & Hospitality module', condition: 'complete_module_hotel' },
    { name: 'Top Talker',        description: 'Reach top 10 on the leaderboard',        condition: 'leaderboard_top_10' },
    { name: 'Feedback Friend',   description: 'Submit feedback',                        condition: 'submit_feedback' },
  ]

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    })
  }

  // ─── 2. Modules with lessons ─────────────────────────────────────────────────

  const modulesData = [
    {
      title: 'Personal Information',
      description: 'Learn to introduce yourself and share basic personal details.',
      orderIndex: 1,
      lessons: [
        {
          title: 'Greetings Vocabulary',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Hello', translation: 'Bonjour', imageUrl: null, audioUrl: null, targetWord: 'hello' },
              { id: 'c2', word: 'My name is', translation: 'Je m\'appelle', imageUrl: null, audioUrl: null, targetWord: 'my name is' },
              { id: 'c3', word: 'Nice to meet you', translation: 'Enchanté', imageUrl: null, audioUrl: null, targetWord: 'nice to meet you' },
            ],
          },
        },
        {
          title: 'Introduce Yourself',
          orderIndex: 2,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [{
              id: 'c1',
              scenario: 'Meeting a new colleague at work.',
              turns: [
                { speaker: 'GUEST', text: 'Hi! What is your name?', expectedResponse: null, audioUrl: null },
                { speaker: 'USER', text: null, expectedResponse: 'My name is Alex. Nice to meet you!', audioUrl: null },
                { speaker: 'GUEST', text: 'Nice to meet you too! Where are you from?', expectedResponse: null, audioUrl: null },
                { speaker: 'USER', text: null, expectedResponse: 'I am from Madagascar. I work at a hotel here.', audioUrl: null },
              ],
            }],
          },
        },
        {
          title: 'About Me — Fill the Gaps',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'My ___ is Maria.', blankIndex: 1, correctAnswer: 'name', hint: 'What people call you' },
              { id: 'c2', sentenceTemplate: 'I am ___ years old.', blankIndex: 2, correctAnswer: 'twenty', hint: 'A number' },
            ],
          },
        },
        {
          title: 'Personal Info — Quick Check',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: 'Your first name is the name your family gives you at birth.', isTrue: true, explanation: 'Yes, your first name is also called your given name.' },
              { id: 'c2', statement: 'Your surname is the same as your first name.', isTrue: false, explanation: 'Your surname is your family name, not your first name.' },
            ],
          },
        },
        {
          title: 'Family Vocabulary',
          orderIndex: 5,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', imageUrl: null, correctWord: 'mother', distractors: ['father', 'sister', 'brother'] },
              { id: 'c2', imageUrl: null, correctWord: 'father', distractors: ['mother', 'uncle', 'aunt'] },
            ],
          },
        },
        {
          title: 'Describe Yourself',
          orderIndex: 6,
          gameType: GameType.IMAGE_SPEAK,
          content: {
            cards: [
              { id: 'c1', imageUrl: null, acceptedAnswers: ['hotel', 'reception', 'lobby'], prompt: 'Where do you work? Say it in English.' },
            ],
          },
        },
      ],
    },
    {
      title: 'Food & Drink',
      description: 'Learn vocabulary for food, drinks, and dining with guests.',
      orderIndex: 2,
      lessons: [
        { title: 'Food Vocabulary', orderIndex: 1, gameType: GameType.FLASHCARD, content: { cards: [{ id: 'c1', word: 'Breakfast', translation: 'Petit-déjeuner', imageUrl: null, audioUrl: null, targetWord: 'breakfast' }, { id: 'c2', word: 'Lunch', translation: 'Déjeuner', imageUrl: null, audioUrl: null, targetWord: 'lunch' }, { id: 'c3', word: 'Dinner', translation: 'Dîner', imageUrl: null, audioUrl: null, targetWord: 'dinner' }] } },
        { title: 'At the Restaurant', orderIndex: 2, gameType: GameType.DIALOGUE, content: { cards: [{ id: 'c1', scenario: 'A guest asks about the menu.', turns: [{ speaker: 'GUEST', text: 'Excuse me, what do you recommend?', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'I recommend the grilled fish. It is very fresh today.', audioUrl: null }] }] } },
        { title: 'Food Fill in the Blank', orderIndex: 3, gameType: GameType.FILL_BLANK, content: { cards: [{ id: 'c1', sentenceTemplate: 'Would you like ___ or sparkling water?', blankIndex: 3, correctAnswer: 'still', hint: 'The opposite of sparkling' }] } },
        { title: 'Food & Drink Match', orderIndex: 4, gameType: GameType.WORD_MATCH, content: { cards: [{ id: 'c1', imageUrl: null, correctWord: 'water', distractors: ['juice', 'coffee', 'tea'] }] } },
        { title: 'Describe the Dish', orderIndex: 5, gameType: GameType.IMAGE_SPEAK, content: { cards: [{ id: 'c1', imageUrl: null, acceptedAnswers: ['pizza', 'pasta', 'food'], prompt: 'What food do you see? Say it in English.' }] } },
      ],
    },
    { title: 'Pets & Animals', description: 'Vocabulary for animals common in hospitality and tourism contexts.', orderIndex: 3, lessons: [{ title: 'Animal Vocabulary', orderIndex: 1, gameType: GameType.FLASHCARD, content: { cards: [{ id: 'c1', word: 'Dog', translation: 'Chien', imageUrl: null, audioUrl: null, targetWord: 'dog' }, { id: 'c2', word: 'Cat', translation: 'Chat', imageUrl: null, audioUrl: null, targetWord: 'cat' }] } }, { title: 'Animal Match', orderIndex: 2, gameType: GameType.WORD_MATCH, content: { cards: [{ id: 'c1', imageUrl: null, correctWord: 'dog', distractors: ['cat', 'bird', 'fish'] }] } }, { title: 'Animal Facts', orderIndex: 3, gameType: GameType.TRUE_FALSE, content: { cards: [{ id: 'c1', statement: 'A dog is a common pet in many countries.', isTrue: true, explanation: 'Yes, dogs are one of the most popular pets worldwide.' }] } }, { title: 'Describe the Animal', orderIndex: 4, gameType: GameType.IMAGE_SPEAK, content: { cards: [{ id: 'c1', imageUrl: null, acceptedAnswers: ['bird', 'parrot'], prompt: 'What animal do you see?' }] } }, { title: 'Pets Dialogue', orderIndex: 5, gameType: GameType.DIALOGUE, content: { cards: [{ id: 'c1', scenario: 'A guest asks if pets are allowed.', turns: [{ speaker: 'GUEST', text: 'Do you allow pets at this hotel?', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'Yes, we welcome small pets. There is an extra charge of ten dollars per night.', audioUrl: null }] }] } }] },
    { title: 'Friends & Social Life', description: 'Language for making friends and talking about social activities.', orderIndex: 4, lessons: [{ title: 'Social Vocabulary', orderIndex: 1, gameType: GameType.FLASHCARD, content: { cards: [{ id: 'c1', word: 'Friend', translation: 'Ami', imageUrl: null, audioUrl: null, targetWord: 'friend' }, { id: 'c2', word: 'Party', translation: 'Fête', imageUrl: null, audioUrl: null, targetWord: 'party' }] } }, { title: 'Making Plans', orderIndex: 2, gameType: GameType.DIALOGUE, content: { cards: [{ id: 'c1', scenario: 'Inviting a colleague to lunch.', turns: [{ speaker: 'GUEST', text: 'Are you free for lunch today?', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'Yes, I am free at one o\'clock. Where would you like to go?', audioUrl: null }] }] } }, { title: 'Social Fill Blank', orderIndex: 3, gameType: GameType.FILL_BLANK, content: { cards: [{ id: 'c1', sentenceTemplate: 'We are going to ___ tonight.', blankIndex: 3, correctAnswer: 'celebrate', hint: 'To mark a special occasion' }] } }, { title: 'Social True False', orderIndex: 4, gameType: GameType.TRUE_FALSE, content: { cards: [{ id: 'c1', statement: 'In English, "How are you?" is a common greeting.', isTrue: true, explanation: 'Yes, it is one of the most common English greetings.' }] } }, { title: 'Social Word Match', orderIndex: 5, gameType: GameType.WORD_MATCH, content: { cards: [{ id: 'c1', imageUrl: null, correctWord: 'smile', distractors: ['frown', 'wave', 'nod'] }] } }] },
    { title: 'Hobbies & Entertainment', description: 'Talk about hobbies and entertainment with guests.', orderIndex: 5, lessons: [{ title: 'Hobbies Vocabulary', orderIndex: 1, gameType: GameType.FLASHCARD, content: { cards: [{ id: 'c1', word: 'Swimming', translation: 'Natation', imageUrl: null, audioUrl: null, targetWord: 'swimming' }, { id: 'c2', word: 'Reading', translation: 'Lecture', imageUrl: null, audioUrl: null, targetWord: 'reading' }] } }, { title: 'Hobbies Describe', orderIndex: 2, gameType: GameType.IMAGE_SPEAK, content: { cards: [{ id: 'c1', imageUrl: null, acceptedAnswers: ['swimming', 'pool', 'water'], prompt: 'What activity do you see?' }] } }, { title: 'Entertainment Dialogue', orderIndex: 3, gameType: GameType.DIALOGUE, content: { cards: [{ id: 'c1', scenario: 'A guest asks about local activities.', turns: [{ speaker: 'GUEST', text: 'What can I do near the hotel?', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'You can visit the beach, go shopping, or explore the old town.', audioUrl: null }] }] } }, { title: 'Hobbies Fill Blank', orderIndex: 4, gameType: GameType.FILL_BLANK, content: { cards: [{ id: 'c1', sentenceTemplate: 'I enjoy ___ in my free time.', blankIndex: 2, correctAnswer: 'reading', hint: 'Looking at books' }] } }, { title: 'Hobbies True False', orderIndex: 5, gameType: GameType.TRUE_FALSE, content: { cards: [{ id: 'c1', statement: 'Swimming is an indoor activity only.', isTrue: false, explanation: 'Swimming can be done both indoors and outdoors.' }] } }] },
    { title: 'Home & Country', description: 'Discuss your home, country, and where you come from.', orderIndex: 6, lessons: [{ title: 'Country Vocabulary', orderIndex: 1, gameType: GameType.WORD_MATCH, content: { cards: [{ id: 'c1', imageUrl: null, correctWord: 'flag', distractors: ['map', 'passport', 'city'] }] } }, { title: 'Home Vocabulary', orderIndex: 2, gameType: GameType.FLASHCARD, content: { cards: [{ id: 'c1', word: 'House', translation: 'Maison', imageUrl: null, audioUrl: null, targetWord: 'house' }, { id: 'c2', word: 'City', translation: 'Ville', imageUrl: null, audioUrl: null, targetWord: 'city' }] } }, { title: 'Home Fill Blank', orderIndex: 3, gameType: GameType.FILL_BLANK, content: { cards: [{ id: 'c1', sentenceTemplate: 'I live in a ___ near the beach.', blankIndex: 3, correctAnswer: 'house', hint: 'A building where people live' }] } }, { title: 'Home Dialogue', orderIndex: 4, gameType: GameType.DIALOGUE, content: { cards: [{ id: 'c1', scenario: 'Talking about your home country.', turns: [{ speaker: 'GUEST', text: 'Where are you from?', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'I am from Madagascar. It is a beautiful island in the Indian Ocean.', audioUrl: null }] }] } }, { title: 'Country Image Speak', orderIndex: 5, gameType: GameType.IMAGE_SPEAK, content: { cards: [{ id: 'c1', imageUrl: null, acceptedAnswers: ['map', 'world', 'globe'], prompt: 'What do you see? Say it in English.' }] } }] },
    { title: 'Leisure & Activities', description: 'Language for leisure time and tourist activities.', orderIndex: 7, lessons: [{ title: 'Leisure Describe', orderIndex: 1, gameType: GameType.IMAGE_SPEAK, content: { cards: [{ id: 'c1', imageUrl: null, acceptedAnswers: ['beach', 'sea', 'ocean'], prompt: 'What place do you see?' }] } }, { title: 'Leisure Vocabulary', orderIndex: 2, gameType: GameType.FLASHCARD, content: { cards: [{ id: 'c1', word: 'Museum', translation: 'Musée', imageUrl: null, audioUrl: null, targetWord: 'museum' }, { id: 'c2', word: 'Tour', translation: 'Visite', imageUrl: null, audioUrl: null, targetWord: 'tour' }] } }, { title: 'Activity Match', orderIndex: 3, gameType: GameType.WORD_MATCH, content: { cards: [{ id: 'c1', imageUrl: null, correctWord: 'tour', distractors: ['trip', 'stay', 'visit'] }] } }, { title: 'Leisure Dialogue', orderIndex: 4, gameType: GameType.DIALOGUE, content: { cards: [{ id: 'c1', scenario: 'Recommending a tour to a guest.', turns: [{ speaker: 'GUEST', text: 'Can you recommend a tour for tomorrow?', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'I recommend the city tour. It starts at nine in the morning and lasts three hours.', audioUrl: null }] }] } }, { title: 'Leisure Fill Blank', orderIndex: 5, gameType: GameType.FILL_BLANK, content: { cards: [{ id: 'c1', sentenceTemplate: 'The museum is ___ from the hotel.', blankIndex: 3, correctAnswer: 'nearby', hint: 'Not far away' }] } }] },
    { title: 'Travel & Vacations', description: 'Essential travel language for tourism workers.', orderIndex: 8, lessons: [{ title: 'Travel Dialogue', orderIndex: 1, gameType: GameType.DIALOGUE, content: { cards: [{ id: 'c1', scenario: 'Helping a guest with directions.', turns: [{ speaker: 'GUEST', text: 'How do I get to the airport?', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'You can take a taxi from the hotel entrance. It takes about thirty minutes.', audioUrl: null }] }] } }, { title: 'Travel Vocabulary', orderIndex: 2, gameType: GameType.FLASHCARD, content: { cards: [{ id: 'c1', word: 'Passport', translation: 'Passeport', imageUrl: null, audioUrl: null, targetWord: 'passport' }, { id: 'c2', word: 'Suitcase', translation: 'Valise', imageUrl: null, audioUrl: null, targetWord: 'suitcase' }] } }, { title: 'Travel Fill Blank', orderIndex: 3, gameType: GameType.FILL_BLANK, content: { cards: [{ id: 'c1', sentenceTemplate: 'Your ___ departs at six in the morning.', blankIndex: 1, correctAnswer: 'flight', hint: 'Travel by air' }] } }, { title: 'Travel Word Match', orderIndex: 4, gameType: GameType.WORD_MATCH, content: { cards: [{ id: 'c1', imageUrl: null, correctWord: 'airport', distractors: ['hotel', 'restaurant', 'museum'] }] } }, { title: 'Travel True False', orderIndex: 5, gameType: GameType.TRUE_FALSE, content: { cards: [{ id: 'c1', statement: 'A boarding pass is needed to get on an airplane.', isTrue: true, explanation: 'Yes, you must show your boarding pass at the gate.' }] } }] },
    {
      title: 'Hotel & Hospitality',
      description: 'Key language for working at the front desk and serving hotel guests.',
      orderIndex: 9,
      lessons: [
        { title: 'Check-In Dialogue', orderIndex: 1, gameType: GameType.DIALOGUE, content: { cards: [{ id: 'c1', scenario: 'A guest arrives at the hotel front desk.', turns: [{ speaker: 'GUEST', text: 'Hello, I have a reservation. My name is Smith.', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'Welcome, Mr. Smith! Let me find your reservation. May I see your passport please?', audioUrl: null }, { speaker: 'GUEST', text: 'Here you go.', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'Thank you. Your room is on the fifth floor. Breakfast is served from seven to ten AM.', audioUrl: null }] }] } },
        { title: 'Hotel Vocabulary', orderIndex: 2, gameType: GameType.FILL_BLANK, content: { cards: [{ id: 'c1', sentenceTemplate: 'The guest would like to ___ a room for two nights.', blankIndex: 6, correctAnswer: 'book', hint: 'Another word for reserve' }, { id: 'c2', sentenceTemplate: 'Please fill in the ___ form at the front desk.', blankIndex: 4, correctAnswer: 'registration', hint: 'Used for checking in' }] } },
        { title: 'Hotel True False', orderIndex: 3, gameType: GameType.TRUE_FALSE, content: { cards: [{ id: 'c1', statement: 'You should always greet guests by their first name without asking.', isTrue: false, explanation: 'Always ask for the guest\'s preference before using their first name.' }, { id: 'c2', statement: 'A concierge helps guests with information and services.', isTrue: true, explanation: 'Yes, a concierge assists guests with bookings, directions, and recommendations.' }] } },
        { title: 'Hotel Word Match', orderIndex: 4, gameType: GameType.WORD_MATCH, content: { cards: [{ id: 'c1', imageUrl: null, correctWord: 'lobby', distractors: ['kitchen', 'elevator', 'balcony'] }, { id: 'c2', imageUrl: null, correctWord: 'reception', distractors: ['restaurant', 'pool', 'gym'] }] } },
        { title: 'Hotel Flashcards', orderIndex: 5, gameType: GameType.FLASHCARD, content: { cards: [{ id: 'c1', word: 'Reservation', translation: 'Réservation', imageUrl: null, audioUrl: null, targetWord: 'reservation' }, { id: 'c2', word: 'Checkout', translation: 'Départ', imageUrl: null, audioUrl: null, targetWord: 'checkout' }] } },
      ],
    },
    { title: 'Restaurant & Food Service', description: 'Language for serving guests in a restaurant setting.', orderIndex: 10, lessons: [{ title: 'Restaurant Dialogue', orderIndex: 1, gameType: GameType.DIALOGUE, content: { cards: [{ id: 'c1', scenario: 'Taking a food order from a guest.', turns: [{ speaker: 'GUEST', text: 'I would like the chicken please.', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'Excellent choice! How would you like your chicken cooked?', audioUrl: null }, { speaker: 'GUEST', text: 'Well done, please.', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'Perfect. And would you like anything to drink with that?', audioUrl: null }] }] } }, { title: 'Restaurant Word Match', orderIndex: 2, gameType: GameType.WORD_MATCH, content: { cards: [{ id: 'c1', imageUrl: null, correctWord: 'menu', distractors: ['bill', 'table', 'waiter'] }] } }, { title: 'Restaurant Fill Blank', orderIndex: 3, gameType: GameType.FILL_BLANK, content: { cards: [{ id: 'c1', sentenceTemplate: 'Are you ready to ___ your order?', blankIndex: 4, correctAnswer: 'place', hint: 'To give or submit something' }] } }, { title: 'Restaurant Vocabulary', orderIndex: 4, gameType: GameType.FLASHCARD, content: { cards: [{ id: 'c1', word: 'Appetizer', translation: 'Entrée', imageUrl: null, audioUrl: null, targetWord: 'appetizer' }, { id: 'c2', word: 'Dessert', translation: 'Dessert', imageUrl: null, audioUrl: null, targetWord: 'dessert' }] } }, { title: 'Restaurant Image Speak', orderIndex: 5, gameType: GameType.IMAGE_SPEAK, content: { cards: [{ id: 'c1', imageUrl: null, acceptedAnswers: ['waiter', 'server', 'staff'], prompt: 'What is this person\'s job? Say it in English.' }] } }] },
    { title: 'Handling Complaints', description: 'Communicate professionally when guests have complaints or issues.', orderIndex: 11, lessons: [{ title: 'Complaint Dialogue', orderIndex: 1, gameType: GameType.DIALOGUE, content: { cards: [{ id: 'c1', scenario: 'A guest complains about a noisy room.', turns: [{ speaker: 'GUEST', text: 'Excuse me, my room is very noisy. I cannot sleep.', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'I am very sorry to hear that. I will move you to a quieter room right away.', audioUrl: null }, { speaker: 'GUEST', text: 'Thank you, I appreciate it.', expectedResponse: null, audioUrl: null }, { speaker: 'USER', text: null, expectedResponse: 'Of course. Your comfort is our priority. I will bring your new key card in five minutes.', audioUrl: null }] }] } }, { title: 'Complaint True False', orderIndex: 2, gameType: GameType.TRUE_FALSE, content: { cards: [{ id: 'c1', statement: 'When a guest complains, you should argue with them.', isTrue: false, explanation: 'Always listen calmly and apologise, never argue with a guest.' }, { id: 'c2', statement: 'Saying "I understand" shows empathy to a guest.', isTrue: true, explanation: 'Yes, showing empathy helps guests feel heard and valued.' }] } }, { title: 'Apology Fill Blank', orderIndex: 3, gameType: GameType.FILL_BLANK, content: { cards: [{ id: 'c1', sentenceTemplate: 'I am very ___ for the inconvenience.', blankIndex: 4, correctAnswer: 'sorry', hint: 'An expression of apology' }] } }, { title: 'Service Vocabulary', orderIndex: 4, gameType: GameType.FLASHCARD, content: { cards: [{ id: 'c1', word: 'Complaint', translation: 'Plainte', imageUrl: null, audioUrl: null, targetWord: 'complaint' }, { id: 'c2', word: 'Refund', translation: 'Remboursement', imageUrl: null, audioUrl: null, targetWord: 'refund' }] } }, { title: 'Service Word Match', orderIndex: 5, gameType: GameType.WORD_MATCH, content: { cards: [{ id: 'c1', imageUrl: null, correctWord: 'apology', distractors: ['complaint', 'refund', 'manager'] }] } }] },
  ]

  for (const moduleData of modulesData) {
    const { lessons, ...moduleFields } = moduleData

    const mod = await prisma.module.upsert({
      where: { orderIndex: moduleFields.orderIndex },
      update: {},
      create: { ...moduleFields, isPublished: true },
    })

    for (const lessonData of lessons) {
      await prisma.lesson.upsert({
        where: { moduleId_orderIndex: { moduleId: mod.id, orderIndex: lessonData.orderIndex } },
        update: {},
        create: { ...lessonData, moduleId: mod.id, xpReward: 20 },
      })
    }
  }

  // ─── 3. Sample Explore content ───────────────────────────────────────────────
  await prisma.exploreContent.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Phrase of the Day: Checking In', body: '"Welcome! Do you have a reservation?" — Use this phrase when greeting hotel guests at the front desk.', category: ContentCategory.PHRASE_OF_THE_DAY },
      { title: 'Grammar Tip: Polite Requests', body: 'Use "Could you..." or "Would you mind..." instead of "Can you..." for a more professional tone with guests.', category: ContentCategory.GRAMMAR_TIP },
      { title: 'Culture Note: Tipping', body: 'In many English-speaking countries, it is customary to tip hotel and restaurant staff 10–20% of the bill.', category: ContentCategory.CULTURE_NOTE },
      { title: 'Hospitality Fact: The Guest is Always Right', body: 'The phrase "the customer is always right" means you should prioritise guest satisfaction, even when they are wrong.', category: ContentCategory.HOSPITALITY_FACT },
      { title: 'Phrase of the Day: Offering Help', body: '"How may I assist you today?" — A professional way to offer help to any guest or customer.', category: ContentCategory.PHRASE_OF_THE_DAY },
      { title: 'Grammar Tip: Present Continuous for Actions', body: 'Use present continuous for things happening right now: "I am preparing your room" instead of "I prepare your room".', category: ContentCategory.GRAMMAR_TIP },
    ],
  })

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
