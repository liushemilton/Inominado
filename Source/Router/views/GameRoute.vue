<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useProgress } from '../../Composables/useProgress.js'
import { DEFAULT_LIVES, LEVELS, resolvePhase } from '../../Data/Levels/index.js'
import GameView from '../../Views/GameView.vue'
import { ROUTE_NAMES } from '../names.js'
import { setLastAnswer, setLastResult } from '../session.js'

const props = defineProps({
  levelId: { type: String, required: true },
  phaseId: { type: String, required: true },
})

const router = useRouter()
const { completePhase, completeLevel, getPhaseProgress } = useProgress({
  levels: LEVELS,
})

const session = computed(() => resolvePhase(props.levelId, props.phaseId))

const questions = computed(() => {
  const phaseQuestions = session.value?.phase?.questions

  if (Array.isArray(phaseQuestions)) return phaseQuestions

  const levelQuestions = session.value?.level?.questions

  return Array.isArray(levelQuestions) ? levelQuestions : []
})

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
    questions.value.length
  const answeredCount = Array.isArray(payload.answers)
    ? payload.answers.length
    : 0
  const completed = totalQuestions > 0 && answeredCount >= totalQuestions
  const stats = {
    ...payload,
    completed,
    score: payload.score ?? summary.total,
    totalQuestions,
    correctCount: payload.correctCount ?? summary.correctAnswers,
    wrongCount: payload.wrongCount,
    accuracy: summary.accuracyPercent,
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
  })
}

function handleExit() {
  router.push({ name: ROUTE_NAMES.roadmap })
}

/**
 * Mantém a última resposta disponível para a rota de explicação.
 *
 * @param {object} answer
 * @returns {void}
 */
function handleAnswered(answer = {}) {
  setLastAnswer({
    ...answer,
    levelId: props.levelId,
    phaseId: props.phaseId,
  })
}
</script>

<template>
  <GameView
    v-if="session"
    :questions="questions"
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
