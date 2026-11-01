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
  gap: 12px;
  min-height: 100vh;
  margin: 0;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: #eafcff;
  background: #08080c;
}

.route-fallback a {
  color: #00f0ff;
}
</style>
