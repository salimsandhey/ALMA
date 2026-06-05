import { PrismaClient, GameType, ContentCategory } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ─── 1. Badges ──────────────────────────────────────────────────────────────
  const badges = [
    { name: 'First Steps',        description: 'Complete your first lesson',              condition: 'complete_first_lesson' },
    { name: 'First Conversation', description: 'Complete your first dialogue lesson',     condition: 'complete_first_dialogue' },
    { name: 'Hospitality Hero',   description: 'Complete the Hotel & Hospitality module', condition: 'complete_module_hotel' },
    { name: 'Word Wizard',        description: 'Complete 10 lessons',                     condition: 'complete_10_lessons' },
    { name: 'Quiz Master',        description: 'Score 100% on any quiz',                  condition: 'quiz_perfect_score' },
    { name: 'On Fire!',           description: '3-day streak',                            condition: 'streak_3' },
    { name: 'Week Warrior',       description: '7-day streak',                            condition: 'streak_7' },
    { name: 'Monthly Marvel',     description: '30-day streak',                           condition: 'streak_30' },
    { name: 'Halfway There',      description: 'Complete 6 or more modules',              condition: 'complete_half_modules' },
    { name: 'ALMA Graduate',      description: 'Complete all modules',                    condition: 'complete_all_modules' },
    { name: 'Perfect Score',      description: 'Score 100% on all lessons in a module',   condition: 'perfect_module' },
    { name: 'World Explorer',     description: 'Complete your first entertainment quiz',  condition: 'first_entertainment' },
  ]

  await prisma.badge.deleteMany({
    where: {
      name: {
        notIn: badges.map((badge) => badge.name),
      },
    },
  })

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {
        description: badge.description,
        condition: badge.condition,
      },
      create: badge,
    })
  }

  // ─── 2. Modules with lessons ─────────────────────────────────────────────────

  const modulesData = [
    // ── MODULE 1: Personal Information ────────────────────────────────────────
    {
      title: 'Personal Information',
      description: 'Talk about yourself, your name, age, and background.',
      orderIndex: 1,
      lessons: [
        {
          title: 'Keywords - About me',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Name',         translation: 'Personal information keyword', imageUrl: 'local:pi-keywords-name',         audioUrl: null, targetWord: 'name' },
              { id: 'c2', word: 'Age',          translation: 'Personal information keyword', imageUrl: 'local:pi-keywords-age',          audioUrl: null, targetWord: 'age' },
              { id: 'c3', word: 'Hometown',     translation: 'Personal information keyword', imageUrl: 'local:pi-keywords-hometown',     audioUrl: null, targetWord: 'hometown' },
              { id: 'c4', word: 'Mother tongue',translation: 'Personal information keyword', imageUrl: 'local:pi-keywords-mother-tongue',audioUrl: null, targetWord: 'mother tongue' },
              { id: 'c5', word: 'Dream job',    translation: 'Personal information keyword', imageUrl: 'local:pi-keywords-dream-job',    audioUrl: null, targetWord: 'dream job' },
            ],
          },
        },
        {
          title: 'Personal Details Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '🎂', correctWord: 'Birthday', distractors: ['Homework', 'Weather'] },
              { id: 'c2', emoji: '👁️', correctWord: 'Eyes',     distractors: ['Hands',    'Shoes'] },
              { id: 'c3', emoji: '💇', correctWord: 'Hair',     distractors: ['Desk',     'River'] },
              { id: 'c4', emoji: '📏', correctWord: 'Height',   distractors: ['Music',    'Dream'] },
              { id: 'c5', emoji: '❤️', correctWord: 'Passion',  distractors: ['Door',     'Ceiling'] },
              { id: 'c6', emoji: '🧍', correctWord: 'Gender',   distractors: ['Season',   'Color'] },
            ],
          },
        },
        {
          title: 'About me - Fill in the gaps',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'My _____ is Maria.',                        blankIndex: 1, correctAnswer: 'name',   hint: 'Personal identity word',      distractors: ['color',  'food',   'car'] },
              { id: 'c2', sentenceTemplate: 'I _____ twenty years old.',                  blankIndex: 1, correctAnswer: 'am',     hint: 'Correct verb form with I',    distractors: ['is',     'are',    'be'] },
              { id: 'c3', sentenceTemplate: 'My _____ tongue is French.',                 blankIndex: 1, correctAnswer: 'mother', hint: 'Language learned first',      distractors: ['father', 'sister', 'uncle'] },
              { id: 'c4', sentenceTemplate: 'My dream _____ is to be a hotel manager.',   blankIndex: 2, correctAnswer: 'job',    hint: 'Career word',                 distractors: ['pet',    'song',   'cloud'] },
              { id: 'c5', sentenceTemplate: 'I live in the _____ of Antananarivo.',       blankIndex: 4, correctAnswer: 'city',   hint: 'Urban area',                  distractors: ['ocean',  'sky',    'forest'] },
            ],
          },
        },
        {
          title: 'Personal info - Quick Check',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: '"Mother tongue" means the language you learned first.',  isTrue: true,  explanation: 'Correct. Mother tongue is your first learned language.' },
              { id: 'c2', statement: 'The "eldest" sibling is the youngest.',                  isTrue: false, explanation: 'Incorrect. Eldest means oldest.' },
              { id: 'c3', statement: '"Siblings" means your brothers and sisters.',            isTrue: true,  explanation: 'Correct. Siblings are brothers and sisters.' },
              { id: 'c4', statement: 'Your "hometown" is where you grew up.',                  isTrue: true,  explanation: 'Correct. Hometown is your place of upbringing.' },
              { id: 'c5', statement: 'You say I am Alex to give your name.',                   isTrue: true,  explanation: 'Correct. "I am Alex" introduces your name.' },
              { id: 'c6', statement: 'A "passion" is something you love deeply.',              isTrue: true,  explanation: 'Correct. Passion means a strong love or interest.' },
            ],
          },
        },
        {
          title: 'Introduce Yourself',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Introduce yourself to a new friend or colleague.',
                turns: [
                  { speaker: 'GUEST', text: 'Hi! What is your name?',                                                    expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'My name is Alex. Nice to meet you!',                audioUrl: null },
                  { speaker: 'GUEST', text: 'How old are you? And what is your gender?',                                 expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I am twenty-five years old. I am male.',            audioUrl: null },
                  { speaker: 'GUEST', text: 'Where were you born? Which city and country?',                              expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I was born in Antananarivo, Madagascar. It is in Africa.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What is your mother tongue? What other languages do you speak?',            expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'My mother tongue is Malagasy. I also speak French and I am learning English.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What is your hometown or place of origin?',                                 expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'My hometown is Antananarivo. I still live there now.', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 2: Food & Drink ─────────────────────────────────────────────────
    {
      title: 'Food & Drink',
      description: 'Talk about your favorite foods, drinks, and eating habits.',
      orderIndex: 2,
      lessons: [
        {
          title: 'Food & Drink Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Breakfast',  translation: 'Food vocabulary keyword', imageUrl: 'local:fd-words-breakfast',  audioUrl: null, targetWord: 'breakfast' },
              { id: 'c2', word: 'Vegetables', translation: 'Food vocabulary keyword', imageUrl: 'local:fd-words-vegetables', audioUrl: null, targetWord: 'vegetables' },
              { id: 'c3', word: 'Spicy',      translation: 'Food vocabulary keyword', imageUrl: 'local:fd-words-spicy',      audioUrl: null, targetWord: 'spicy' },
              { id: 'c4', word: 'Dessert',    translation: 'Food vocabulary keyword', imageUrl: 'local:fd-words-dessert',    audioUrl: null, targetWord: 'dessert' },
              { id: 'c5', word: 'Recipe',     translation: 'Food vocabulary keyword', imageUrl: 'local:fd-words-recipe',     audioUrl: null, targetWord: 'recipe' },
            ],
          },
        },
        {
          title: 'Meal Time Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '🌅', correctWord: 'Breakfast', distractors: ['Dinner',    'Snack'] },
              { id: 'c2', emoji: '☀️', correctWord: 'Lunch',     distractors: ['Breakfast', 'Dessert'] },
              { id: 'c3', emoji: '🌙', correctWord: 'Dinner',    distractors: ['Drink',     'Lunch'] },
              { id: 'c4', emoji: '🍎', correctWord: 'Snack',     distractors: ['Dinner',    'Breakfast'] },
              { id: 'c5', emoji: '🍰', correctWord: 'Dessert',   distractors: ['Snack',     'Lunch'] },
              { id: 'c6', emoji: '🥤', correctWord: 'Drink',     distractors: ['Dessert',   'Dinner'] },
            ],
          },
        },
        {
          title: 'Food Sentences',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'I _____ rice and fish every day.',              blankIndex: 1, correctAnswer: 'eat',     hint: 'Action for consuming food',         distractors: ['drink', 'wash',  'build'] },
              { id: 'c2', sentenceTemplate: 'My favorite _____ is chocolate ice cream.',     blankIndex: 2, correctAnswer: 'dessert', hint: 'Sweet course after meals',          distractors: ['sport', 'color', 'number'] },
              { id: 'c3', sentenceTemplate: 'I am a coffee _____, not tea.',                 blankIndex: 4, correctAnswer: 'lover',   hint: 'Someone who really likes something',distractors: ['water', 'maker', 'drink'] },
              { id: 'c4', sentenceTemplate: 'This dish is very _____. My mouth is on fire!',blankIndex: 4, correctAnswer: 'spicy',   hint: 'Hot flavor',                        distractors: ['sweet', 'cold',  'invisible'] },
              { id: 'c5', sentenceTemplate: 'Can you teach me the _____ for this soup?',    blankIndex: 6, correctAnswer: 'recipe',  hint: 'Cooking instructions',              distractors: ['song',  'story', 'game'] },
            ],
          },
        },
        {
          title: 'Module 1 Review: Personal Info Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: '"Siblings" means brothers and sisters.',                  isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: '"Mother tongue" is the language you speak at work.',      isTrue: false, explanation: 'Wrong! The answer is False.' },
              { id: 'c3', statement: 'You say "My name is..." to introduce yourself.',          isTrue: true,  explanation: 'Correct!' },
              { id: 'c4', statement: '"Hometown" is the city where you were born or grew up.',  isTrue: true,  explanation: 'Correct!' },
              { id: 'c5', statement: 'Breakfast is the last meal of the day.',                  isTrue: false, explanation: 'Wrong! The answer is False.' },
              { id: 'c6', statement: 'A "recipe" tells you how to cook a dish.',                isTrue: true,  explanation: 'Correct!' },
            ],
          },
        },
        {
          title: 'Talking About Food',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Share your food preferences in a friendly conversation.',
                turns: [
                  { speaker: 'GUEST', text: 'What is your favorite food? Why do you like it?',                    expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'My favorite food is rice with fish. I love it because it is traditional and delicious.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you eat it every day? And how do you enjoy your food?',            expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes, I eat rice every day! And I love spicy food, but not too hot.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Can you cook for yourself? Is it easy for you?',                      expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I love cooking and it is easy for me to make traditional dishes.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Are you a coffee lover or a tea lover? Do you like sweets?',          expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I am a coffee lover! And yes, I love sweets. My favorite dessert is vanilla ice cream.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Is there a dish you could eat every day? Why?',                       expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I could eat rice every day. It is a basic dish with meat and greens, so tasty!', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 3: Pets & Animals ───────────────────────────────────────────────
    {
      title: 'Pets & Animals',
      description: 'Talk about pets, wildlife, and animals from around the world.',
      orderIndex: 3,
      lessons: [
        {
          title: 'Animal Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Pet',      translation: 'Animal vocabulary keyword', imageUrl: 'local:pa-words-pet',      audioUrl: null, targetWord: 'pet' },
              { id: 'c2', word: 'Wildlife', translation: 'Animal vocabulary keyword', imageUrl: 'local:pa-words-wildlife', audioUrl: null, targetWord: 'wildlife' },
              { id: 'c3', word: 'Aquarium', translation: 'Animal vocabulary keyword', imageUrl: 'local:pa-words-aquarium', audioUrl: null, targetWord: 'aquarium' },
              { id: 'c4', word: 'Dolphin',  translation: 'Animal vocabulary keyword', imageUrl: 'local:pa-words-dolphin',  audioUrl: null, targetWord: 'dolphin' },
              { id: 'c5', word: 'Unique',   translation: 'Animal vocabulary keyword', imageUrl: 'local:pa-words-unique',   audioUrl: null, targetWord: 'unique' },
            ],
          },
        },
        {
          title: 'Animal Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '🐕', correctWord: 'Dog',     distractors: ['Cat',     'Whale'] },
              { id: 'c2', emoji: '🐈', correctWord: 'Cat',     distractors: ['Dog',     'Parrot'] },
              { id: 'c3', emoji: '🐒', correctWord: 'Lemur',   distractors: ['Dolphin', 'Cat'] },
              { id: 'c4', emoji: '🐬', correctWord: 'Dolphin', distractors: ['Whale',   'Lemur'] },
              { id: 'c5', emoji: '🐋', correctWord: 'Whale',   distractors: ['Dolphin', 'Dog'] },
              { id: 'c6', emoji: '🦜', correctWord: 'Parrot',  distractors: ['Cat',     'Lemur'] },
            ],
          },
        },
        {
          title: 'Animal Sentences',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'My _____ is a small white cat.',                    blankIndex: 1, correctAnswer: 'pet',      hint: 'Animal kept at home',  distractors: ['zoo',      'jungle',  'beach'] },
              { id: 'c2', sentenceTemplate: 'I am _____ of spiders!',                            blankIndex: 2, correctAnswer: 'scared',   hint: 'Feeling of fear',      distractors: ['happy',    'bored',   'hungry'] },
              { id: 'c3', sentenceTemplate: 'The lemur is a _____ animal found in Madagascar.',  blankIndex: 4, correctAnswer: 'unique',   hint: 'One of a kind',        distractors: ['boring',   'silent',  'invisible'] },
              { id: 'c4', sentenceTemplate: 'Have you ever seen a _____? They swim in the ocean!',blankIndex:5, correctAnswer: 'dolphin',  hint: 'Ocean mammal',         distractors: ['mountain', 'building','rainbow'] },
              { id: 'c5', sentenceTemplate: 'I love to visit the _____ to see the fish.',        blankIndex: 6, correctAnswer: 'aquarium', hint: 'Place with fish tanks', distractors: ['jungle',   'library', 'bakery'] },
            ],
          },
        },
        {
          title: 'Module Review: Pets & Animals Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: '"Spicy" food has a hot or burning taste.',         isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: 'A "recipe" is a list of ingredients and steps.',   isTrue: true,  explanation: 'Correct!' },
              { id: 'c3', statement: 'Dessert is eaten before the main meal.',           isTrue: false, explanation: 'Wrong! Dessert is eaten after the main meal.' },
              { id: 'c4', statement: '"Vegetarian" means someone who eats no meat.',     isTrue: true,  explanation: 'Correct!' },
              { id: 'c5', statement: 'A "pet" is an animal you keep at home.',           isTrue: true,  explanation: 'Correct!' },
              { id: 'c6', statement: 'Wildlife animals live in houses.',                 isTrue: false, explanation: 'Wrong! Wildlife animals live in nature.' },
            ],
          },
        },
        {
          title: 'Animals In My Country',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Talk about pets and animals from your country.',
                turns: [
                  { speaker: 'GUEST', text: 'Do you have a pet? Do you like dogs or cats more?',                           expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I have a dog named Bruno. I like dogs more — they are very loyal!', audioUrl: null },
                  { speaker: 'GUEST', text: 'What are the most popular and unique animals in your country?',                expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Madagascar has lemurs and chameleons — very unique and found nowhere else!', audioUrl: null },
                  { speaker: 'GUEST', text: 'What is your favorite animal? Is there one you are scared of?',                expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'My favorite is the lemur! But I am scared of snakes. They are everywhere in the forest.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Have you ever been to an aquarium? Have you seen a dolphin or whale?',         expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I visited an aquarium and saw dolphins and colorful fish. I have never seen a whale though.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you know how to swim? Do you like diving?',                                 expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes, I know how to swim! I love snorkeling but I have never tried diving.', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 4: Friends & Social Life ───────────────────────────────────────
    {
      title: 'Friends & Social Life',
      description: 'Talk about friendships, social activities, and relationships.',
      orderIndex: 4,
      lessons: [
        {
          title: 'Social Life Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Best friend', translation: 'Social vocabulary keyword', imageUrl: 'local:sl-words-best-friend', audioUrl: null, targetWord: 'best friend' },
              { id: 'c2', word: 'Argument',    translation: 'Social vocabulary keyword', imageUrl: 'local:sl-words-argument',    audioUrl: null, targetWord: 'argument' },
              { id: 'c3', word: 'Support',     translation: 'Social vocabulary keyword', imageUrl: 'local:sl-words-support',     audioUrl: null, targetWord: 'support' },
              { id: 'c4', word: 'Trust',       translation: 'Social vocabulary keyword', imageUrl: 'local:sl-words-trust',       audioUrl: null, targetWord: 'trust' },
              { id: 'c5', word: 'Spend time',  translation: 'Social vocabulary keyword', imageUrl: 'local:sl-words-spend-time',  audioUrl: null, targetWord: 'spend time' },
            ],
          },
        },
        {
          title: 'Social Words Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '🤝', correctWord: 'Friend',   distractors: ['Argument', 'School'] },
              { id: 'c2', emoji: '🎉', correctWord: 'Surprise', distractors: ['Music',    'Together'] },
              { id: 'c3', emoji: '😤', correctWord: 'Argument', distractors: ['Friend',   'Surprise'] },
              { id: 'c4', emoji: '🎵', correctWord: 'Music',    distractors: ['School',   'Argument'] },
              { id: 'c5', emoji: '🏫', correctWord: 'School',   distractors: ['Together', 'Music'] },
              { id: 'c6', emoji: '👥', correctWord: 'Together', distractors: ['Friend',   'School'] },
            ],
          },
        },
        {
          title: 'Friendship Sentences',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'My best friend and I _____ in school.',          blankIndex: 5, correctAnswer: 'met',     hint: 'How we became friends',      distractors: ['fought', 'slept',   'cooked'] },
              { id: 'c2', sentenceTemplate: 'We like to _____ time together at the park.',    blankIndex: 3, correctAnswer: 'spend',   hint: 'Use time for something',     distractors: ['sell',   'lose',    'break'] },
              { id: 'c3', sentenceTemplate: 'Good friends _____ you when you need help.',     blankIndex: 2, correctAnswer: 'support', hint: 'Help and encourage',         distractors: ['ignore', 'scare',   'confuse'] },
              { id: 'c4', sentenceTemplate: 'After a fight, we always make _____ .',          blankIndex: 6, correctAnswer: 'up',      hint: 'Reconcile / become friends', distractors: ['down',   'sideways','around'] },
              { id: 'c5', sentenceTemplate: 'My friends and I _____ the same music.',         blankIndex: 4, correctAnswer: 'love',    hint: 'Strong positive feeling',    distractors: ['hate',   'sell',    'forget'] },
            ],
          },
        },
        {
          title: 'Module Review: Friendship & Social Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: 'A "pet" is an animal you keep at home.',             isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: '"Wildlife" means animals that live in your house.',  isTrue: false, explanation: 'Wrong! Wildlife animals live in nature.' },
              { id: 'c3', statement: 'An "aquarium" is a place to see fish and sea life.', isTrue: true,  explanation: 'Correct!' },
              { id: 'c4', statement: '"Unique" means very common and ordinary.',           isTrue: false, explanation: 'Wrong! Unique means one of a kind.' },
              { id: 'c5', statement: 'A "best friend" is your closest friend.',            isTrue: true,  explanation: 'Correct!' },
              { id: 'c6', statement: '"Making up" after a fight means becoming friends again.', isTrue: true, explanation: 'Correct!' },
            ],
          },
        },
        {
          title: 'My Best Friend',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Talk about your best friend and social life.',
                turns: [
                  { speaker: 'GUEST', text: 'Do you have a best friend? What is their name and how did you meet?',         expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! My best friend is Sophie. We met in school and have been close ever since.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Where does your best friend live? Do they live close to you?',                expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'She lives close to me! We are neighbors so we see each other every day.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What do you like to do together? Do you prefer being alone or with friends?', expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'We love going to the beach and listening to music. I always prefer being with friends!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you and your friends like the same music? What instrument do you like?',   expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! We love local music. I also like the guitar — it is my favorite instrument.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Have you ever argued with your friend? How do you make up after a fight?',   expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes, once. But we talked it out calmly and made up the same day.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Have your friends ever surprised you? What did you feel?',                   expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! They gave me a surprise birthday party. I felt so happy and loved!', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 5: Hobbies & Interests ──────────────────────────────────────────
    {
      title: 'Hobbies & Interests',
      description: 'Talk about your hobbies, passions, and free-time activities.',
      orderIndex: 5,
      lessons: [
        {
          title: 'Hobby Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Hobby',       translation: 'Hobby vocabulary keyword', imageUrl: 'local:hb-words-hobby',       audioUrl: null, targetWord: 'hobby' },
              { id: 'c2', word: 'Photography', translation: 'Hobby vocabulary keyword', imageUrl: 'local:hb-words-photography', audioUrl: null, targetWord: 'photography' },
              { id: 'c3', word: 'Gardening',   translation: 'Hobby vocabulary keyword', imageUrl: 'local:hb-words-gardening',   audioUrl: null, targetWord: 'gardening' },
              { id: 'c4', word: 'Concert',     translation: 'Hobby vocabulary keyword', imageUrl: 'local:hb-words-concert',     audioUrl: null, targetWord: 'concert' },
              { id: 'c5', word: 'Fashion',     translation: 'Hobby vocabulary keyword', imageUrl: 'local:hb-words-fashion',     audioUrl: null, targetWord: 'fashion' },
            ],
          },
        },
        {
          title: 'Hobby Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '💃', correctWord: 'Dancing',  distractors: ['Reading', 'Sports'] },
              { id: 'c2', emoji: '📚', correctWord: 'Reading',  distractors: ['Dancing', 'Cooking'] },
              { id: 'c3', emoji: '👨‍🍳', correctWord: 'Cooking',  distractors: ['Swimming','Reading'] },
              { id: 'c4', emoji: '🏊', correctWord: 'Swimming', distractors: ['Drawing', 'Cooking'] },
              { id: 'c5', emoji: '🎨', correctWord: 'Drawing',  distractors: ['Sports',  'Swimming'] },
              { id: 'c6', emoji: '⚽', correctWord: 'Sports',   distractors: ['Dancing', 'Drawing'] },
            ],
          },
        },
        {
          title: 'Hobby Sentences',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'My favorite _____ is listening to music.',      blankIndex: 2, correctAnswer: 'hobby',  hint: 'Free-time activity',    distractors: ['problem', 'mistake','danger'] },
              { id: 'c2', sentenceTemplate: 'I _____ how to dance traditional dances.',      blankIndex: 1, correctAnswer: 'know',   hint: 'Have the skill',        distractors: ['forget',  'hate',   'sell'] },
              { id: 'c3', sentenceTemplate: 'Are you into _____ games on your phone?',       blankIndex: 3, correctAnswer: 'video',  hint: 'Type of digital game',  distractors: ['water',   'rock',   'cloud'] },
              { id: 'c4', sentenceTemplate: 'I love to take _____ of beautiful sunsets.',    blankIndex: 4, correctAnswer: 'photos', hint: 'Images captured',       distractors: ['notes',   'breaks', 'turns'] },
              { id: 'c5', sentenceTemplate: 'My favorite _____ of the year is summer.',      blankIndex: 2, correctAnswer: 'season', hint: 'Time of year',          distractors: ['number',  'color',  'letter'] },
            ],
          },
        },
        {
          title: 'Module Review: Friends & Hobbies Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: '"Trust" is an important part of friendship.',          isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: 'Good friends ignore you when you need help.',          isTrue: false, explanation: 'Wrong! Good friends support you.' },
              { id: 'c3', statement: 'A "hobby" is an activity you enjoy in your free time.',isTrue: true,  explanation: 'Correct!' },
              { id: 'c4', statement: 'Photography means taking pictures.',                   isTrue: true,  explanation: 'Correct!' },
              { id: 'c5', statement: 'A "concert" is a live music performance.',             isTrue: true,  explanation: 'Correct!' },
              { id: 'c6', statement: '"Fashion" is related to food.',                        isTrue: false, explanation: 'Wrong! Fashion is about clothing and style.' },
            ],
          },
        },
        {
          title: 'What Do You Do For Fun?',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Talk about your hobbies and what you enjoy doing.',
                turns: [
                  { speaker: 'GUEST', text: 'What is your favorite hobby? Can you tell me more about it?',                    expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I love photography! I take pictures of nature and wildlife. It makes me feel calm and creative.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you know how to sing or dance? Which dance do you like the most?',             expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I can dance traditional Malagasy dances. I also love to sing local songs!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Have you ever been to a concert? Do you play any musical instrument?',            expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I went to a concert last year. I also play the guitar — it is my favorite instrument.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Are you into social media or fashion? What is your favorite app?',                expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I use social media every day. My favorite app is Instagram for sharing photos!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you prefer relaxing at home or going out? Are you a morning person or a night owl?', expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I prefer going out! I am a morning person — I love starting the day early and exploring.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What is your favorite season and type of weather?',                               expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'My favorite season is summer! I love hot sunny weather — it makes me so happy.', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 6: Home & Country ───────────────────────────────────────────────
    {
      title: 'Home & Country',
      description: 'Talk about your country, culture, landmarks, and climate.',
      orderIndex: 6,
      lessons: [
        {
          title: 'Country & Place Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Capital',  translation: 'Country vocabulary keyword', imageUrl: 'local:hc-words-capital',  audioUrl: null, targetWord: 'capital' },
              { id: 'c2', word: 'Landmark', translation: 'Country vocabulary keyword', imageUrl: 'local:hc-words-landmark', audioUrl: null, targetWord: 'landmark' },
              { id: 'c3', word: 'Festival', translation: 'Country vocabulary keyword', imageUrl: 'local:hc-words-festival', audioUrl: null, targetWord: 'festival' },
              { id: 'c4', word: 'Climate',  translation: 'Country vocabulary keyword', imageUrl: 'local:hc-words-climate',  audioUrl: null, targetWord: 'climate' },
              { id: 'c5', word: 'Heritage', translation: 'Country vocabulary keyword', imageUrl: 'local:hc-words-heritage', audioUrl: null, targetWord: 'heritage' },
            ],
          },
        },
        {
          title: 'Places Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '🏖️', correctWord: 'Beach',     distractors: ['Museum',    'Stadium'] },
              { id: 'c2', emoji: '⛰️', correctWord: 'Mountains', distractors: ['Beach',     'Market'] },
              { id: 'c3', emoji: '🏪', correctWord: 'Market',    distractors: ['Temple',    'Mountains'] },
              { id: 'c4', emoji: '🏛️', correctWord: 'Museum',    distractors: ['Stadium',   'Beach'] },
              { id: 'c5', emoji: '⛩️', correctWord: 'Temple',    distractors: ['Market',    'Museum'] },
              { id: 'c6', emoji: '🏟️', correctWord: 'Stadium',   distractors: ['Mountains', 'Temple'] },
            ],
          },
        },
        {
          title: 'Country Sentences',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'The _____ city of my country is the most important city.', blankIndex: 1, correctAnswer: 'capital',   hint: 'Government seat',      distractors: ['market',    'talent',    'underground'] },
              { id: 'c2', sentenceTemplate: 'Our country has many beautiful _____ .',                   blankIndex: 4, correctAnswer: 'landmarks', hint: 'Famous places',        distractors: ['problems',  'mistakes',  'secrets'] },
              { id: 'c3', sentenceTemplate: 'The _____ in my country is warm and tropical.',            blankIndex: 1, correctAnswer: 'climate',   hint: 'Weather patterns',     distractors: ['music',     'language',  'money'] },
              { id: 'c4', sentenceTemplate: 'We celebrate many _____ throughout the year.',             blankIndex: 3, correctAnswer: 'festivals', hint: 'Cultural celebrations',distractors: ['arguments', 'disasters', 'forgetting'] },
              { id: 'c5', sentenceTemplate: 'Tourism helps people learn about our _____ .',             blankIndex: 5, correctAnswer: 'heritage',  hint: 'Cultural past',        distractors: ['homework',  'troubles',  'silence'] },
            ],
          },
        },
        {
          title: 'Module Review: Hobbies & Places Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: 'A "capital city" is usually the seat of government.',  isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: 'A "landmark" is an important or recognizable place.',  isTrue: true,  explanation: 'Correct!' },
              { id: 'c3', statement: 'All countries have the same climate.',                 isTrue: false, explanation: 'Wrong! Every country has its own climate.' },
              { id: 'c4', statement: 'Tourism can help the local economy.',                  isTrue: true,  explanation: 'Correct!' },
              { id: 'c5', statement: '"Heritage" means things from the past that we value.', isTrue: true,  explanation: 'Correct!' },
              { id: 'c6', statement: 'A "festival" is a celebration or cultural event.',     isTrue: true,  explanation: 'Correct!' },
            ],
          },
        },
        {
          title: 'Tell Me About Your Country',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Share interesting facts about your country.',
                turns: [
                  { speaker: 'GUEST', text: 'What is your country known for? Is it big or small?',                                  expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Madagascar is famous for its unique wildlife and beautiful beaches! It is a big island country.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What is the capital city? What language do people speak?',                              expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'The capital is Antananarivo! People speak Malagasy and French.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Does your country have beaches or mountains? What is the weather like?',                expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'We have both beautiful beaches on the coast and green mountains in the center. The weather is mostly warm and tropical.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Is your country known for any festivals? What do people like to do for fun?',           expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! We have the Famadihana festival. People love music, dancing, and visiting the beach for fun.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Does your country have famous landmarks? What is the best time to visit?',             expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! The Avenue of the Baobabs is a famous landmark. The best time to visit is between April and October.', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 7: Leisure & Activities ────────────────────────────────────────
    {
      title: 'Leisure & Activities',
      description: 'Talk about outdoor activities, relaxation, and free time.',
      orderIndex: 7,
      lessons: [
        {
          title: 'Leisure Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Hiking',    translation: 'Leisure vocabulary keyword', imageUrl: 'local:la-words-hiking',    audioUrl: null, targetWord: 'hiking' },
              { id: 'c2', word: 'Camping',   translation: 'Leisure vocabulary keyword', imageUrl: 'local:la-words-camping',   audioUrl: null, targetWord: 'camping' },
              { id: 'c3', word: 'Relax',     translation: 'Leisure vocabulary keyword', imageUrl: 'local:la-words-relax',     audioUrl: null, targetWord: 'relax' },
              { id: 'c4', word: 'Outdoor',   translation: 'Leisure vocabulary keyword', imageUrl: 'local:la-words-outdoor',   audioUrl: null, targetWord: 'outdoor' },
              { id: 'c5', word: 'Adventure', translation: 'Leisure vocabulary keyword', imageUrl: 'local:la-words-adventure', audioUrl: null, targetWord: 'adventure' },
            ],
          },
        },
        {
          title: 'Activities Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '🥾', correctWord: 'Hiking',   distractors: ['Cycling', 'Picnic'] },
              { id: 'c2', emoji: '🏊', correctWord: 'Swimming', distractors: ['Hiking',  'Camping'] },
              { id: 'c3', emoji: '📖', correctWord: 'Reading',  distractors: ['Swimming','Cycling'] },
              { id: 'c4', emoji: '🚴', correctWord: 'Cycling',  distractors: ['Picnic',  'Reading'] },
              { id: 'c5', emoji: '⛺', correctWord: 'Camping',  distractors: ['Swimming','Hiking'] },
              { id: 'c6', emoji: '🧺', correctWord: 'Picnic',   distractors: ['Reading', 'Camping'] },
            ],
          },
        },
        {
          title: 'Leisure Sentences',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'I love to _____ in the ocean near my house.',           blankIndex: 3, correctAnswer: 'swim',   hint: 'Move through water',      distractors: ['cook',     'fly',     'read'] },
              { id: 'c2', sentenceTemplate: 'My favorite way to _____ is reading a good book.',      blankIndex: 4, correctAnswer: 'relax',  hint: 'Take it easy',            distractors: ['exercise', 'work',    'fight'] },
              { id: 'c3', sentenceTemplate: 'I went _____ in the forest last weekend.',              blankIndex: 2, correctAnswer: 'hiking', hint: 'Walking in nature',       distractors: ['shopping', 'cooking', 'studying'] },
              { id: 'c4', sentenceTemplate: 'I prefer _____ weather — sunshine makes me happy!',    blankIndex: 2, correctAnswer: 'hot',    hint: 'Warm temperature',        distractors: ['snowy',    'stormy',  'freezing'] },
              { id: 'c5', sentenceTemplate: 'I like to _____ at home on Sundays.',                   blankIndex: 3, correctAnswer: 'rest',   hint: 'Do nothing / take a break',distractors: ['run',     'drive',   'build'] },
            ],
          },
        },
        {
          title: 'Module Review: Home & Leisure Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: '"Hiking" means walking in nature.',                        isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: 'Relaxing means doing intense work.',                       isTrue: false, explanation: 'Wrong! Relaxing means taking it easy.' },
              { id: 'c3', statement: '"Heritage" means things from the past that we value.',     isTrue: true,  explanation: 'Correct!' },
              { id: 'c4', statement: 'Camping means staying in a hotel.',                        isTrue: false, explanation: 'Wrong! Camping means sleeping outdoors.' },
              { id: 'c5', statement: 'An "adventure" is an exciting or risky experience.',       isTrue: true,  explanation: 'Correct!' },
              { id: 'c6', statement: 'Free time means time when you are not working.',           isTrue: true,  explanation: 'Correct!' },
            ],
          },
        },
        {
          title: 'How Do You Relax?',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Talk about your leisure activities and how you spend free time.',
                turns: [
                  { speaker: 'GUEST', text: 'What do you enjoy most during free time? What is your favorite way to relax?',            expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I love swimming at the beach and listening to music. When I relax, I feel refreshed and happy!', audioUrl: null },
                  { speaker: 'GUEST', text: 'What is your favorite holiday? What do you do and who do you spend it with?',             expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'My favorite holiday is New Year! I spend it with my family — we cook, dance, and celebrate together.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you prefer the beach or the mountains? Why do you like it more?',                      expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Definitely the beach! I love the warm sand and the sound of the waves. It is so peaceful.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What is your favorite activity on the weekend? What is your favorite time of the day?',   expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'On weekends I love going on picnics in the morning. Mornings are my favorite time of the day!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Have you ever tried outdoor activities like hiking? Do you enjoy sports?',                expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I went hiking last month — very rewarding. I also enjoy swimming and cycling as sports.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What activities do you think tourists should try in your country?',                       expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Tourists should try hiking in our national parks, snorkeling in the ocean, and visiting local markets!', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 8: Travel & Vacation ───────────────────────────────────────────
    {
      title: 'Travel & Vacation',
      description: 'Talk about travel plans, transport, luggage, and dream destinations.',
      orderIndex: 8,
      lessons: [
        {
          title: 'Travel Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Destination', translation: 'Travel vocabulary keyword', imageUrl: 'local:tv-words-destination', audioUrl: null, targetWord: 'destination' },
              { id: 'c2', word: 'Passport',    translation: 'Travel vocabulary keyword', imageUrl: 'local:tv-words-passport',    audioUrl: null, targetWord: 'passport' },
              { id: 'c3', word: 'Luggage',     translation: 'Travel vocabulary keyword', imageUrl: 'local:tv-words-luggage',     audioUrl: null, targetWord: 'luggage' },
              { id: 'c4', word: 'Itinerary',   translation: 'Travel vocabulary keyword', imageUrl: 'local:tv-words-itinerary',   audioUrl: null, targetWord: 'itinerary' },
              { id: 'c5', word: 'Solo travel', translation: 'Travel vocabulary keyword', imageUrl: 'local:tv-words-solo-travel', audioUrl: null, targetWord: 'solo travel' },
            ],
          },
        },
        {
          title: 'Transport Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '✈️', correctWord: 'Plane',   distractors: ['Boat',    'Car'] },
              { id: 'c2', emoji: '🚂', correctWord: 'Train',   distractors: ['Bus',     'Plane'] },
              { id: 'c3', emoji: '🚢', correctWord: 'Boat',    distractors: ['Bicycle', 'Train'] },
              { id: 'c4', emoji: '🚗', correctWord: 'Car',     distractors: ['Plane',   'Bus'] },
              { id: 'c5', emoji: '🚌', correctWord: 'Bus',     distractors: ['Train',   'Boat'] },
              { id: 'c6', emoji: '🚲', correctWord: 'Bicycle', distractors: ['Car',     'Train'] },
            ],
          },
        },
        {
          title: 'Travel Sentences',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'Don\'t forget your _____ before you travel abroad.',         blankIndex: 3, correctAnswer: 'passport',  hint: 'Travel document',    distractors: ['sandwich', 'pillow',  'plant'] },
              { id: 'c2', sentenceTemplate: 'I packed all my _____ in a big red suitcase.',               blankIndex: 4, correctAnswer: 'luggage',   hint: 'Bags for travel',    distractors: ['music',    'dreams',  'ideas'] },
              { id: 'c3', sentenceTemplate: 'My _____ vacation was a trip to the coast.',                 blankIndex: 1, correctAnswer: 'best',      hint: 'Superlative word',   distractors: ['worst',    'longest', 'strangest'] },
              { id: 'c4', sentenceTemplate: 'She loves to travel _____, exploring cities alone.',         blankIndex: 4, correctAnswer: 'solo',      hint: 'Alone',              distractors: ['never',    'quietly', 'always'] },
              { id: 'c5', sentenceTemplate: 'We followed the _____ carefully so we didn\'t miss anything.',blankIndex:3, correctAnswer: 'itinerary', hint: 'Trip schedule',      distractors: ['recipe',   'menu',    'song'] },
            ],
          },
        },
        {
          title: 'Module Review: Leisure & Travel Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: 'A "passport" is needed to travel to another country.',    isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: '"Luggage" means the bags you carry when traveling.',      isTrue: true,  explanation: 'Correct!' },
              { id: 'c3', statement: '"Solo travel" means traveling with a group.',             isTrue: false, explanation: 'Wrong! Solo means alone.' },
              { id: 'c4', statement: 'An "itinerary" is a plan for your trip.',                 isTrue: true,  explanation: 'Correct!' },
              { id: 'c5', statement: 'A "destination" is where you are going.',                 isTrue: true,  explanation: 'Correct!' },
              { id: 'c6', statement: 'Hiking means sitting indoors all day.',                   isTrue: false, explanation: 'Wrong! Hiking means walking in nature.' },
            ],
          },
        },
        {
          title: 'My Dream Vacation',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Talk about travel experiences and dream destinations.',
                turns: [
                  { speaker: 'GUEST', text: 'What is your dream vacation destination? What is the best trip you have been on?',   expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'My dream is to visit Paris and the Eiffel Tower! The best trip I took was to the coast of Madagascar.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Have you ever visited a museum? Have you ever stayed in a hotel?',                   expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I visited our national museum. And yes, I stayed in a hotel once — it was amazing!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you prefer traveling solo or with others? Do you plan in advance?',               expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I prefer traveling with friends! And I love planning in advance — it makes me feel ready and excited.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Have you ever stayed in an unusual place like a treehouse or igloo?',                expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Not yet, but I would love to stay in a treehouse in the rainforest one day!', audioUrl: null },
                  { speaker: 'GUEST', text: 'What do you always pack when you travel? What is your preferred transport?',         expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I always pack my passport, snacks, and camera! I prefer traveling by plane — it is the fastest way.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you enjoy trying local foods when traveling? What is the most unusual food you tried?', expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I always try local food. The most unusual thing I tried was fried insects — surprisingly tasty!', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 9: Hotel & Hospitality ─────────────────────────────────────────
    {
      title: 'Hotel & Hospitality',
      description: 'Learn hotel vocabulary and practice guest service conversations.',
      orderIndex: 9,
      lessons: [
        {
          title: 'Hotel Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Reservation', translation: 'Hotel vocabulary keyword', imageUrl: 'local:hh-words-reservation', audioUrl: null, targetWord: 'reservation' },
              { id: 'c2', word: 'Check-in',    translation: 'Hotel vocabulary keyword', imageUrl: 'local:hh-words-check-in',    audioUrl: null, targetWord: 'check-in' },
              { id: 'c3', word: 'Suite',       translation: 'Hotel vocabulary keyword', imageUrl: 'local:hh-words-suite',       audioUrl: null, targetWord: 'suite' },
              { id: 'c4', word: 'Concierge',   translation: 'Hotel vocabulary keyword', imageUrl: 'local:hh-words-concierge',   audioUrl: null, targetWord: 'concierge' },
              { id: 'c5', word: 'Amenities',   translation: 'Hotel vocabulary keyword', imageUrl: 'local:hh-words-amenities',   audioUrl: null, targetWord: 'amenities' },
            ],
          },
        },
        {
          title: 'Hotel Vocabulary Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '🏛️', correctWord: 'Lobby',     distractors: ['Pool',     'Elevator'] },
              { id: 'c2', emoji: '🛗', correctWord: 'Elevator',  distractors: ['Luggage',  'Lobby'] },
              { id: 'c3', emoji: '🧳', correctWord: 'Luggage',   distractors: ['Room Key', 'Pool'] },
              { id: 'c4', emoji: '🔑', correctWord: 'Room Key',  distractors: ['Reception','Luggage'] },
              { id: 'c5', emoji: '🏊', correctWord: 'Pool',      distractors: ['Lobby',    'Room Key'] },
              { id: 'c6', emoji: '🛎️', correctWord: 'Reception', distractors: ['Elevator', 'Pool'] },
            ],
          },
        },
        {
          title: 'Hotel Phrases',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'Good morning! _____ to our hotel.',                blankIndex: 2, correctAnswer: 'Welcome',  hint: 'Greeting word',    distractors: ['Goodbye',    'Sunny',    'Never'] },
              { id: 'c2', sentenceTemplate: 'Can I see your _____ please?',                      blankIndex: 4, correctAnswer: 'passport', hint: 'Travel document',  distractors: ['phone',      'shoe',     'hat'] },
              { id: 'c3', sentenceTemplate: 'Your room is on the _____ floor.',                  blankIndex: 5, correctAnswer: 'third',    hint: 'Floor number',     distractors: ['underground','cloud',    'invisible'] },
              { id: 'c4', sentenceTemplate: 'The _____ will carry your bags to your room.',      blankIndex: 1, correctAnswer: 'bellboy',  hint: 'Hotel staff role', distractors: ['chef',       'pilot',    'gardener'] },
              { id: 'c5', sentenceTemplate: 'Please fill in this _____ form.',                   blankIndex: 4, correctAnswer: 'check-in', hint: 'Arrival process',  distractors: ['graduation', 'birthday', 'wedding'] },
            ],
          },
        },
        {
          title: 'Module Review: Travel & Hotel Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: 'You should greet guests warmly when they arrive.',  isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: '"Check-out" means the guest is arriving.',          isTrue: false, explanation: 'Wrong! Check-out means leaving.' },
              { id: 'c3', statement: 'A "suite" is a luxury hotel room.',                 isTrue: true,  explanation: 'Correct!' },
              { id: 'c4', statement: 'The lobby is where guests sleep.',                  isTrue: false, explanation: 'Wrong! Guests sleep in their rooms.' },
              { id: 'c5', statement: '"Amenities" are the services the hotel offers.',    isTrue: true,  explanation: 'Correct!' },
              { id: 'c6', statement: 'A "reservation" means booking something in advance.',isTrue: true,  explanation: 'Correct!' },
            ],
          },
        },
        {
          title: 'Hotel Check-In',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Practice hotel check-in and guest service conversations.',
                turns: [
                  { speaker: 'GUEST', text: 'Hello, I have a reservation under Johnson. What services does the hotel have?',  expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Welcome, Mr. Johnson! We have a pool, gym, spa, and a 24-hour restaurant. Let me check your booking.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Have you ever had a bad hotel experience? How important is cleanliness?',        expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Cleanliness is the most important thing for us! Every room is cleaned daily. We always try to provide the best experience.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Is my room ready? What kind of room do you recommend?',                          expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! Your deluxe suite on the fifth floor is ready. It has a beautiful view and a private balcony.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What is the difference between a hotel and a hostel?',                           expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'A hotel gives you a private room and more services. A hostel has shared rooms and is cheaper.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you think good hospitality makes a difference?',                              expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Absolutely! Good hospitality makes guests feel welcome, comfortable, and want to come back again.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What does a receptionist do? What is the role of a hotel manager?',             expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'A receptionist welcomes guests and handles check-in. The manager oversees all hotel operations and staff.', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 10: Restaurant & Food Service ──────────────────────────────────
    {
      title: 'Restaurant & Food Service',
      description: 'Learn restaurant vocabulary and practice taking orders.',
      orderIndex: 10,
      lessons: [
        {
          title: 'Restaurant Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Menu',       translation: 'Restaurant vocabulary keyword', imageUrl: 'local:rs-words-menu',       audioUrl: null, targetWord: 'menu' },
              { id: 'c2', word: 'Appetizer',  translation: 'Restaurant vocabulary keyword', imageUrl: 'local:rs-words-appetizer',  audioUrl: null, targetWord: 'appetizer' },
              { id: 'c3', word: 'Specialty',  translation: 'Restaurant vocabulary keyword', imageUrl: 'local:rs-words-specialty',  audioUrl: null, targetWord: 'specialty' },
              { id: 'c4', word: 'Bill',       translation: 'Restaurant vocabulary keyword', imageUrl: 'local:rs-words-bill',       audioUrl: null, targetWord: 'bill' },
              { id: 'c5', word: 'Tip',        translation: 'Restaurant vocabulary keyword', imageUrl: 'local:rs-words-tip',        audioUrl: null, targetWord: 'tip' },
            ],
          },
        },
        {
          title: 'Restaurant Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '📋', correctWord: 'Menu',        distractors: ['Bill',      'Waiter'] },
              { id: 'c2', emoji: '🤵', correctWord: 'Waiter',      distractors: ['Appetizer', 'Menu'] },
              { id: 'c3', emoji: '🥗', correctWord: 'Appetizer',   distractors: ['Main Course','Waiter'] },
              { id: 'c4', emoji: '🍽️', correctWord: 'Main Course', distractors: ['Dessert',   'Menu'] },
              { id: 'c5', emoji: '🍰', correctWord: 'Dessert',     distractors: ['Bill',      'Appetizer'] },
              { id: 'c6', emoji: '💳', correctWord: 'Bill',        distractors: ['Menu',      'Dessert'] },
            ],
          },
        },
        {
          title: 'Food Service Phrases',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'Are you ready to _____ ?',                          blankIndex: 4, correctAnswer: 'order',  hint: 'Choose from the menu', distractors: ['sleep',    'fly',    'run'] },
              { id: 'c2', sentenceTemplate: 'Our _____ of the day is chicken soup.',              blankIndex: 1, correctAnswer: 'special',hint: 'Today\'s featured dish',distractors: ['secret',   'problem','song'] },
              { id: 'c3', sentenceTemplate: 'Would you like to see the _____ ?',                  blankIndex: 6, correctAnswer: 'menu',   hint: 'List of dishes',       distractors: ['wall',     'ceiling','floor'] },
              { id: 'c4', sentenceTemplate: 'Can I get the _____ , please?',                      blankIndex: 4, correctAnswer: 'bill',   hint: 'Payment request',      distractors: ['window',   'garden', 'roof'] },
              { id: 'c5', sentenceTemplate: 'Enjoy your _____ !',                                 blankIndex: 2, correctAnswer: 'meal',   hint: 'Food you are eating',  distractors: ['homework', 'nap',    'shoes'] },
            ],
          },
        },
        {
          title: 'Module Review: Hotel & Restaurant Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: 'An appetizer comes before the main course.',         isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: '"On the house" means the guest pays double.',        isTrue: false, explanation: 'Wrong! On the house means it is free.' },
              { id: 'c3', statement: 'A waiter takes orders from customers.',              isTrue: true,  explanation: 'Correct!' },
              { id: 'c4', statement: 'A "tip" is extra money for good service.',           isTrue: true,  explanation: 'Correct!' },
              { id: 'c5', statement: 'A "concierge" helps guests in a hotel.',             isTrue: true,  explanation: 'Correct!' },
              { id: 'c6', statement: 'You should rush guests to finish eating quickly.',   isTrue: false, explanation: 'Wrong! Guests should enjoy their meal at their pace.' },
            ],
          },
        },
        {
          title: 'Taking an Order',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Practice restaurant service and taking customer orders.',
                turns: [
                  { speaker: 'GUEST', text: 'Good evening! Can we see the menu? Do you prefer buffet or menu-based meals?',  expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Good evening! Here is the menu. We offer both a buffet and à la carte options. Can I get you something to drink first?', audioUrl: null },
                  { speaker: 'GUEST', text: 'What is the most important thing in restaurant service?',                        expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'The most important things are friendly service, clean environment, and delicious food — we take all three seriously!', audioUrl: null },
                  { speaker: 'GUEST', text: 'What do you recommend today? What is the specialty?',                            expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Our specialty today is grilled fish with local vegetables. It is delicious and very popular!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you think restaurants should offer vegetarian options?',                      expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! We always have vegetarian dishes. Good food should be available for everyone.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Perfect! We will have two of those. Do restaurants need outdoor seating?',      expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Excellent choice! And yes — we have a lovely outdoor terrace if you prefer to sit outside!', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 11: Handling Complaints ────────────────────────────────────────
    {
      title: 'Handling Complaints',
      description: 'Learn how to respond to guest complaints professionally.',
      orderIndex: 11,
      lessons: [
        {
          title: 'Complaint & Apology Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Apologize', translation: 'Complaint vocabulary keyword', imageUrl: 'local:cp-words-apologize', audioUrl: null, targetWord: 'apologize' },
              { id: 'c2', word: 'Complaint', translation: 'Complaint vocabulary keyword', imageUrl: 'local:cp-words-complaint', audioUrl: null, targetWord: 'complaint' },
              { id: 'c3', word: 'Refund',    translation: 'Complaint vocabulary keyword', imageUrl: 'local:cp-words-refund',    audioUrl: null, targetWord: 'refund' },
              { id: 'c4', word: 'Manager',   translation: 'Complaint vocabulary keyword', imageUrl: 'local:cp-words-manager',   audioUrl: null, targetWord: 'manager' },
              { id: 'c5', word: 'Solution',  translation: 'Complaint vocabulary keyword', imageUrl: 'local:cp-words-solution',  audioUrl: null, targetWord: 'solution' },
            ],
          },
        },
        {
          title: 'Complaint Phrase Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '🙏', correctWord: 'Apologize', distractors: ['Complaint', 'Refund'] },
              { id: 'c2', emoji: '😠', correctWord: 'Complaint', distractors: ['Fix',       'Apologize'] },
              { id: 'c3', emoji: '🔧', correctWord: 'Fix',       distractors: ['Manager',   'Solution'] },
              { id: 'c4', emoji: '👔', correctWord: 'Manager',   distractors: ['Refund',    'Fix'] },
              { id: 'c5', emoji: '💰', correctWord: 'Refund',    distractors: ['Solution',  'Manager'] },
              { id: 'c6', emoji: '✅', correctWord: 'Solution',  distractors: ['Apologize', 'Complaint'] },
            ],
          },
        },
        {
          title: 'Polite Responses',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'I _____ for the inconvenience.',                  blankIndex: 1, correctAnswer: 'apologize', hint: 'Say sorry',         distractors: ['laugh',  'dance',  'forget'] },
              { id: 'c2', sentenceTemplate: 'Let me _____ that for you right away.',           blankIndex: 2, correctAnswer: 'fix',       hint: 'Repair or solve',   distractors: ['ignore', 'break',  'hide'] },
              { id: 'c3', sentenceTemplate: 'I understand your _____ .',                       blankIndex: 3, correctAnswer: 'concern',   hint: 'Worry or issue',    distractors: ['joke',   'song',   'recipe'] },
              { id: 'c4', sentenceTemplate: 'Would you like to speak to the _____ ?',          blankIndex: 6, correctAnswer: 'manager',   hint: 'Person in charge',  distractors: ['gardener','pilot', 'cook'] },
              { id: 'c5', sentenceTemplate: 'We will make sure this doesn\'t _____ again.',   blankIndex: 6, correctAnswer: 'happen',    hint: 'Occur or take place',distractors: ['dance',  'sing',   'fly'] },
            ],
          },
        },
        {
          title: 'Module Review: Restaurant & Complaints Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: 'You should always apologize first when a guest complains.', isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: 'Ignoring a complaint is the best approach.',               isTrue: false, explanation: 'Wrong! Always address complaints promptly.' },
              { id: 'c3', statement: 'Saying "I understand" shows empathy.',                     isTrue: true,  explanation: 'Correct!' },
              { id: 'c4', statement: 'Offering a solution shows good service.',                  isTrue: true,  explanation: 'Correct!' },
              { id: 'c5', statement: 'A "refund" means giving money back to the customer.',      isTrue: true,  explanation: 'Correct!' },
              { id: 'c6', statement: 'A "tip" is a penalty charged to bad customers.',           isTrue: false, explanation: 'Wrong! A tip is a reward for good service.' },
            ],
          },
        },
        {
          title: 'Room Complaint',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'A guest is unhappy because the air conditioning is not working.',
                turns: [
                  { speaker: 'GUEST', text: 'Excuse me, the AC in my room is broken. It\'s very hot! Who handles complaints?',  expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I\'m very sorry about that, sir. I handle guest complaints. Let me help you right away.', audioUrl: null },
                  { speaker: 'GUEST', text: 'I\'ve been waiting for an hour! Who deals with maintenance and repairs?',          expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I sincerely apologize for the delay. Our maintenance team handles all repairs. I\'ll call them immediately!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Who carries luggage and who cleans the rooms here?',                               expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Our bellboy carries luggage to your room. Our housekeeping team cleans every room daily.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Can I get a different room? Who arranges that?',                                   expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Of course! I can arrange that for you right now. Let me check what rooms are available.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What if I want a refund? Who do I speak to?',                                     expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I understand completely. I\'ll connect you with our manager who takes care of refunds and special requests.', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 12: News & Sports ──────────────────────────────────────────────
    {
      title: 'News & Sports',
      description: 'Talk about current events, sports, and your favorite teams.',
      orderIndex: 12,
      lessons: [
        {
          title: 'News & Sports Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'News',          translation: 'News & Sports keyword', imageUrl: 'local:ns-words-news',         audioUrl: null, targetWord: 'news' },
              { id: 'c2', word: 'Broadcaster',   translation: 'News & Sports keyword', imageUrl: 'local:ns-words-broadcaster',  audioUrl: null, targetWord: 'broadcaster' },
              { id: 'c3', word: 'Stadium',       translation: 'News & Sports keyword', imageUrl: 'local:ns-words-stadium',      audioUrl: null, targetWord: 'stadium' },
              { id: 'c4', word: 'Olympics',      translation: 'News & Sports keyword', imageUrl: 'local:ns-words-olympics',     audioUrl: null, targetWord: 'olympics' },
              { id: 'c5', word: 'Championship',  translation: 'News & Sports keyword', imageUrl: 'local:ns-words-championship', audioUrl: null, targetWord: 'championship' },
            ],
          },
        },
        {
          title: 'Sports Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '⚽', correctWord: 'Football',   distractors: ['Basketball','Boxing'] },
              { id: 'c2', emoji: '🏀', correctWord: 'Basketball', distractors: ['Tennis',    'Football'] },
              { id: 'c3', emoji: '🎾', correctWord: 'Tennis',     distractors: ['Swimming',  'Basketball'] },
              { id: 'c4', emoji: '🏊', correctWord: 'Swimming',   distractors: ['Cycling',   'Tennis'] },
              { id: 'c5', emoji: '🚴', correctWord: 'Cycling',    distractors: ['Boxing',    'Swimming'] },
              { id: 'c6', emoji: '🥊', correctWord: 'Boxing',     distractors: ['Football',  'Cycling'] },
            ],
          },
        },
        {
          title: 'News & Sports Sentences',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'I watch the _____ every morning to know what is happening.', blankIndex: 3, correctAnswer: 'news',        hint: 'Daily information',     distractors: ['ceiling',    'garden',  'math'] },
              { id: 'c2', sentenceTemplate: 'My favorite _____ is football. I watch every game!',         blankIndex: 2, correctAnswer: 'sport',        hint: 'Physical activity',     distractors: ['color',      'fruit',   'animal'] },
              { id: 'c3', sentenceTemplate: 'The World Cup is an international football _____ .',          blankIndex: 6, correctAnswer: 'tournament',   hint: 'Competition event',     distractors: ['sandwich',   'tower',   'book'] },
              { id: 'c4', sentenceTemplate: 'The Olympic Games happen every four _____ .',                 blankIndex: 5, correctAnswer: 'years',        hint: 'Time measurement',      distractors: ['days',       'hours',   'seconds'] },
              { id: 'c5', sentenceTemplate: 'A _____ reports the news on television.',                     blankIndex: 1, correctAnswer: 'broadcaster',  hint: 'TV news presenter',     distractors: ['chef',       'swimmer', 'driver'] },
            ],
          },
        },
        {
          title: 'Module Review: Sports & News Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: 'Football is the most popular sport in many countries.', isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: 'The Olympics happen every 2 years.',                    isTrue: false, explanation: 'Wrong! The Olympics happen every 4 years.' },
              { id: 'c3', statement: 'A broadcaster reports news on TV or radio.',            isTrue: true,  explanation: 'Correct!' },
              { id: 'c4', statement: 'A stadium is where sports games are played.',          isTrue: true,  explanation: 'Correct!' },
              { id: 'c5', statement: 'Badminton requires 10 players on each side.',          isTrue: false, explanation: 'Wrong! Badminton is played 1v1 or 2v2.' },
              { id: 'c6', statement: 'The World Cup is a football tournament.',               isTrue: true,  explanation: 'Correct!' },
            ],
          },
        },
        {
          title: 'Talking About Sports & News',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Talk about your favorite sports and how you follow the news.',
                turns: [
                  { speaker: 'GUEST', text: 'Did you watch the news today? What TV news channel do you watch?',              expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I always watch the morning news on the national channel to stay informed about what\'s happening.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you prefer watching the news or reading it online?',                         expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I prefer watching on TV, but I also read news online on my phone. Both help me stay updated!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you play any sports? What sport is popular in your country?',                expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I love football. It is the most popular sport here — everyone supports their local team!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Have you ever been to a live sports game in a stadium?',                        expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I went to a football match in the stadium. The energy and crowd were incredible!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you watch the Olympics? What sport do you like to watch most?',              expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Absolutely! I love watching swimming and athletics in the Olympics. My favorite athlete is a sprinter!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you watch sports competitions like the World Cup?',                          expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! The World Cup is my favorite event. I watch every game with my family and friends!', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 13: Tourism ────────────────────────────────────────────────────
    {
      title: 'Tourism',
      description: 'Talk about famous landmarks, tourist attractions, and guiding visitors.',
      orderIndex: 13,
      lessons: [
        {
          title: 'Tourism Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Tourist',    translation: 'Tourism vocabulary keyword', imageUrl: 'local:tr-words-tourist',    audioUrl: null, targetWord: 'tourist' },
              { id: 'c2', word: 'Visa',       translation: 'Tourism vocabulary keyword', imageUrl: 'local:tr-words-visa',       audioUrl: null, targetWord: 'visa' },
              { id: 'c3', word: 'Souvenir',   translation: 'Tourism vocabulary keyword', imageUrl: 'local:tr-words-souvenir',   audioUrl: null, targetWord: 'souvenir' },
              { id: 'c4', word: 'Tour Guide', translation: 'Tourism vocabulary keyword', imageUrl: 'local:tr-words-tour-guide', audioUrl: null, targetWord: 'tour guide' },
              { id: 'c5', word: 'Landmark',   translation: 'Tourism vocabulary keyword', imageUrl: 'local:tr-words-landmark',   audioUrl: null, targetWord: 'landmark' },
            ],
          },
        },
        {
          title: 'Famous Landmarks Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '🗼', correctWord: 'Eiffel Tower',   distractors: ['Pyramid',      'Zoo'] },
              { id: 'c2', emoji: '🔺', correctWord: 'Pyramid',        distractors: ['Cruise Ship',  'Eiffel Tower'] },
              { id: 'c3', emoji: '🚢', correctWord: 'Cruise Ship',    distractors: ['National Park','Pyramid'] },
              { id: 'c4', emoji: '🏞️', correctWord: 'National Park',  distractors: ['Amusement Park','Cruise Ship'] },
              { id: 'c5', emoji: '🎡', correctWord: 'Amusement Park', distractors: ['Zoo',          'National Park'] },
              { id: 'c6', emoji: '🦁', correctWord: 'Zoo',            distractors: ['Eiffel Tower', 'Amusement Park'] },
            ],
          },
        },
        {
          title: 'Tourism Sentences',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'A _____ visits places for pleasure and learning.',     blankIndex: 1, correctAnswer: 'tourist',    hint: 'Person who visits places', distractors: ['doctor',      'soldier',      'farmer'] },
              { id: 'c2', sentenceTemplate: 'You need a _____ to enter some foreign countries.',    blankIndex: 3, correctAnswer: 'visa',        hint: 'Entry permission',         distractors: ['sandwich',    'pencil',       'flower'] },
              { id: 'c3', sentenceTemplate: 'I bought a small _____ to remember my trip.',          blankIndex: 3, correctAnswer: 'souvenir',    hint: 'Travel keepsake',          distractors: ['problem',     'mistake',      'cloud'] },
              { id: 'c4', sentenceTemplate: 'The Eiffel Tower is a famous _____ in Paris.',         blankIndex: 5, correctAnswer: 'landmark',    hint: 'Famous place',             distractors: ['restaurant',  'hospital',     'school'] },
              { id: 'c5', sentenceTemplate: 'A _____ helps visitors explore a new city.',           blankIndex: 1, correctAnswer: 'tour guide',  hint: 'Person who shows the way', distractors: ['taxi driver', 'hotel chef',   'airline pilot'] },
            ],
          },
        },
        {
          title: 'Module Review: Tourism Keywords',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: 'The Eiffel Tower is located in Paris, France.',        isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: 'A visa allows you to enter a foreign country.',        isTrue: true,  explanation: 'Correct!' },
              { id: 'c3', statement: 'A souvenir is something you eat on vacation.',         isTrue: false, explanation: 'Wrong! A souvenir is a keepsake you buy.' },
              { id: 'c4', statement: 'The Pyramids of Giza are in Egypt.',                   isTrue: true,  explanation: 'Correct!' },
              { id: 'c5', statement: 'A tour guide helps tourists explore a place.',         isTrue: true,  explanation: 'Correct!' },
              { id: 'c6', statement: 'The Great Wall of China is in Japan.',                 isTrue: false, explanation: 'Wrong! It is in China.' },
            ],
          },
        },
        {
          title: 'Helping a Tourist',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Help a tourist navigate and learn about your country.',
                turns: [
                  { speaker: 'GUEST', text: 'Do you know what a tour guide is? Do you have a passport? Have you ever ridden an airplane?', expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! A tour guide helps visitors explore a place. I have a passport and I have traveled by plane!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you know what a visa is? What is an amusement park or zoo?',                            expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! A visa allows you to enter another country. A zoo is a place with animals — and an amusement park has fun rides!', audioUrl: null },
                  { speaker: 'GUEST', text: 'What is the most famous landmark in your country? Do you know where the Eiffel Tower is?',  expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'The Avenue of the Baobabs is our most famous landmark! The Eiffel Tower is in Paris, France.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you know the Pyramid of Giza? How about the Great Wall of China?',                      expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! The Pyramid of Giza is in Egypt, and the Great Wall of China is in China — both are Wonders of the World!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Have you ever been to a national park? What souvenirs should I buy?',                      expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! Our national parks have lemurs and chameleons. For souvenirs, I recommend local woven baskets and crafts!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you usually take lots of photos when traveling? Have you been on a city bus tour?',     expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I always take lots of photos. And yes — city bus tours are a great way to see everything quickly!', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },

    // ── MODULE 14: Languages ──────────────────────────────────────────────────
    {
      title: 'Languages',
      description: 'Talk about languages, learning English, and communication.',
      orderIndex: 14,
      lessons: [
        {
          title: 'Language Words',
          orderIndex: 1,
          gameType: GameType.FLASHCARD,
          content: {
            cards: [
              { id: 'c1', word: 'Native Language', translation: 'Language vocabulary keyword', imageUrl: 'local:ln-words-native-language', audioUrl: null, targetWord: 'native language' },
              { id: 'c2', word: 'Fluent',           translation: 'Language vocabulary keyword', imageUrl: 'local:ln-words-fluent',          audioUrl: null, targetWord: 'fluent' },
              { id: 'c3', word: 'Dialect',          translation: 'Language vocabulary keyword', imageUrl: 'local:ln-words-dialect',         audioUrl: null, targetWord: 'dialect' },
              { id: 'c4', word: 'Translate',        translation: 'Language vocabulary keyword', imageUrl: 'local:ln-words-translate',       audioUrl: null, targetWord: 'translate' },
              { id: 'c5', word: 'Vocabulary',       translation: 'Language vocabulary keyword', imageUrl: 'local:ln-words-vocabulary',      audioUrl: null, targetWord: 'vocabulary' },
            ],
          },
        },
        {
          title: 'Language Match',
          orderIndex: 2,
          gameType: GameType.WORD_MATCH,
          content: {
            cards: [
              { id: 'c1', emoji: '🇬🇧', correctWord: 'English',  distractors: ['French',   'Arabic'] },
              { id: 'c2', emoji: '🇫🇷', correctWord: 'French',   distractors: ['Swahili',  'English'] },
              { id: 'c3', emoji: '🇸🇦', correctWord: 'Arabic',   distractors: ['Malagasy', 'French'] },
              { id: 'c4', emoji: '🇰🇪', correctWord: 'Swahili',  distractors: ['Hindi',    'Arabic'] },
              { id: 'c5', emoji: '🇲🇬', correctWord: 'Malagasy', distractors: ['English',  'Swahili'] },
              { id: 'c6', emoji: '🇮🇳', correctWord: 'Hindi',    distractors: ['French',   'Malagasy'] },
            ],
          },
        },
        {
          title: 'Language Sentences',
          orderIndex: 3,
          gameType: GameType.FILL_BLANK,
          content: {
            cards: [
              { id: 'c1', sentenceTemplate: 'My _____ language is Malagasy.',                               blankIndex: 1, correctAnswer: 'native',     hint: 'First language',        distractors: ['broken',   'silent',   'angry'] },
              { id: 'c2', sentenceTemplate: 'I want to be _____ in English so I can help tourists.',        blankIndex: 4, correctAnswer: 'fluent',     hint: 'Speak very well',       distractors: ['quiet',    'confused', 'lost'] },
              { id: 'c3', sentenceTemplate: 'I use a dictionary to improve my _____ .',                     blankIndex: 6, correctAnswer: 'vocabulary', hint: 'Set of known words',    distractors: ['cooking',  'driving',  'sleeping'] },
              { id: 'c4', sentenceTemplate: 'Can you _____ this word into French for me?',                  blankIndex: 2, correctAnswer: 'translate',  hint: 'Change to another lang',distractors: ['break',    'ignore',   'hide'] },
              { id: 'c5', sentenceTemplate: 'Learning English _____ me to find a better job.',              blankIndex: 2, correctAnswer: 'helps',      hint: 'Makes easier',          distractors: ['stops',    'breaks',   'hides'] },
            ],
          },
        },
        {
          title: 'Module Review: Languages & Communication',
          orderIndex: 4,
          gameType: GameType.TRUE_FALSE,
          content: {
            cards: [
              { id: 'c1', statement: 'The most spoken language in the world is Mandarin Chinese.',      isTrue: true,  explanation: 'Correct!' },
              { id: 'c2', statement: 'English is the official language of the United Nations.',         isTrue: true,  explanation: 'Correct!' },
              { id: 'c3', statement: 'A dialect is a variation of a language spoken in a region.',      isTrue: true,  explanation: 'Correct!' },
              { id: 'c4', statement: 'You need to travel abroad to learn a new language.',              isTrue: false, explanation: 'Wrong! You can learn a language anywhere.' },
              { id: 'c5', statement: 'The official language of Brazil is Spanish.',                     isTrue: false, explanation: 'Wrong! Brazil speaks Portuguese.' },
              { id: 'c6', statement: 'Watching movies in English can help you learn the language.',     isTrue: true,  explanation: 'Correct!' },
            ],
          },
        },
        {
          title: 'Talking About Languages',
          orderIndex: 5,
          gameType: GameType.DIALOGUE,
          content: {
            cards: [
              {
                id: 'c1',
                scenario: 'Talk about the languages you speak and your learning journey.',
                turns: [
                  { speaker: 'GUEST', text: 'What is your native language? What language do you speak at home?',                          expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'My native language is Malagasy — that\'s what I speak at home. I also speak French and I\'m learning English!', audioUrl: null },
                  { speaker: 'GUEST', text: 'How many languages can you speak? Do you find it easy to learn new languages?',              expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'I can speak three — Malagasy, French, and some English. Learning new languages is challenging but exciting!', audioUrl: null },
                  { speaker: 'GUEST', text: 'Do you think learning a new language is important? Should everyone learn English?',           expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! Learning English is very important. It helps me communicate with tourists from all over the world and find better jobs.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What language do most people speak in your country? Which is used in schools?',              expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Most people speak Malagasy. French is widely used in schools and offices. English is becoming more common too.', audioUrl: null },
                  { speaker: 'GUEST', text: 'Have you ever taken a language course? Do you use language apps to practice?',              expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'Yes! I am taking English classes at ALMA. I also use apps on my phone to practice vocabulary every day.', audioUrl: null },
                  { speaker: 'GUEST', text: 'What is the most spoken language in the world? What is the UN\'s official language?',       expectedResponse: null, audioUrl: null },
                  { speaker: 'USER',  text: null, expectedResponse: 'The most spoken language is Mandarin Chinese! And English is the official language of the United Nations.', audioUrl: null },
                ],
              },
            ],
          },
        },
      ],
    },
  ]

  // Remove any modules beyond the defined set before upserting
  const existingModulesToRemove = await prisma.module.findMany({
    where: { orderIndex: { gt: 14 } },
    select: { id: true },
  })
  const moduleIdsToRemove = existingModulesToRemove.map((m) => m.id)

  if (moduleIdsToRemove.length > 0) {
    const lessonsToRemove = await prisma.lesson.findMany({
      where: { moduleId: { in: moduleIdsToRemove } },
      select: { id: true },
    })
    const lessonIdsToRemove = lessonsToRemove.map((l) => l.id)

    if (lessonIdsToRemove.length > 0) {
      await prisma.lessonProgress.deleteMany({ where: { lessonId: { in: lessonIdsToRemove } } })
    }
    await prisma.moduleProgress.deleteMany({ where: { moduleId: { in: moduleIdsToRemove } } })
    await prisma.lesson.deleteMany({ where: { moduleId: { in: moduleIdsToRemove } } })
    await prisma.module.deleteMany({ where: { id: { in: moduleIdsToRemove } } })
  }

  for (const moduleData of modulesData) {
    const { lessons, ...moduleFields } = moduleData

    const mod = await prisma.module.upsert({
      where: { orderIndex: moduleFields.orderIndex },
      update: { title: moduleFields.title, description: moduleFields.description, isPublished: true },
      create: { ...moduleFields, isPublished: true },
    })

    await prisma.lesson.deleteMany({ where: { moduleId: mod.id } })

    for (const lessonData of lessons) {
      await prisma.lesson.create({
        data: { ...lessonData, moduleId: mod.id, xpReward: 20 },
      })
    }
  }

  // ─── 3. Sample Explore content ───────────────────────────────────────────────
  await prisma.exploreContent.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Phrase of the Day: Checking In',       body: '"Welcome! Do you have a reservation?" — Use this phrase when greeting hotel guests at the front desk.',                                                   category: ContentCategory.PHRASE_OF_THE_DAY },
      { title: 'Grammar Tip: Polite Requests',          body: 'Use "Could you..." or "Would you mind..." instead of "Can you..." for a more professional tone with guests.',                                            category: ContentCategory.GRAMMAR_TIP },
      { title: 'Culture Note: Tipping',                 body: 'In many English-speaking countries, it is customary to tip hotel and restaurant staff 10–20% of the bill.',                                             category: ContentCategory.CULTURE_NOTE },
      { title: 'Hospitality Fact: The Guest is Always Right', body: 'The phrase "the customer is always right" means you should prioritise guest satisfaction, even when they are wrong.',                             category: ContentCategory.HOSPITALITY_FACT },
      { title: 'Phrase of the Day: Offering Help',      body: '"How may I assist you today?" — A professional way to offer help to any guest or customer.',                                                             category: ContentCategory.PHRASE_OF_THE_DAY },
      { title: 'Grammar Tip: Present Continuous',       body: 'Use present continuous for things happening right now: "I am preparing your room" instead of "I prepare your room".',                                  category: ContentCategory.GRAMMAR_TIP },
    ],
  })

  // ─── Songs ──────────────────────────────────────────────────────────────────
  const songs = [
    {
      id: 'scarborough-fair',
      title: 'Scarborough Fair',
      artist: 'Traditional English Folk Song',
      genre: 'Folk',
      emoji: '🌿',
      youtubeUrl: 'https://youtu.be/BYQaD2CAi9A',
      orderIndex: 0,
      lyrics: [
        'Are you going to Scarborough Fair',
        'Parsley sage rosemary and thyme',
        'Remember me to one who lives there',
        'For once she was a true love of mine',
        'Tell her to make me a cambric shirt',
        'Parsley sage rosemary and thyme',
        'Without any seam or fine needlework',
        'And then she will be a true love of mine',
        'Tell her to find me an acre of land',
        'Parsley sage rosemary and thyme',
        'Between the salt water and the sea strand',
        'And then she will be a true love of mine',
      ],
    },
    {
      id: 'auld-lang-syne',
      title: 'Auld Lang Syne',
      artist: 'Traditional',
      genre: 'Traditional',
      emoji: '🥂',
      youtubeUrl: 'https://youtu.be/JWPZ8YKgKKE',
      orderIndex: 1,
      lyrics: [
        'Should old acquaintance be forgot',
        'And never brought to mind',
        'Should old acquaintance be forgot',
        'And old lang syne',
        'For old lang syne my dear',
        'For old lang syne',
        'We will take a cup of kindness yet',
        'For old lang syne',
        'And surely you will buy your pint-stoup',
        'And surely I will buy mine',
        'And we will take a cup of kindness yet',
        'For old lang syne',
      ],
    },
    {
      id: 'my-bonnie-lies-over-the-ocean',
      title: 'My Bonnie Lies over the Ocean',
      artist: 'Traditional Scottish/English Folk',
      genre: 'Folk',
      emoji: '🌊',
      youtubeUrl: 'https://youtu.be/NQfBZaJiTpA',
      orderIndex: 2,
      lyrics: [
        'My bonnie lies over the ocean',
        'My bonnie lies over the sea',
        'My bonnie lies over the ocean',
        'Oh bring back my bonnie to me',
        'Bring back bring back',
        'Oh bring back my bonnie to me to me',
        'Bring back bring back',
        'Oh bring back my bonnie to me',
        'Last night as I lay on my pillow',
        'Last night as I lay on my bed',
        'Last night as I lay on my pillow',
        'I dreamt that my bonnie was dead',
      ],
    },
    {
      id: 'oh-susanna',
      title: 'Oh, Susanna',
      artist: 'Stephen Foster',
      genre: 'Folk',
      emoji: '🤠',
      youtubeUrl: 'https://youtu.be/7SNK_hPHVlk',
      orderIndex: 3,
      lyrics: [
        'I come from Alabama',
        'With my banjo on my knee',
        'I am going to Louisiana',
        'My true love for to see',
        'It rained all night the day I left',
        'The weather it was dry',
        'The sun so hot I froze to death',
        'Susanna do not cry',
        'Oh Susanna',
        'Oh do not cry for me',
        'For I come from Alabama',
        'With my banjo on my knee',
      ],
    },
    {
      id: 'home-on-the-range',
      title: 'Home on the Range',
      artist: 'Classic Folk',
      genre: 'Folk',
      emoji: '⛺',
      youtubeUrl: 'https://youtu.be/gQEPdU5XTQQ',
      orderIndex: 4,
      lyrics: [
        'Oh give me a home where the buffalo roam',
        'Where the deer and the antelope play',
        'Where seldom is heard a discouraging word',
        'And the skies are not cloudy all day',
        'Home home on the range',
        'Where the deer and the antelope play',
        'Where seldom is heard a discouraging word',
        'And the skies are not cloudy all day',
        'Where the air is pure the zephyrs so free',
        'The breezes so balmy and light',
        'That I would not exchange my home on the range',
        'For all of the cities so bright',
      ],
    },
    {
      id: 'when-johnny-comes-marching-home',
      title: 'When Johnny Comes Marching Home',
      artist: 'Traditional',
      genre: 'Traditional',
      emoji: '🥁',
      youtubeUrl: 'https://youtu.be/xKMeEZ0iJIM',
      orderIndex: 5,
      lyrics: [
        'When Johnny comes marching home again Hurrah Hurrah',
        'We will give him a hearty welcome then Hurrah Hurrah',
        'The men will cheer and the boys will shout',
        'The ladies they will all turn out',
        'And we will all feel gay when Johnny comes marching home',
        'The old church bell will peal with joy Hurrah Hurrah',
        'To welcome home our darling boy Hurrah Hurrah',
        'The village lads and lassies say',
        'With roses they will strew the way',
        'And we will all feel gay when Johnny comes marching home',
        'Get ready for the Jubilee Hurrah Hurrah',
        'We will give the hero three times three Hurrah Hurrah',
        'The laurel wreath is ready now',
        'To place upon his loyal brow',
        'And we will all feel gay when Johnny comes marching home',
      ],
    },
  ]

  for (const song of songs) {
    await prisma.song.upsert({
      where: { id: song.id },
      update: { lyrics: song.lyrics, orderIndex: song.orderIndex },
      create: song,
    })
  }

  // ─── Test user ──────────────────────────────────────────────────────────────
  const testPasswordHash = await bcrypt.hash('Admin@123', 12)
  await prisma.user.upsert({
    where: { email: 'test@alma.com' },
    update: {},
    create: {
      email: 'test@alma.com',
      passwordHash: testPasswordHash,
      displayName: 'Test User',
      role: 'STUDENT',
      isEmailVerified: true,
      isOnboardingComplete: true,
    },
  })

  // ─── Daily challenge questions ───────────────────────────────────────────────
  console.log('Seeding daily challenge questions...')
  const CHALLENGE_QUESTIONS = [
    { orderIndex: 1,  question: 'How do you greet a guest at a hotel?',                              sampleAnswer: 'Welcome to our hotel',                                                    keywords: ['welcome', 'hotel', 'greet'],                          xpReward: 10 },
    { orderIndex: 2,  question: 'What do you say when a guest checks in?',                           sampleAnswer: 'Good morning, welcome.',                                                  keywords: ['welcome', 'morning'],                                 xpReward: 10 },
    { orderIndex: 3,  question: 'How do you apologize to an unhappy guest?',                         sampleAnswer: "I'm very sorry for the inconvenience. Let me fix that right away.",        keywords: ['sorry', 'apologize', 'fix', 'inconvenience'],         xpReward: 10 },
    { orderIndex: 4,  question: 'What is the word for a meal at the start of a restaurant order?',   sampleAnswer: 'Appetizer',                                                               keywords: ['appetizer', 'starter'],                               xpReward: 10 },
    { orderIndex: 5,  question: 'What do you call the special dish of the day?',                     sampleAnswer: 'The specialty of the day',                                                keywords: ['specialty', 'special'],                               xpReward: 10 },
    { orderIndex: 6,  question: 'How do you ask if a guest is ready to order?',                      sampleAnswer: 'Are you ready to order?',                                                 keywords: ['ready', 'order'],                                     xpReward: 10 },
    { orderIndex: 7,  question: 'What do you say when you bring the bill?',                          sampleAnswer: 'Here is your bill, sir. Thank you for dining with us.',                   keywords: ['bill', 'thank', 'dining'],                            xpReward: 10 },
    { orderIndex: 8,  question: 'Name a unique animal found in Madagascar.',                         sampleAnswer: 'Lemur',                                                                   keywords: ['lemur'],                                              xpReward: 10 },
    { orderIndex: 9,  question: 'What is the capital city of Madagascar?',                           sampleAnswer: 'Antananarivo',                                                            keywords: ['antananarivo'],                                       xpReward: 10 },
    { orderIndex: 10, question: "How do you say 'mother tongue' in simple English?",                 sampleAnswer: 'It is the language you learned first at home.',                           keywords: ['first', 'home'],                                      xpReward: 10 },
    { orderIndex: 11, question: "What does 'fluent' mean?",                                          sampleAnswer: 'It means you can speak a language very well and easily.',                 keywords: ['speak', 'well', 'easily', 'language'],                xpReward: 10 },
    { orderIndex: 12, question: 'How do you tell a tourist about the weather in Madagascar?',        sampleAnswer: 'The weather in Madagascar is warm and tropical.',                         keywords: ['warm', 'tropical', 'weather'],                        xpReward: 10 },
    { orderIndex: 13, question: 'What do you call the list of food at a restaurant?',                sampleAnswer: 'Menu',                                                                    keywords: ['menu'],                                               xpReward: 10 },
    { orderIndex: 14, question: "What is a 'reservation' in a hotel?",                              sampleAnswer: 'A reservation is a booking made in advance.',                             keywords: ['booking', 'advance', 'reservation'],                  xpReward: 10 },
    { orderIndex: 15, question: 'How do you offer help to a lost tourist?',                         sampleAnswer: 'Excuse me, can I help you?',                                              keywords: ['help', 'excuse'],                                     xpReward: 10 },
    { orderIndex: 16, question: 'What is the word for the extra money given for good service?',      sampleAnswer: 'Tip',                                                                     keywords: ['tip'],                                                xpReward: 10 },
    { orderIndex: 17, question: 'How do you describe your hobby to a guest?',                        sampleAnswer: 'My hobby is photography. I love taking pictures of nature.',             keywords: ['hobby', 'photography', 'pictures', 'nature'],         xpReward: 10 },
    { orderIndex: 18, question: "What does 'check-in' mean at a hotel?",                            sampleAnswer: 'Check-in means when a guest arrives and registers at the hotel.',         keywords: ['arrive', 'register', 'hotel', 'check'],               xpReward: 10 },
    { orderIndex: 19, question: 'Name one famous landmark in Madagascar.',                           sampleAnswer: 'The Avenue of the Baobabs',                                               keywords: ['baobab', 'avenue'],                                   xpReward: 10 },
    { orderIndex: 20, question: 'What do you say to a guest who has a complaint?',                   sampleAnswer: 'I understand your concern. Let me find a solution right away.',           keywords: ['understand', 'concern', 'solution'],                  xpReward: 10 },
    { orderIndex: 21, question: "What is a 'tour guide'?",                                          sampleAnswer: 'A tour guide helps visitors explore a new place.',                        keywords: ['guide', 'visitors', 'explore'],                       xpReward: 10 },
    { orderIndex: 22, question: 'How do you recommend a local dish?',                               sampleAnswer: 'I recommend trying our local specialty. It is very delicious!',           keywords: ['recommend', 'local', 'specialty', 'delicious'],       xpReward: 10 },
    { orderIndex: 23, question: "What does 'souvenir' mean?",                                       sampleAnswer: 'A souvenir is a small gift you buy to remember a trip.',                  keywords: ['gift', 'remember', 'trip', 'buy'],                    xpReward: 10 },
    { orderIndex: 24, question: "How do you say 'the weather is sunny today' naturally?",           sampleAnswer: "It's a beautiful sunny day today!",                                       keywords: ['sunny', 'beautiful', 'today'],                        xpReward: 10 },
    { orderIndex: 25, question: "What is a 'best friend'?",                                         sampleAnswer: 'A best friend is your closest and most trusted friend.',                  keywords: ['closest', 'trusted', 'friend'],                       xpReward: 10 },
    { orderIndex: 26, question: "How do you politely ask someone's name?",                          sampleAnswer: 'May I ask your name please?',                                             keywords: ['name', 'may', 'please'],                              xpReward: 10 },
    { orderIndex: 27, question: "What does 'passport' mean?",                                       sampleAnswer: 'A passport is an official document needed to travel abroad.',             keywords: ['passport', 'official', 'travel', 'abroad'],           xpReward: 10 },
    { orderIndex: 28, question: 'How do you describe a hobby you enjoy?',                           sampleAnswer: 'In my free time, I enjoy hiking and exploring nature.',                   keywords: ['free time', 'enjoy', 'hiking'],                       xpReward: 10 },
    { orderIndex: 29, question: 'What do you say when a guest leaves the hotel?',                   sampleAnswer: 'Thank you for staying with us. We hope to see you again soon!',           keywords: ['thank', 'staying', 'hope', 'see you again'],          xpReward: 10 },
    { orderIndex: 30, question: 'What is the difference between breakfast, lunch, and dinner?',     sampleAnswer: 'Breakfast is in the morning, lunch is at midday, and dinner is in the evening.', keywords: ['morning', 'midday', 'evening', 'breakfast', 'lunch', 'dinner'], xpReward: 10 },
  ]
  for (const q of CHALLENGE_QUESTIONS) {
    await prisma.dailyChallenge.upsert({
      where: { orderIndex: q.orderIndex },
      update: { question: q.question, sampleAnswer: q.sampleAnswer, keywords: q.keywords, xpReward: q.xpReward },
      create: q,
    })
  }
  console.log(`✓ Seeded ${CHALLENGE_QUESTIONS.length} daily challenge questions`)

  // ─── Entertainment content ───────────────────────────────────────────────────
  console.log('Seeding entertainment content...')
  await prisma.entertainmentContent.deleteMany()
  const entertainmentItems = [
    {
      type: 'VIDEO' as const, title: 'Two Minute English: At a Hotel',
      description: '2 min 15 sec — Short, focused hotel English conversations for beginners.',
      url: 'https://www.youtube.com/watch?v=UQFbdxkOR_M', duration: '2 min 15 sec', xpReward: 30, orderIndex: 1,
      questions: [
        { question: 'When a guest needs something brought to their room, which hotel service are they talking to?', expectedAnswer: 'Room service or housekeeping', keywords: ['room service', 'housekeeping', 'room'], orderIndex: 1 },
        { question: 'What must a user do while watching this video to build fluency?', expectedAnswer: 'Repeat the words and phrases aloud', keywords: ['repeat', 'aloud', 'say', 'practice', 'speak'], orderIndex: 2 },
      ],
    },
    {
      type: 'VIDEO' as const, title: 'Two Minute English: Booking and Vacations',
      description: '4 min — Learn how to talk about booking trips and vacation planning in English.',
      url: 'https://www.youtube.com/watch?v=GxJzTpfBPwA', duration: '4 min', xpReward: 30, orderIndex: 2,
      questions: [
        { question: 'What phrase would you use to ask if a hotel room is available for a specific date?', expectedAnswer: 'Do you have any rooms available?', keywords: ['available', 'rooms', 'vacancy', 'booking'], orderIndex: 1 },
        { question: 'What information do you typically need to give when making a hotel reservation?', expectedAnswer: 'Your name, dates of stay, and number of guests', keywords: ['name', 'dates', 'guests', 'check-in', 'check in'], orderIndex: 2 },
      ],
    },
    {
      type: 'VIDEO' as const, title: 'Oxford Online English: Rapid Hotel Check-In',
      description: '~4 min roleplay — Professional check-in conversation with tone and hospitality tips.',
      url: 'https://www.youtube.com/watch?v=7a5nPMB5lBk', duration: '~4 min', xpReward: 30, orderIndex: 3,
      questions: [
        { question: 'What is the first thing a front desk agent should say when a guest approaches?', expectedAnswer: 'Welcome or good morning/afternoon, how can I help you?', keywords: ['welcome', 'good morning', 'good afternoon', 'help', 'assist'], orderIndex: 1 },
        { question: 'What document does a guest usually need to present at hotel check-in?', expectedAnswer: 'A passport or ID card', keywords: ['passport', 'id', 'identification', 'document'], orderIndex: 2 },
      ],
    },
    {
      type: 'VIDEO' as const, title: 'Easy English: Short Fast-Food Transactions',
      description: '3 min 30 sec — Simple, slow-paced fast-food ordering conversations for learners.',
      url: 'https://www.youtube.com/watch?v=E7U7FoQXPrc', duration: '3 min 30 sec', xpReward: 30, orderIndex: 4,
      questions: [
        { question: 'What is a polite way to ask for the total amount owed at a fast-food counter?', expectedAnswer: 'How much is that? or What is the total?', keywords: ['total', 'how much', 'price', 'cost'], orderIndex: 1 },
        { question: 'How do you ask if an item is available when ordering food?', expectedAnswer: 'Do you have or Is there available?', keywords: ['do you have', 'available', 'have', 'stock'], orderIndex: 2 },
      ],
    },
    {
      type: 'VIDEO' as const, title: 'Everyday English: Handling a Quick Amenity Request',
      description: '3 min — Learn how hotel staff handle in-house guest requests professionally.',
      url: 'https://www.youtube.com/watch?v=2VsTrA1SYEQ', duration: '3 min', xpReward: 30, orderIndex: 5,
      questions: [
        { question: 'What should you say when a guest asks for extra towels and you are about to fulfill the request?', expectedAnswer: 'Certainly, I will have that brought to your room right away.', keywords: ['certainly', 'right away', 'of course', 'bring', 'deliver'], orderIndex: 1 },
        { question: 'How long should a guest typically wait for an in-room amenity request?', expectedAnswer: 'A few minutes or as soon as possible', keywords: ['minutes', 'soon', 'shortly', 'quickly', 'right away'], orderIndex: 2 },
      ],
    },
    {
      type: 'ARTICLE' as const, title: 'EnglishClub: 2-Minute Hotel Check-In Dialogue',
      description: 'A short, clear hotel check-in and check-out dialogue. Perfect for front desk vocabulary.',
      url: 'https://www.englishclub.com/english-for-work/hotel-check-in.php', duration: null, xpReward: 30, orderIndex: 6,
      questions: [
        { question: 'What phrase does the receptionist use to greet a guest checking in?', expectedAnswer: 'Good morning, can I help you? or Welcome to our hotel.', keywords: ['good morning', 'welcome', 'help', 'check in', 'checking in'], orderIndex: 1 },
        { question: 'What does the receptionist ask for before handing over the room key?', expectedAnswer: 'A credit card or ID for deposit', keywords: ['credit card', 'id', 'passport', 'deposit', 'identification'], orderIndex: 2 },
      ],
    },
    {
      type: 'ARTICLE' as const, title: 'British Council: Hotel Amenities Picture Match',
      description: 'Match hotel amenity pictures to vocabulary. Great for learning facility names.',
      url: 'https://learnenglish.britishcouncil.org/vocabulary/beginner-to-pre-intermediate/hotel', duration: null, xpReward: 30, orderIndex: 7,
      questions: [
        { question: 'If a guest wants to dry themselves after a shower, what should you bring them?', expectedAnswer: 'A towel', keywords: ['towel', 'bath towel', 'dry'], orderIndex: 1 },
        { question: 'What is the name of the place near the hotel entrance where guests check-in?', expectedAnswer: 'Reception or Front desk', keywords: ['reception', 'front desk', 'lobby', 'check in'], orderIndex: 2 },
      ],
    },
    {
      type: 'ARTICLE' as const, title: 'ThoughtCo: The 60-Second Restaurant Script',
      description: 'A direct, practical restaurant dialogue script for ESL learners.',
      url: 'https://www.thoughtco.com/restaurant-english-1210136', duration: null, xpReward: 30, orderIndex: 8,
      questions: [
        { question: 'What is the first thing a waiter says when a customer sits down at a restaurant?', expectedAnswer: 'Good evening, welcome. Can I take your order or what would you like?', keywords: ['welcome', 'order', 'what would you like', 'ready to order', 'help you'], orderIndex: 1 },
        { question: 'How do you ask for the bill at the end of a restaurant meal?', expectedAnswer: 'Can I have the bill please? or Check please.', keywords: ['bill', 'check', 'pay', 'receipt'], orderIndex: 2 },
      ],
    },
    {
      type: 'ARTICLE' as const, title: 'EnglishClub: Front Desk Phone Bookings',
      description: 'Learn how to handle hotel reservation calls with professional English phrases.',
      url: 'https://www.englishclub.com/english-for-work/hotel-reservations.php', duration: null, xpReward: 30, orderIndex: 9,
      questions: [
        { question: 'How should a hotel receptionist answer the phone professionally?', expectedAnswer: 'Good morning, thank you for calling. How may I assist you?', keywords: ['good morning', 'thank you', 'calling', 'assist', 'help'], orderIndex: 1 },
        { question: 'What key information must you confirm when taking a phone reservation?', expectedAnswer: 'The guest name, arrival date, departure date, and room type', keywords: ['name', 'arrival', 'departure', 'date', 'room', 'check in', 'check out'], orderIndex: 2 },
      ],
    },
    {
      type: 'ARTICLE' as const, title: 'Global English Test: Core Hotel Booking Terms',
      description: 'Essential vocabulary guide for hotel bookings and guest services.',
      url: 'https://globalenglishtest.com/hotel-vocabulary', duration: null, xpReward: 30, orderIndex: 10,
      questions: [
        { question: 'What does "complimentary" mean in a hotel context?', expectedAnswer: 'Free or included at no extra charge', keywords: ['free', 'no charge', 'included', 'no cost', 'complimentary'], orderIndex: 1 },
        { question: 'What is the difference between a single room and a double room?', expectedAnswer: 'A single room has one bed and a double room has a larger bed or two beds.', keywords: ['one bed', 'two beds', 'larger bed', 'double bed', 'single bed'], orderIndex: 2 },
      ],
    },
  ]
  for (const item of entertainmentItems) {
    const { questions, ...contentData } = item
    await prisma.entertainmentContent.create({
      data: { ...contentData, questions: { create: questions } },
    })
  }
  console.log(`✓ Seeded ${entertainmentItems.length} entertainment items`)

  // ─── Admin user ─────────────────────────────────────────────────────────────
  console.log('Seeding admin user...')
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@alma.com' },
    update: {},
    create: {
      email: 'admin@alma.com',
      passwordHash: adminPasswordHash,
      displayName: 'Admin',
      role: 'ADMIN',
      isEmailVerified: true,
      isOnboardingComplete: true,
    },
  })
  console.log('✓ Admin user seeded (admin@alma.com / Admin@123)')

  // ─── Countries ───────────────────────────────────────────────────────────────
  console.log('Seeding countries...')
  const COUNTRIES = [
    { name: 'Afghanistan', code: 'AF' },
    { name: 'Albania', code: 'AL' },
    { name: 'Algeria', code: 'DZ' },
    { name: 'Andorra', code: 'AD' },
    { name: 'Angola', code: 'AO' },
    { name: 'Antigua and Barbuda', code: 'AG' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Armenia', code: 'AM' },
    { name: 'Australia', code: 'AU' },
    { name: 'Austria', code: 'AT' },
    { name: 'Azerbaijan', code: 'AZ' },
    { name: 'Bahamas', code: 'BS' },
    { name: 'Bahrain', code: 'BH' },
    { name: 'Bangladesh', code: 'BD' },
    { name: 'Barbados', code: 'BB' },
    { name: 'Belarus', code: 'BY' },
    { name: 'Belgium', code: 'BE' },
    { name: 'Belize', code: 'BZ' },
    { name: 'Benin', code: 'BJ' },
    { name: 'Bhutan', code: 'BT' },
    { name: 'Bolivia', code: 'BO' },
    { name: 'Bosnia and Herzegovina', code: 'BA' },
    { name: 'Botswana', code: 'BW' },
    { name: 'Brazil', code: 'BR' },
    { name: 'Brunei', code: 'BN' },
    { name: 'Bulgaria', code: 'BG' },
    { name: 'Burkina Faso', code: 'BF' },
    { name: 'Burundi', code: 'BI' },
    { name: 'Cambodia', code: 'KH' },
    { name: 'Cameroon', code: 'CM' },
    { name: 'Canada', code: 'CA' },
    { name: 'Cape Verde', code: 'CV' },
    { name: 'Central African Republic', code: 'CF' },
    { name: 'Chad', code: 'TD' },
    { name: 'Chile', code: 'CL' },
    { name: 'China', code: 'CN' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Comoros', code: 'KM' },
    { name: 'Congo', code: 'CG' },
    { name: 'Costa Rica', code: 'CR' },
    { name: 'Croatia', code: 'HR' },
    { name: 'Cuba', code: 'CU' },
    { name: 'Cyprus', code: 'CY' },
    { name: 'Czech Republic', code: 'CZ' },
    { name: 'Denmark', code: 'DK' },
    { name: 'Djibouti', code: 'DJ' },
    { name: 'Dominican Republic', code: 'DO' },
    { name: 'DR Congo', code: 'CD' },
    { name: 'Ecuador', code: 'EC' },
    { name: 'Egypt', code: 'EG' },
    { name: 'El Salvador', code: 'SV' },
    { name: 'Eritrea', code: 'ER' },
    { name: 'Estonia', code: 'EE' },
    { name: 'Eswatini', code: 'SZ' },
    { name: 'Ethiopia', code: 'ET' },
    { name: 'Fiji', code: 'FJ' },
    { name: 'Finland', code: 'FI' },
    { name: 'France', code: 'FR' },
    { name: 'Gabon', code: 'GA' },
    { name: 'Gambia', code: 'GM' },
    { name: 'Georgia', code: 'GE' },
    { name: 'Germany', code: 'DE' },
    { name: 'Ghana', code: 'GH' },
    { name: 'Greece', code: 'GR' },
    { name: 'Guatemala', code: 'GT' },
    { name: 'Guinea', code: 'GN' },
    { name: 'Guinea-Bissau', code: 'GW' },
    { name: 'Guyana', code: 'GY' },
    { name: 'Haiti', code: 'HT' },
    { name: 'Honduras', code: 'HN' },
    { name: 'Hungary', code: 'HU' },
    { name: 'Iceland', code: 'IS' },
    { name: 'India', code: 'IN' },
    { name: 'Indonesia', code: 'ID' },
    { name: 'Iran', code: 'IR' },
    { name: 'Iraq', code: 'IQ' },
    { name: 'Ireland', code: 'IE' },
    { name: 'Israel', code: 'IL' },
    { name: 'Italy', code: 'IT' },
    { name: 'Ivory Coast', code: 'CI' },
    { name: 'Jamaica', code: 'JM' },
    { name: 'Japan', code: 'JP' },
    { name: 'Jordan', code: 'JO' },
    { name: 'Kazakhstan', code: 'KZ' },
    { name: 'Kenya', code: 'KE' },
    { name: 'Kuwait', code: 'KW' },
    { name: 'Kyrgyzstan', code: 'KG' },
    { name: 'Laos', code: 'LA' },
    { name: 'Latvia', code: 'LV' },
    { name: 'Lebanon', code: 'LB' },
    { name: 'Lesotho', code: 'LS' },
    { name: 'Liberia', code: 'LR' },
    { name: 'Libya', code: 'LY' },
    { name: 'Liechtenstein', code: 'LI' },
    { name: 'Lithuania', code: 'LT' },
    { name: 'Luxembourg', code: 'LU' },
    { name: 'Madagascar', code: 'MG' },
    { name: 'Malawi', code: 'MW' },
    { name: 'Malaysia', code: 'MY' },
    { name: 'Maldives', code: 'MV' },
    { name: 'Mali', code: 'ML' },
    { name: 'Malta', code: 'MT' },
    { name: 'Mauritania', code: 'MR' },
    { name: 'Mauritius', code: 'MU' },
    { name: 'Mexico', code: 'MX' },
    { name: 'Moldova', code: 'MD' },
    { name: 'Monaco', code: 'MC' },
    { name: 'Mongolia', code: 'MN' },
    { name: 'Montenegro', code: 'ME' },
    { name: 'Morocco', code: 'MA' },
    { name: 'Mozambique', code: 'MZ' },
    { name: 'Myanmar', code: 'MM' },
    { name: 'Namibia', code: 'NA' },
    { name: 'Nepal', code: 'NP' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'New Zealand', code: 'NZ' },
    { name: 'Nicaragua', code: 'NI' },
    { name: 'Niger', code: 'NE' },
    { name: 'Nigeria', code: 'NG' },
    { name: 'North Korea', code: 'KP' },
    { name: 'North Macedonia', code: 'MK' },
    { name: 'Norway', code: 'NO' },
    { name: 'Oman', code: 'OM' },
    { name: 'Pakistan', code: 'PK' },
    { name: 'Palestine', code: 'PS' },
    { name: 'Panama', code: 'PA' },
    { name: 'Papua New Guinea', code: 'PG' },
    { name: 'Paraguay', code: 'PY' },
    { name: 'Peru', code: 'PE' },
    { name: 'Philippines', code: 'PH' },
    { name: 'Poland', code: 'PL' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Qatar', code: 'QA' },
    { name: 'Romania', code: 'RO' },
    { name: 'Russia', code: 'RU' },
    { name: 'Rwanda', code: 'RW' },
    { name: 'Saudi Arabia', code: 'SA' },
    { name: 'Senegal', code: 'SN' },
    { name: 'Serbia', code: 'RS' },
    { name: 'Sierra Leone', code: 'SL' },
    { name: 'Singapore', code: 'SG' },
    { name: 'Slovakia', code: 'SK' },
    { name: 'Slovenia', code: 'SI' },
    { name: 'Somalia', code: 'SO' },
    { name: 'South Africa', code: 'ZA' },
    { name: 'South Korea', code: 'KR' },
    { name: 'South Sudan', code: 'SS' },
    { name: 'Spain', code: 'ES' },
    { name: 'Sri Lanka', code: 'LK' },
    { name: 'Sudan', code: 'SD' },
    { name: 'Sweden', code: 'SE' },
    { name: 'Switzerland', code: 'CH' },
    { name: 'Syria', code: 'SY' },
    { name: 'Taiwan', code: 'TW' },
    { name: 'Tajikistan', code: 'TJ' },
    { name: 'Tanzania', code: 'TZ' },
    { name: 'Thailand', code: 'TH' },
    { name: 'Timor-Leste', code: 'TL' },
    { name: 'Togo', code: 'TG' },
    { name: 'Trinidad and Tobago', code: 'TT' },
    { name: 'Tunisia', code: 'TN' },
    { name: 'Turkey', code: 'TR' },
    { name: 'Turkmenistan', code: 'TM' },
    { name: 'Uganda', code: 'UG' },
    { name: 'Ukraine', code: 'UA' },
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'United States', code: 'US' },
    { name: 'Uruguay', code: 'UY' },
    { name: 'Uzbekistan', code: 'UZ' },
    { name: 'Venezuela', code: 'VE' },
    { name: 'Vietnam', code: 'VN' },
    { name: 'Yemen', code: 'YE' },
    { name: 'Zambia', code: 'ZM' },
    { name: 'Zimbabwe', code: 'ZW' },
  ]
  for (const c of COUNTRIES) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: { name: c.name, code: c.code },
    })
  }
  console.log(`✓ ${COUNTRIES.length} countries seeded`)

  // ─── Languages ───────────────────────────────────────────────────────────────
  console.log('Seeding languages...')
  const SUGGESTED_LANGUAGES = [
    { flag: '🇲🇬', label: 'Malagasy', value: 'mg' },
    { flag: '🇫🇷', label: 'Français', value: 'fr' },
    { flag: '🇸🇦', label: 'العربية', value: 'ar' },
    { flag: '🇰🇪', label: 'Kiswahili', value: 'sw' },
    { flag: '🇵🇰', label: 'اردو', value: 'ur' },
  ]
  const ALL_LANGUAGES = [
    { flag: '🇦🇫', label: 'Dari / Pashto', value: 'ps' },
    { flag: '🌍', label: 'Afrikaans', value: 'af' },
    { flag: '🇦🇱', label: 'Shqip', value: 'sq' },
    { flag: '🇪🇹', label: 'Amharic — አማርኛ', value: 'am' },
    { flag: '🇸🇦', label: 'العربية', value: 'ar' },
    { flag: '🇦🇲', label: 'Հայերեն', value: 'hy' },
    { flag: '🇦🇿', label: 'Azərbaycan', value: 'az' },
    { flag: '🇧🇩', label: 'বাংলা', value: 'bn' },
    { flag: '🇧🇾', label: 'Беларуская', value: 'be' },
    { flag: '🇧🇦', label: 'Bosanski', value: 'bs' },
    { flag: '🇧🇬', label: 'Български', value: 'bg' },
    { flag: '🇲🇲', label: 'မြန်မာဘာသာ', value: 'my' },
    { flag: '🇰🇭', label: 'ភាសាខ្មែរ', value: 'km' },
    { flag: '🇨🇳', label: '中文 (普通话)', value: 'zh' },
    { flag: '🇹🇼', label: '中文 (繁體)', value: 'zh-TW' },
    { flag: '🇭🇷', label: 'Hrvatski', value: 'hr' },
    { flag: '🇨🇿', label: 'Čeština', value: 'cs' },
    { flag: '🇩🇰', label: 'Dansk', value: 'da' },
    { flag: '🇳🇱', label: 'Nederlands', value: 'nl' },
    { flag: '🇺🇸', label: 'English', value: 'en' },
    { flag: '🇪🇪', label: 'Eesti', value: 'et' },
    { flag: '🇪🇹', label: 'Oromo', value: 'om' },
    { flag: '🇵🇭', label: 'Filipino', value: 'tl' },
    { flag: '🇫🇮', label: 'Suomi', value: 'fi' },
    { flag: '🇫🇷', label: 'Français', value: 'fr' },
    { flag: '🇬🇪', label: 'ქართული', value: 'ka' },
    { flag: '🇩🇪', label: 'Deutsch', value: 'de' },
    { flag: '🇬🇭', label: 'Akan / Twi', value: 'ak' },
    { flag: '🇬🇷', label: 'Ελληνικά', value: 'el' },
    { flag: '🇮🇳', label: 'ગુજરાતી', value: 'gu' },
    { flag: '🇭🇹', label: 'Kreyòl ayisyen', value: 'ht' },
    { flag: '🇳🇬', label: 'Hausa', value: 'ha' },
    { flag: '🇮🇱', label: 'עברית', value: 'he' },
    { flag: '🇮🇳', label: 'हिन्दी', value: 'hi' },
    { flag: '🇭🇺', label: 'Magyar', value: 'hu' },
    { flag: '🇮🇸', label: 'Íslenska', value: 'is' },
    { flag: '🇮🇩', label: 'Bahasa Indonesia', value: 'id' },
    { flag: '🇮🇷', label: 'فارسی', value: 'fa' },
    { flag: '🇮🇶', label: 'کوردی', value: 'ku' },
    { flag: '🇮🇪', label: 'Gaeilge', value: 'ga' },
    { flag: '🇮🇹', label: 'Italiano', value: 'it' },
    { flag: '🇯🇵', label: '日本語', value: 'ja' },
    { flag: '🇮🇩', label: 'Basa Jawa', value: 'jv' },
    { flag: '🇮🇳', label: 'ಕನ್ನಡ', value: 'kn' },
    { flag: '🇰🇿', label: 'Қазақша', value: 'kk' },
    { flag: '🇰🇪', label: 'Kiswahili', value: 'sw' },
    { flag: '🇰🇷', label: '한국어', value: 'ko' },
    { flag: '🇱🇦', label: 'ພາສາລາວ', value: 'lo' },
    { flag: '🇱🇻', label: 'Latviešu', value: 'lv' },
    { flag: '🇱🇹', label: 'Lietuvių', value: 'lt' },
    { flag: '🇲🇬', label: 'Malagasy', value: 'mg' },
    { flag: '🇲🇾', label: 'Bahasa Melayu', value: 'ms' },
    { flag: '🇮🇳', label: 'മലയാളം', value: 'ml' },
    { flag: '🇲🇹', label: 'Malti', value: 'mt' },
    { flag: '🇳🇵', label: 'नेपाली', value: 'ne' },
    { flag: '🇳🇬', label: 'Igbo', value: 'ig' },
    { flag: '🇳🇬', label: 'Yorùbá', value: 'yo' },
    { flag: '🇳🇴', label: 'Norsk', value: 'no' },
    { flag: '🇮🇳', label: 'ଓଡ଼ିଆ', value: 'or' },
    { flag: '🇵🇰', label: 'اردو', value: 'ur' },
    { flag: '🇮🇳', label: 'ਪੰਜਾਬੀ', value: 'pa' },
    { flag: '🇵🇱', label: 'Polski', value: 'pl' },
    { flag: '🇧🇷', label: 'Português', value: 'pt' },
    { flag: '🇷🇴', label: 'Română', value: 'ro' },
    { flag: '🇷🇺', label: 'Русский', value: 'ru' },
    { flag: '🇷🇼', label: 'Kinyarwanda', value: 'rw' },
    { flag: '🇷🇸', label: 'Srpski', value: 'sr' },
    { flag: '🇸🇰', label: 'Slovenčina', value: 'sk' },
    { flag: '🇸🇮', label: 'Slovenščina', value: 'sl' },
    { flag: '🇸🇴', label: 'Soomaali', value: 'so' },
    { flag: '🇿🇦', label: 'Sesotho', value: 'st' },
    { flag: '🇿🇦', label: 'Zulu', value: 'zu' },
    { flag: '🇪🇸', label: 'Español', value: 'es' },
    { flag: '🇱🇰', label: 'සිංහල', value: 'si' },
    { flag: '🇸🇪', label: 'Svenska', value: 'sv' },
    { flag: '🇮🇳', label: 'தமிழ்', value: 'ta' },
    { flag: '🇮🇳', label: 'తెలుగు', value: 'te' },
    { flag: '🇹🇯', label: 'Тоҷикӣ', value: 'tg' },
    { flag: '🇹🇭', label: 'ภาษาไทย', value: 'th' },
    { flag: '🇹🇷', label: 'Türkçe', value: 'tr' },
    { flag: '🇹🇲', label: 'Türkmençe', value: 'tk' },
    { flag: '🇺🇦', label: 'Українська', value: 'uk' },
    { flag: '🇺🇿', label: 'Oʻzbekcha', value: 'uz' },
    { flag: '🇻🇳', label: 'Tiếng Việt', value: 'vi' },
    { flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', label: 'Cymraeg', value: 'cy' },
  ]
  for (let i = 0; i < SUGGESTED_LANGUAGES.length; i++) {
    const l = SUGGESTED_LANGUAGES[i]
    await prisma.language.upsert({
      where: { code: l.value },
      update: { label: l.label, flag: l.flag, isSuggested: true, orderIndex: i },
      create: { code: l.value, label: l.label, flag: l.flag, isSuggested: true, orderIndex: i },
    })
  }
  let langIdx = 100
  const seenLangs = new Set<string>(SUGGESTED_LANGUAGES.map((l) => l.value))
  for (const l of ALL_LANGUAGES) {
    if (seenLangs.has(l.value)) continue
    seenLangs.add(l.value)
    await prisma.language.upsert({
      where: { code: l.value },
      update: { label: l.label, flag: l.flag, isSuggested: false, orderIndex: langIdx },
      create: { code: l.value, label: l.label, flag: l.flag, isSuggested: false, orderIndex: langIdx },
    })
    langIdx++
  }
  console.log(`✓ ${seenLangs.size} languages seeded`)

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
