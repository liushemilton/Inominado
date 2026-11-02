<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAdaptiveLearning } from '../../Composables/useAdaptiveLearning.js'
import { useProgress } from '../../Composables/useProgress.js'
import { DEFAULT_LIVES, LEVELS, resolvePhase } from '../../Data/Levels/index.js'
import GameView from '../../Views/GameView.vue'
import { ROUTE_NAMES } from '../names.js'
import { setLastAnswer, setLastResult } from '../session.js'

const props = defineProps({
  levelId: { type: String, required: true },
  phaseId: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()
const progressStore = useProgress({ levels: LEVELS })
const { completePhase, completeLevel, getPhaseProgress } = progressStore
const adaptive = useAdaptiveLearning({
  levels: LEVELS,
  progressStore,
})

const session = computed(() => resolvePhase(props.levelId, props.phaseId))

const subtopicId = computed(() => {
  const value = route.query.subtopico

  return typeof value === 'string' ? value : ''
})

// A sessão é montada uma única vez por rota/subtópico. Se dependesse do
// progresso reativo, cada resposta recriaria as questões e reiniciaria a
// partida no `GameView`.
const sessionQuestions = ref([])
const adaptiveSession = ref(null)

function loadSession() {
  const current = session.value

  if (!current) {
    sessionQuestions.value = []
    adaptiveSession.value = null
    return
  }

  const built = adaptive.buildSession({
    levelId: current.level.id,
    phaseId: current.phase.id,
    subtopicId: subtopicId.value || undefined,
  })

  adaptiveSession.value = built
  sessionQuestions.value = built.questions
}

watch(
  () => [props.levelId, props.phaseId, route.query.subtopico],
  loadSession,
  { immediate: true },
)

/**
 * Persiste o resultado da fase e, quando todas as fases estiverem
 * concluídas, marca o nível inteiro como concluído.
 *
 * @param {object} payload Resultado emitido pelo `GameView`.
 * @returns {object | null} Resultado com os IDs da rota, pronto para a sessão.
 */
function persistResult(payload = {}) {
  const current = session.value

  if (!current) return null

  const { level, phase } = current
  const summary = payload.summary ?? {}
  const totalQuestions =
    Number(payload.totalQuestions ?? summary.totalQuestions) ||
    sessionQuestions.value.length
  const answeredCount = Array.isArray(payload.answers)
    ? payload.answers.length
    : 0
  const completed = totalQuestions > 0 && answeredCount >= totalQuestions
  const adaptiveState = adaptive.getSessionState()
  const stats = {
    ...payload,
    completed,
    score: payload.score ?? summary.total,
    totalQuestions,
    correctCount: payload.correctCount ?? summary.correctAnswers,
    wrongCount: payload.wrongCount,
    accuracy: summary.accuracyPercent,
    difficulty: adaptiveState.difficulty,
    subtopicId: adaptiveSession.value?.subtopicId ?? '',
  }

  completePhase(level.id, phase.id, stats)

  if (completed) {
    const phases = Array.isArray(level.phases) ? level.phases : []
    const allPhasesCompleted =
      phases.length === 0 ||
      phases.every((item) => getPhaseProgress(level.id, item.id).completed)

    if (allPhasesCompleted) {
      completeLevel(level.id, {
        ...stats,
        phaseId: phase.id,
        completed: true,
      })
    }
  }

  return { payload, levelId: level.id, phaseId: phase.id }
}

function handleFinished(payload) {
  const stored = persistResult(payload)

  if (stored) setLastResult(stored)

  router.push({
    name: ROUTE_NAMES.result,
    params: { levelId: props.levelId, phaseId: props.phaseId },
    query: subtopicId.value ? { subtopico: subtopicId.value } : undefined,
  })
}

function handleExit() {
  router.push({ name: ROUTE_NAMES.roadmap })
}

/**
 * Registra a tentativa no progresso adaptativo e mantém a última resposta
 * disponível para a rota de explicação.
 *
 * @param {object} payload
 * @returns {void}
 */
function handleAnswered(payload = {}) {
  const feedback = payload.feedback ?? {}
  const question = payload.question ?? null
  const subtopic = adaptiveSession.value?.subtopicId ?? ''

  if (question) {
    adaptive.recordAttempt({
      levelId: props.levelId,
      phaseId: props.phaseId,
      subtopicId: subtopic || undefined,
      question,
      userAnswer: feedback.userAnswer,
      isCorrect: feedback.isCorrect,
      at: Date.now(),
      difficulty: question.difficulty ?? question.dificuldade,
      expectedQuestionCount: sessionQuestions.value.length,
    })
  }

  setLastAnswer({
    ...payload,
    levelId: props.levelId,
    phaseId: props.phaseId,
    subtopicId: subtopic,
    difficulty: adaptive.getSessionState().difficulty,
  })
}
</script>

<template>
  <GameView
    v-if="session"
    :questions="sessionQuestions"
    :lives="DEFAULT_LIVES"
    @exit="handleExit"
    @finished="handleFinished"
    @answered="handleAnswered"
  />

  <main v-else class="route-fallback">
    <p>Nível ou fase não encontrados.</p>
    <RouterLink :to="{ name: ROUTE_NAMES.roadmap }">Voltar ao roadmap</RouterLink>
  </main>
</template>

<style scoped>
.route-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 100vh;
  margin: 0;
  padding: var(--page-padding);
  font-family: var(--font-sans);
  text-align: center;
  color: var(--color-ink);
  background: var(--color-bg);
}

.route-fallback p {
  margin: 0;
  font-size: 0.96rem;
  color: var(--color-ink-muted);
}

.route-fallback a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-primary-ink);
  text-decoration: none;
  background: var(--color-primary);
  border: 2px solid var(--color-primary-border);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.route-fallback a:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-active);
  transform: translateY(-1px);
}

.route-fallback a:active {
  background: var(--color-primary-active);
  transform: translateY(1px);
}

.route-fallback a:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .route-fallback a {
    transition: none;
  }
}
</style>
