import BADGE_IMAGES from './badgeImages'

export type BadgeMeta = { name: string; description: string; image: any }

const BADGE_METADATA: Record<string, BadgeMeta> = {
  complete_first_lesson:   { name: 'First Step',         description: 'Complete your first lesson',           image: BADGE_IMAGES['complete_first_lesson'] },
  complete_first_dialogue: { name: 'First Conversation', description: 'Complete your first dialogue lesson',  image: BADGE_IMAGES['complete_first_dialogue'] },
  complete_module_hotel:   { name: 'Hospitality Hero',   description: 'Complete the Hotel & Hospitality module', image: BADGE_IMAGES['complete_module_hotel'] },
  complete_10_lessons:     { name: 'Word Wizard',        description: 'Complete 10 lessons',                  image: BADGE_IMAGES['complete_10_lessons'] },
  quiz_perfect_score:      { name: 'Quiz Master',        description: 'Score 100% on a lesson',               image: BADGE_IMAGES['quiz_perfect_score'] },
  streak_3:                { name: 'On a Roll',          description: 'Maintain a 3-day streak',              image: BADGE_IMAGES['streak_3'] },
  streak_7:                { name: 'Week Warrior',       description: 'Maintain a 7-day streak',              image: BADGE_IMAGES['streak_7'] },
  streak_30:               { name: 'Monthly Marvel',     description: 'Maintain a 30-day streak',             image: BADGE_IMAGES['streak_30'] },
  complete_half_modules:   { name: 'Halfway There',      description: 'Complete half of all modules',         image: BADGE_IMAGES['complete_half_modules'] },
  complete_all_modules:    { name: 'ALMA Graduate',      description: 'Complete all modules',                 image: BADGE_IMAGES['complete_all_modules'] },
  perfect_module:          { name: 'Perfect Score',      description: 'Score 100% on every lesson in a module', image: BADGE_IMAGES['perfect_module'] },
  first_entertainment:     { name: 'World Explorer',     description: 'Complete your first entertainment quiz', image: BADGE_IMAGES['first_entertainment'] },
}

export default BADGE_METADATA
