<script setup>
import { computed, ref, watch } from 'vue'
import ProgressBar from '../Components/Common/ProgressBar.vue'
import FillBlanks from '../Components/Exercises/FillBlanks.vue'
import MatchingPairs from '../Components/Exercises/MatchingPairs.vue'
import MultipleChoise from '../Components/Exercises/MultipleChoise.vue'
import TrueOrFalse from '../Components/Exercises/TrueOrFalse.vue'
import GameHeader from '../Components/Game/GameHeader.vue'
import { useGame } from '../Composables/useGame.js'
import { normalizeExerciseType } from '../Logic/AswerChecker.js'
import ExplanationView from './ExplanationView.vue'

const props = defineProps({
  questions: { type: Array, default: () => [] },
  lives: { type: Number, default: 3 },
})

const emit = defineEmits(['exit', 'finished', 'answered'])

const EXERCISE_COMPONENTS = { MultipleChoise, TrueOrFalse, FillBlanks, MatchingPairs }

const {
  currentQuestion, currentIndex, currentQuestionNumber, totalQuestions,
  lives, maxLives, score, streak, answers, feedback, status,
  hasAnsweredCurrent, isLastQuestion, canSubmit, progress, summary,
  correctCount, wrongCount, bestStreak, submitAnswer, nextQuestion,
  startGame, finishGame, getElapsedSeconds,
} = useGame({ questions: props.questions, lives: props.lives })

let finishEmitted = false
const phase = ref('question')

const exerciseType = computed(() => normalizeExerciseType(currentQuestion.value?.type))
const exerciseComponent = computed(() => EXERCISE_COMPONENTS[exerciseType.value] ?? null)
const questionKey = computed(() => currentQuestion.value?.id ?? currentIndex.value)
const progressLabel = computed(() => totalQuestions.value > 0 ? `Questão ${currentQuestionNumber.value} de ${totalQuestions.value}` : 'Progresso da partida')
const gameEnded = computed(() => {
  if (status.value === 'finished' || lives.value <= 0) return true
  return isLastQuestion.value && hasAnsweredCurrent.value
})

function buildResultPayload() {
  const finalSummary = summary.value

  return {
    score: finalSummary.total,
    runningScore: score.value,
    summary: finalSummary,
    correctCount: correctCount.value,
    wrongCount: wrongCount.value,
    bestStreak: bestStreak.value,
    totalQuestions: totalQuestions.value,
    answers: answers.value,
    elapsedSeconds: getElapsedSeconds(),
    lives: lives.value,
    maxLives: maxLives.value,
  }
}

function emitFinished() {
  if (finishEmitted) return
  finishEmitted = true
  emit('finished', buildResultPayload())
}

function handleSubmitAnswer(answer) {
  if (phase.value !== 'question') return

  const result = submitAnswer(answer)

  if (!result) return

  phase.value = 'explanation'

  emit('answered', {
    feedback: result,
    question: currentQuestion.value,
    questionIndex: currentIndex.value,
    score: score.value,
    lives: lives.value,
    isFinal: gameEnded.value,
  })
}

function handleExplanationContinue() {
  if (gameEnded.value) {
    finishGame()
    emitFinished()
    return
  }

  if (nextQuestion()) {
    phase.value = 'question'
  }
}

function handleExit() {
  finishGame()
  emit('exit', { ...buildResultPayload(), answered: answers.value.length })
}

watch(() => props.questions, (next) => {
  finishEmitted = false
  phase.value = 'question'
  startGame(next, { lives: props.lives })
})
</script>

