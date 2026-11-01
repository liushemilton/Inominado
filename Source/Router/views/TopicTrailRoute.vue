<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { resolvePhase } from '../../Data/Levels/index.js'
import TopicTrailView from '../../Views/TopicTrailView.vue'
import { ROUTE_NAMES } from '../names.js'

const props = defineProps({
  levelId: { type: String, required: true },
  phaseId: { type: String, required: true },
})

const router = useRouter()

const session = computed(() => resolvePhase(props.levelId, props.phaseId))

function handleBack() {
  router.push({ name: ROUTE_NAMES.roadmap })
}

/**
 * Cada subtópico é um nível da trilha. A seleção leva para a partida
 * da fase com o subtópico escolhido na URL, para as questões serem
 * filtradas quando forem cadastradas.
 *
 * @param {{ id?: string }} subtopic
 * @returns {void}
 */
function handleSelect(subtopic = {}) {
  if (!subtopic.id) return

  router.push({
    name: ROUTE_NAMES.game,
    params: { levelId: props.levelId, phaseId: props.phaseId },
    query: { subtopico: subtopic.id },
  })
}
</script>

<template>
  <TopicTrailView
    v-if="session"
    :level="session.level"
    :phase="session.phase"
    @back="handleBack"
    @select="handleSelect"
  />

  <main v-else class="route-fallback">
    <p>Nível ou fase não encontrados.</p>
    <RouterLink :to="{ name: ROUTE_NAMES.roadmap }">
      Voltar ao roadmap
    </RouterLink>
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
