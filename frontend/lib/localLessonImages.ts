const LOCAL_LESSON_IMAGES: Record<string, any> = {
  'local:pi-keywords-name': require('../assets/lessons/personal-information/keywords/Name.png'),
  'local:pi-keywords-age': require('../assets/lessons/personal-information/keywords/Age.png'),
  'local:pi-keywords-hometown': require('../assets/lessons/personal-information/keywords/Hometown.png'),
  'local:pi-keywords-mother-tongue': require('../assets/lessons/personal-information/keywords/Mother tongue.png'),
  'local:pi-keywords-dream-job': require('../assets/lessons/personal-information/keywords/Dream job.png'),
  'local:fd-words-breakfast': require('../assets/lessons/food-and-drink/words/Breakfast.png'),
  'local:fd-words-vegetables': require('../assets/lessons/food-and-drink/words/Vegetables.png'),
  'local:fd-words-spicy': require('../assets/lessons/food-and-drink/words/Spicy.png'),
  'local:fd-words-dessert': require('../assets/lessons/food-and-drink/words/Dessert.png'),
  'local:fd-words-recipe': require('../assets/lessons/food-and-drink/words/Recipe.png'),
}

export function resolveLessonImage(imageUrl?: string | null): any | null {
  if (!imageUrl) return null
  if (imageUrl.startsWith('local:')) {
    return LOCAL_LESSON_IMAGES[imageUrl] ?? null
  }
  return null
}

