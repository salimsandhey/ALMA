import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Speech from 'expo-speech'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useVoiceStore, getSpeakOptions } from '../../stores/voiceStore'
import { useLessonStore } from '../../stores/lessonStore'
import { NAVY, TEAL, GOLD, BG, WHITE, GREY } from '../../constants/colors'

import BottomNavBar from '../../components/BottomNavBar'
import FlashcardGame from '../../components/lesson/FlashcardGame'
import WordMatchGame from '../../components/lesson/WordMatchGame'
import FillBlankGame from '../../components/lesson/FillBlankGame'
import TrueFalseGame from '../../components/lesson/TrueFalseGame'
import DialogueGame from '../../components/lesson/DialogueGame'
import ImageSpeakGame from '../../components/lesson/ImageSpeakGame'


function getHelpText(card: any, gameType: string): string {
  switch (gameType) {
    case 'FLASHCARD':   return card.targetWord ?? card.word ?? ''
    case 'WORD_MATCH':  return card.correctWord ?? ''
    case 'FILL_BLANK':  return card.correctAnswer ?? ''
    case 'TRUE_FALSE':  return card.isTrue ? 'The answer is True' : 'The answer is False'
    case 'IMAGE_SPEAK': return card.acceptedAnswers?.[0] ?? card.word ?? ''
    default:            return ''
  }
}

const GAME_INSTRUCTIONS: Record<string, string> = {
  FLASHCARD: 'Say the word out loud!',
  WORD_MATCH: 'Tap a word or speak it!',
  FILL_BLANK: 'Speak the missing word!',
  TRUE_FALSE: 'True or false?',
  DIALOGUE: 'Listen and respond',
  IMAGE_SPEAK: 'Look and say the word',
}

const GAME_COMPONENTS: Record<string, React.ComponentType<any>> = {
  FLASHCARD: FlashcardGame,
  WORD_MATCH: WordMatchGame,
  FILL_BLANK: FillBlankGame,
  TRUE_FALSE: TrueFalseGame,
  DIALOGUE: DialogueGame,
  IMAGE_SPEAK: ImageSpeakGame,
}

