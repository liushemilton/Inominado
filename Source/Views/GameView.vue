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
            <span v-if="streak > 1" class="game-view__streak">Sequência ×{{ streak }}</span>
          </div>

          <Transition name="question" mode="out-in">
            <component :is="exerciseComponent" v-if="exerciseComponent" :key="questionKey" :question="currentQuestion" :disabled="!canSubmit" @submit-answer="handleSubmitAnswer" />
            <p v-else key="unsupported" class="game-view__unsupported">Tipo de exercício não suportado: <strong>{{ currentQuestion.type }}</strong></p>
          </Transition>
        </section>

        <section v-else key="empty" class="game-view__panel game-view__empty">
          <span class="game-view__empty-icon" aria-hidden="true">✦</span>
          <h1 class="game-view__empty-title">Nenhuma questão disponível</h1>
          <p class="game-view__empty-text">Não encontramos exercícios para iniciar esta partida.</p>
          <button type="button" class="game-view__continue" @click="handleExit"><span>Voltar</span></button>
        </section>
      </Transition>
    </div>
  </main>
</template>

<style scoped>
/* O seu bloco de estilos permanece idêntico */
:global(html), :global(body), :global(#app) { min-height: 100%; }
:global(body) { margin: 0; background: #08080c; }

.game-view {
  --neon: #00f0ff; --surface: #0d0e15; --surface-panel: #10121a;
  --border-default: #1a1c29; --text: #eafcff; --muted: #8a99ad;
  position: relative; display: flex; align-items: flex-start; justify-content: center;
  min-height: 100vh; padding: clamp(16px, 3vw, 36px) clamp(12px, 2vw, 24px);
  box-sizing: border-box; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: var(--text); background: #08080c;
}

.game-view__shell { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 820px; }
.game-view__progress, .game-view__panel { background: var(--surface-panel); border: 1px solid var(--border-default); border-radius: 6px; }
.game-view__progress { padding: 12px 16px; }
.game-view__panel { position: relative; padding: clamp(16px, 3vw, 28px); }
.game-view__meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 18px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
.game-view__counter strong { font-variant-numeric: tabular-nums; color: var(--neon); }
.game-view__streak { padding: 2px 8px; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; color: var(--neon); background: transparent; border: 1px solid var(--neon); border-radius: 4px; }
.game-view__feedback { display: flex; flex-direction: column; gap: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-default); }
.game-view__actions { display: flex; justify-content: flex-end; }
.game-view__continue { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-width: 170px; padding: 12px 20px; box-sizing: border-box; font: inherit; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0d0e15; cursor: pointer; background: var(--neon); border: 1px solid var(--neon); border-radius: 4px; transition: background-color 150ms ease, border-color 150ms ease; }
.game-view__continue:hover { background: #33f3ff; border-color: #33f3ff; }
.game-view__continue:focus-visible { outline: 2px solid var(--neon); outline-offset: 2px; }
.game-view__continue-icon { width: 16px; height: 16px; }
.game-view__unsupported { margin: 0; padding: 16px; font-size: 0.9rem; color: var(--muted); background: var(--surface); border: 1px solid var(--border-default); border-radius: 4px; }
.game-view__empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: clamp(32px, 6vw, 64px) 20px; text-align: center; }
.game-view__empty-icon { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; font-size: 1.2rem; color: var(--neon); background: transparent; border: 1px solid var(--neon); border-radius: 4px; }
.game-view__empty-title { margin: 4px 0 0; font-size: clamp(1.1rem, 2.2vw, 1.4rem); font-weight: 700; color: var(--text); }
.game-view__empty-text { max-width: 36ch; margin: 0 0 6px; font-size: 0.9rem; line-height: 1.5; color: var(--muted); }
.question-enter-active, .question-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.question-enter-from { opacity: 0; transform: translateY(4px); }
.question-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: 600px) {
  .game-view { padding: 12px 10px 20px; }
  .game-view__shell { gap: 10px; }
  .game-view__progress, .game-view__panel { border-radius: 4px; }
  .game-view__progress { padding: 10px 14px; }
  .game-view__actions { justify-content: stretch; }
  .game-view__continue { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .game-view__continue, .question-enter-active, .question-leave-active { transition: none; }
}
</style>