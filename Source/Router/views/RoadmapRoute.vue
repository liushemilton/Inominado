<script setup>
import { useRouter } from 'vue-router'

import { LEVELS } from '../../Data/Levels/index.js'
import RoadmapView from '../../Views/RoadmapView.vue'
import { ROUTE_NAMES } from '../names.js'
import { clearGameSession } from '../session.js'

const router = useRouter()

/**
 * O `RoadmapView` emite o nível e a fase escolhidos; a navegação acontece
 * por rota, abrindo a trilha de subtópicos do módulo.
 *
 * @param {{ level?: object, phase?: object }} payload
 * @returns {void}
 */
function handlePlay(payload = {}) {
  const levelId = payload.level?.id
  const phaseId = payload.phase?.id

  if (!levelId || !phaseId) return

  router.push({
    name: ROUTE_NAMES.trail,
    params: { levelId, phaseId },
  })
}

function handleResetProgress() {
  clearGameSession()
}
</script>

<template>
  <RoadmapView
    :levels="LEVELS"
    @play="handlePlay"
    @reset-progress="handleResetProgress"
  />
</template>