export default function LessonScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const voiceGender = useVoiceStore((s) => s.voiceGender)
  const [cardCompleted, setCardCompleted] = useState(false)
  const [helpUsed, setHelpUsed] = useState(false)

  const { data: lesson } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => api.get(`/api/lessons/${id}`).then(r => r.data.lesson),
  })

  const {
    init,
    currentCardIndex,
    nextCard,
    prevCard,
    recordResult,
    totalXpEarned,
    cardResults,
  } = useLessonStore()

  useEffect(() => {
    if (lesson) init(lesson)
  }, [lesson])

  // Reset per-card state whenever the card index changes
  useEffect(() => {
    setCardCompleted(false)
    setHelpUsed(false)
  }, [currentCardIndex])

  if (!lesson) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={TEAL} />
      </SafeAreaView>
    )
  }

  const cards: any[] = lesson.content?.cards ?? []
  const totalCards = cards.length
  const currentCard = cards[currentCardIndex]
  const isLastCard = currentCardIndex === totalCards - 1

  const GameComponent = currentCard ? GAME_COMPONENTS[currentCard.gameType ?? lesson.gameType] : null
  const currentGameType = currentCard?.gameType ?? lesson?.gameType
  const isDialogue = currentGameType === 'DIALOGUE'

  const handleCardComplete = (cardId: string, correct: boolean, xp: number) => {
    recordResult(cardId || `card-${currentCardIndex}`, correct, xp, helpUsed)
    if (isDialogue) {
      // auto-advance without requiring a "Next" tap
      setTimeout(() => {
        if (isLastCard) handleFinish()
        else nextCard()
      }, 400)
    } else {
      setCardCompleted(true)
    }
  }

  const handleNext = () => {
    if (isLastCard) {
      handleFinish()
    } else {
      nextCard()
    }
  }

  const handleFinish = async () => {
    // Read cardResults directly from store to avoid stale closure (DIALOGUE auto-advances
    // via setTimeout before the component re-renders with the updated hook value)
    const { cardResults: currentCardResults } = useLessonStore.getState()
    let badgesUnlocked: { name: string; condition: string; description: string }[] = []
    let serverXpEarned = 0
    let dailyVisitBonus = false
    let isFirstCompletion = true
    try {
      const { data } = await api.post('/api/progress/lesson/complete', {
        lessonId: id,
        cardResults: currentCardResults,
      })
      badgesUnlocked = data.badgesUnlocked ?? []
      serverXpEarned = data.xpEarned ?? 0
      dailyVisitBonus = data.dailyVisitBonus ?? false
      isFirstCompletion = data.isFirstCompletion ?? true
    } catch {
      // Progress save failed — still navigate so user isn't stuck
    }
    queryClient.invalidateQueries({ queryKey: ['progress-home'] })
    queryClient.invalidateQueries({ queryKey: ['modules'] })
    queryClient.invalidateQueries({ queryKey: ['modules-progress'] })
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    const score =
      currentCardResults.length > 0
        ? Math.round(
            (currentCardResults.filter(r => r.correct).length / currentCardResults.length) * 100
          )
        : 0
    router.replace({
      pathname: '/lesson/complete',
      params: {
        xpEarned: String(serverXpEarned),
        isFirstCompletion: isFirstCompletion ? '1' : '0',
        moduleId: lesson?.moduleId ?? '',
        score: String(score),
        nextLessonId: lesson?.nextLessonId ?? '',
        badges: badgesUnlocked.map((b) => b.condition).filter(Boolean).join(','),
        dailyVisitBonus: dailyVisitBonus ? '1' : '0',
      },
    })
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSideBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.moduleLabel}>
            {lesson.moduleEmoji ? `${lesson.moduleEmoji} ` : ''}
            {lesson.moduleTitle ?? ''}
          </Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerSideBtn}
          onPress={() => {
            Alert.alert(
              'Leave Lesson?',
              'Your progress in this lesson will not be saved.',
              [
                { text: 'Stay', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: () => router.replace('/(student)/modules') },
              ]
            )
          }}
        >
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Progress segments — hidden for dialogue (chat history replaces it) */}
      {!isDialogue && (
        <View style={styles.segmentsRow}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[styles.segment, i <= currentCardIndex ? styles.segmentActive : styles.segmentInactive]}
            />
          ))}
        </View>
      )}

      {/* Subtitle — hidden for dialogue */}
      {!isDialogue && currentCard && (() => {
        const gameType = currentCard.gameType ?? lesson.gameType
        const instruction = GAME_INSTRUCTIONS[gameType] ?? ''
        return (
          <Text style={styles.subtitle}>
            {gameType === 'FILL_BLANK'
              ? `🎙️ ${instruction}`
              : `${currentCardIndex + 1} of ${totalCards} — ${instruction}`}
          </Text>
        )
      })()}

      {/* Game area */}
      {(currentCard?.gameType ?? lesson?.gameType) === 'DIALOGUE' ? (
        <View style={styles.dialogueWrapper}>
          {GameComponent && (
            <GameComponent
              key={currentCardIndex}
              card={currentCard}
              onComplete={handleCardComplete}
              xpReward={lesson.xpReward ?? 10}
            />
          )}
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {!currentCard ? (
            <Text style={styles.unknownGame}>No cards available.</Text>
          ) : !GameComponent ? (
            <Text style={styles.unknownGame}>Unknown game type</Text>
          ) : (
            <GameComponent
              key={currentCardIndex}
              card={currentCard}
              onComplete={handleCardComplete}
              xpReward={lesson.xpReward ?? 10}
              currentIndex={currentCardIndex}
              totalCards={totalCards}
            />
          )}
        </ScrollView>
      )}


      {/* Bottom bar — hidden for dialogue (auto-advances on completion) */}
      {!isDialogue && <View style={styles.bottomBar}>
        <View style={styles.bottomSide}>
          <TouchableOpacity
            onPress={prevCard}
            disabled={currentCardIndex === 0}
            style={[currentCardIndex === 0 && styles.disabledOpacity]}
          >
            <Text style={styles.prevBtnText}>‹ Prev</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.helpBtn, helpUsed && styles.helpBtnUsed]}
          onPress={() => {
            if (!currentCard) return
            const text = getHelpText(currentCard, currentGameType)
            if (!text) return
            setHelpUsed(true)
            Speech.speak(text, getSpeakOptions(voiceGender))
          }}
          disabled={helpUsed}
          activeOpacity={0.75}
        >
          <Ionicons name="help-circle-outline" size={18} color={helpUsed ? '#9CA3AF' : NAVY} />
          <Text style={[styles.helpBtnText, helpUsed && styles.helpBtnUsedText]}>
            {helpUsed ? 'Help used' : 'Help  −½ XP'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.bottomSide, { alignItems: 'flex-end' }]}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!cardCompleted}
            style={[styles.nextBtn, !cardCompleted && styles.nextBtnDisabled]}
          >
            <Text style={[styles.nextBtnText, !cardCompleted && styles.nextBtnTextDisabled]}>
              {isLastCard ? 'Finish' : 'Next ›'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>}

      <BottomNavBar />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerSideBtn: {
    width: 36,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  backArrow: {
    color: GREY,
    fontSize: 22,
  },
  closeBtn: {
    color: GREY,
    fontSize: 18,
    textAlign: 'right',
  },
  moduleLabel: {
    color: GREY,
    fontSize: 11,
  },
  lessonTitle: {
    color: NAVY,
    fontSize: 15,
    fontWeight: '700',
  },
  dialogueWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  unknownGame: {
    color: GREY,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  segmentsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  segmentActive: {
    backgroundColor: GOLD,
  },
  segmentInactive: {
    backgroundColor: '#D1D5DB',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bottomSide: {
    flex: 1,
  },
  prevBtnText: {
    color: GREY,
    fontSize: 14,
  },
  disabledOpacity: {
    opacity: 0.3,
  },
  subtitle: {
    color: GREY,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  nextBtn: {
    backgroundColor: NAVY,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  nextBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  nextBtnText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  nextBtnTextDisabled: {
    color: '#9CA3AF',
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  helpBtnUsed: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  helpBtnText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '600',
  },
  helpBtnUsedText: {
    color: '#9CA3AF',
  },
})