<template>
  <main class="game-view">
    <div class="game-view__shell">
      <GameHeader :lives="lives" :max-lives="maxLives" :score="score" @exit="handleExit" />

      <div class="game-view__progress">
        <ProgressBar :value="progress" :max="100" :label="progressLabel" show-value />
      </div>

      <Transition name="question" mode="out-in">
        <section v-if="phase === 'explanation' && hasAnsweredCurrent" key="explanation" class="game-view__panel">
          <ExplanationView
            :feedback="feedback"
            :question="currentQuestion"
            :is-final="gameEnded"
            :score="score"
            :lives="lives"
            @continue="handleExplanationContinue"
          />
        </section>

        <section v-else-if="currentQuestion" key="question" class="game-view__panel">
          <div class="game-view__meta">
            <span class="game-view__counter">Questão <strong>{{ currentQuestionNumber }}</strong> de <strong>{{ totalQuestions }}</strong></span>
            <span v-if="streak > 1" class="game-view__streak">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
              </svg>
              Sequência ×{{ streak }}
            </span>
          </div>

          <Transition name="question" mode="out-in">
            <component :is="exerciseComponent" v-if="exerciseComponent" :key="questionKey" :question="currentQuestion" :disabled="!canSubmit" @submit-answer="handleSubmitAnswer" />
            <p v-else key="unsupported" class="game-view__unsupported">Tipo de exercício não suportado: <strong>{{ currentQuestion.type }}</strong></p>
          </Transition>
        </section>

        <section v-else key="empty" class="game-view__panel game-view__empty">
          <span class="game-view__empty-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 3h6" />
              <path d="M10 3v6.5L5.5 17a2.5 2.5 0 0 0 2.2 3.5h8.6a2.5 2.5 0 0 0 2.2-3.5L14 9.5V3" />
              <path d="M7.5 15h9" />
            </svg>
          </span>
          <h1 class="game-view__empty-title">Nenhuma questão disponível</h1>
          <p class="game-view__empty-text">Não encontramos exercícios para iniciar esta partida.</p>
          <button type="button" class="game-view__continue" @click="handleExit">
            <span>Voltar</span>
            <svg
              class="game-view__continue-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </button>
        </section>
      </Transition>
    </div>
  </main>
</template>

<style scoped>
.game-view {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  padding: var(--page-padding);
  color: var(--color-ink);
  background: var(--color-bg);
}

.game-view__shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 860px;
}

.game-view__progress,
.game-view__panel {
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
}

.game-view__progress {
  padding: 16px 20px;
}

.game-view__panel {
  position: relative;
  padding: clamp(20px, 3vw, 32px);
}

.game-view__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.game-view__counter strong {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-cyan-strong);
}

.game-view__streak {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--color-sun-ink);
  background: var(--color-sun-soft);
  border: 2px solid var(--color-sun);
  border-radius: var(--radius-pill);
}

.game-view__streak svg {
  width: 14px;
  height: 14px;
  color: var(--color-sun-strong);
}

.game-view__continue {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 170px;
  padding: 12px 22px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-primary-ink);
  cursor: pointer;
  background: var(--color-primary);
  border: 2px solid var(--color-primary-border);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.game-view__continue:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-active);
  transform: translateY(-1px);
}

.game-view__continue:active {
  background: var(--color-primary-active);
  transform: translateY(1px);
}

.game-view__continue:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.game-view__continue-icon {
  width: 16px;
  height: 16px;
}

.game-view__unsupported {
  margin: 0;
  padding: 16px;
  font-size: 0.92rem;
  color: var(--color-ink-muted);
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-field);
}

.game-view__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: clamp(36px, 6vw, 68px) 20px;
  text-align: center;
}

.game-view__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border: 2px solid var(--color-cyan);
  border-radius: var(--radius-card);
}

.game-view__empty-icon svg {
  width: 28px;
  height: 28px;
}

.game-view__empty-title {
  margin: 4px 0 0;
  font-size: clamp(1.15rem, 2.2vw, 1.45rem);
  font-weight: 800;
  color: var(--color-ink);
}

.game-view__empty-text {
  max-width: 36ch;
  margin: 0 0 6px;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--color-ink-muted);
}

.question-enter-active,
.question-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.question-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.question-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 600px) {
  .game-view {
    padding: 14px 12px 22px;
  }

  .game-view__shell {
    gap: 14px;
  }

  .game-view__progress,
  .game-view__panel {
    border-radius: 14px;
  }

  .game-view__progress {
    padding: 14px 16px;
  }

  .game-view__continue {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .game-view__continue,
  .question-enter-active,
  .question-leave-active {
    transition: none;
  }

  .game-view__continue:hover {
    transform: none;
  }
}
</style>
