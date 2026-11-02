<script setup>
import { RouterLink, useRouter } from 'vue-router'

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

  <RouterLink
    class="roadmap-route__test-link"
    :to="{ name: ROUTE_NAMES.testArea }"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M10 2v7.31L4.35 19.5a1 1 0 0 0 .86 1.5h13.58a1 1 0 0 0 .86-1.5L14 9.31V2h-4z" />
      <path d="M8 6h8" />
    </svg>
    Área de testes
  </RouterLink>
</template>

<style scoped>
.roadmap-route__test-link {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--color-ink-soft);
  text-decoration: none;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: color 160ms ease, background-color 160ms ease,
    border-color 160ms ease, transform 160ms ease;
}

.roadmap-route__test-link svg {
  width: 16px;
  height: 16px;
  color: var(--color-lilac-strong);
}

.roadmap-route__test-link:hover {
  color: var(--color-lilac-strong);
  background: var(--color-lilac-soft);
  border-color: var(--color-lilac);
  transform: translateY(-2px);
}

.roadmap-route__test-link:active {
  transform: translateY(0);
}

.roadmap-route__test-link:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

@media (max-width: 600px) {
  .roadmap-route__test-link {
    bottom: 14px;
    left: 14px;
    padding: 9px 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roadmap-route__test-link {
    transition: none;
  }

  .roadmap-route__test-link:hover {
    transform: none;
  }
}
</style>
