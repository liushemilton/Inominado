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
  --neon: #00f0ff;
  --surface: #0d0e15;
  --border-default: #1a1c29;
  --text: #eafcff;

  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  padding: clamp(16px, 3vw, 36px) clamp(12px, 2vw, 24px);
  box-sizing: border-box;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: var(--text);
  background: #08080c;
}

.explanation-route > :deep(.explanation-view) {
  width: 100%;
  max-width: 720px;
  padding: clamp(16px, 3vw, 28px);
  box-sizing: border-box;
  background: #10121a;
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

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
