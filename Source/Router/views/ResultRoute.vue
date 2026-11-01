<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import ResultView from '../../Views/ResultView.vue'
import { ROUTE_NAMES } from '../names.js'
import { clearGameSession, lastResult, sameId } from '../session.js'

const props = defineProps({
  levelId: { type: String, required: true },
  phaseId: { type: String, required: true },
})

const router = useRouter()

const storedResult = computed(() => {
  const stored = lastResult.value

  if (
    stored &&
    sameId(stored.levelId, props.levelId) &&
    sameId(stored.phaseId, props.phaseId)
  ) {
    return stored
  }

  return null
})

const result = computed(() => storedResult.value?.payload ?? {})

function handleRoadmap() {
  router.push({ name: ROUTE_NAMES.roadmap })
}

function handleRestart() {
  clearGameSession()

  router.push({
    name: ROUTE_NAMES.game,
    params: { levelId: props.levelId, phaseId: props.phaseId },
  })
}
</script>

<template>
  <ResultView
    v-if="storedResult"
    :result="result"
    @restart="handleRestart"
    @roadmap="handleRoadmap"
  />

  <main v-else class="route-fallback">
    <p>Nenhum resultado disponível para esta fase.</p>
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
