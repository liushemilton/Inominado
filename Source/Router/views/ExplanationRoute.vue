<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import ExplanationView from '../../Views/ExplanationView.vue'
import { ROUTE_NAMES } from '../names.js'
import { lastAnswer, lastResult, sameId } from '../session.js'

const props = defineProps({
  levelId: { type: String, required: true },
  phaseId: { type: String, required: true },
  questionIndex: { type: Number, required: true },
})

const router = useRouter()

const storedAnswer = computed(() => {
  const stored = lastAnswer.value

  if (
    stored &&
    sameId(stored.levelId, props.levelId) &&
    sameId(stored.phaseId, props.phaseId) &&
    Number(stored.questionIndex) === props.questionIndex
  ) {
    return stored
  }

  return null
})

const hasResult = computed(() => {
  const stored = lastResult.value

  return Boolean(
    stored &&
      sameId(stored.levelId, props.levelId) &&
      sameId(stored.phaseId, props.phaseId),
  )
})

const isFinal = computed(() => Boolean(storedAnswer.value?.isFinal && hasResult.value))

function handleContinue() {
  if (isFinal.value) {
    router.push({
      name: ROUTE_NAMES.result,
      params: { levelId: props.levelId, phaseId: props.phaseId },
    })
    return
  }

  router.push({
    name: ROUTE_NAMES.game,
    params: { levelId: props.levelId, phaseId: props.phaseId },
  })
}
</script>

<template>
  <main v-if="storedAnswer" class="explanation-route">
    <ExplanationView
      :feedback="storedAnswer.feedback"
      :question="storedAnswer.question"
      :is-final="isFinal"
      :score="storedAnswer.score"
      :lives="storedAnswer.lives"
      @continue="handleContinue"
    />
  </main>

  <main v-else class="route-fallback">
    <p>Nenhuma explicação disponível para esta questão.</p>
    <RouterLink :to="{ name: ROUTE_NAMES.roadmap }">Voltar ao roadmap</RouterLink>
  </main>
</template>

<style scoped>
.explanation-route {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  padding: var(--page-padding);
  color: var(--color-ink);
  background: var(--color-bg);
}

.explanation-route > :deep(.explanation-view) {
  width: 100%;
  max-width: 760px;
  padding: clamp(22px, 4vw, 36px);
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
}

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
