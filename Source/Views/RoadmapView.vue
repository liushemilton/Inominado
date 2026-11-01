<script setup>
import { computed, watch } from 'vue'

import ProgressBar from '../Components/Common/ProgressBar.vue'
import { useProgress } from '../Composables/useProgress.js'

const props = defineProps({
  levels: { type: Array, default: () => [] },
  title: { type: String, default: 'Roadmap' },
  subtitle: {
    type: String,
    default: 'Acompanhe seu avanço e continue de onde parou.',
  },
  allowReset: { type: Boolean, default: true },
})

const emit = defineEmits(['play', 'reset-progress'])

const progressStore = useProgress({ levels: props.levels })

const {
  getLevelProgress,
  getPhaseProgress,
  getLevelStatus,
  getPhaseStatus,
  getOverallStats,
  resetProgress,
} = progressStore

const STATUS_LABELS = Object.freeze({
  locked: 'Bloqueado',
  available: 'Disponível',
  'in-progress': 'Em andamento',
  completed: 'Concluído',
})

const overall = computed(() => getOverallStats(props.levels))

const levelsWithProgress = computed(() => {
  return props.levels.map((level, index) => {
    const levelProgress = getLevelProgress(level.id)
    const phases = toPhaseArray(level.phases).map((phase) => {
      const questions = Array.isArray(phase.questions) ? phase.questions : []

      return {
        ...phase,
        progress: getPhaseProgress(level.id, phase.id),
        status: getPhaseStatus(level.id, phase.id, level),
        questionCount: questions.length,
      }
    })

    return {
      ...level,
      number: index + 1,
      phases,
      progress: levelProgress,
      status: getLevelStatus(level.id),
    }
  })
})

const lastPlayedLabel = computed(() => {
  const lastPlayed = progressStore.lastPlayed.value

  if (!lastPlayed) return ''

  const level = props.levels.find(
    (item) => String(item?.id) === String(lastPlayed.levelId),
  )

  if (!level) return ''

  const phase = toPhaseArray(level.phases).find(
    (item) => String(item?.id) === String(lastPlayed.phaseId),
  )

  return phase ? `${level.title} · ${phase.title}` : level.title
})

watch(
  () => props.levels,
  (nextLevels) => progressStore.configureLevels(nextLevels),
  { deep: true },
)

/**
 * Aceita tanto array quanto objeto indexado por id.
 *
 * @param {unknown} phases
 * @returns {object[]}
 */
function toPhaseArray(phases) {
  if (Array.isArray(phases)) return phases.filter(Boolean)
  if (!phases || typeof phases !== 'object') return []

  return Object.entries(phases).map(([id, phase]) => ({
    ...phase,
    id: phase?.id ?? id,
  }))
}

function statusLabel(status) {
  return STATUS_LABELS[status] ?? status
}

function formatScore(value) {
  const number = Number(value)

  return Number.isFinite(number) ? number.toLocaleString('pt-BR') : '0'
}

function playLabel(status) {
  if (status === 'completed') return 'Rejogar'
  if (status === 'in-progress') return 'Continuar'

  return 'Iniciar'
}

function handlePlayPhase(level, phase) {
  if (phase.status === 'locked') return

  emit('play', { level, phase })
}

function handlePlayLevel(level) {
  if (level.status === 'locked') return

  if (level.phases.length === 0) {
    const questions = Array.isArray(level.questions) ? level.questions : []

    emit('play', {
      level,
      phase: {
        id: `${level.id}-fase-unica`,
        title: level.title,
        questions,
      },
    })

    return
  }

  const nextPhase =
    level.phases.find(
      (phase) => phase.status === 'in-progress' || phase.status === 'available',
    ) ?? level.phases.find((phase) => phase.status !== 'locked')

  if (nextPhase) handlePlayPhase(level, nextPhase)
}

function handleReset() {
  if (!props.allowReset) return

  const confirmFn = globalThis.confirm

  if (
    typeof confirmFn === 'function' &&
    !confirmFn('Deseja apagar todo o progresso salvo?')
  ) {
    return
  }

  resetProgress()
  emit('reset-progress')
}
</script>

<template>
  <main class="roadmap">
    <div class="roadmap__shell">
      <header class="roadmap__header">
        <div class="roadmap__heading">
          <span class="roadmap__eyebrow">Sua jornada</span>
          <h1 class="roadmap__title">{{ title }}</h1>
          <p class="roadmap__subtitle">{{ subtitle }}</p>
        </div>

        <button
          v-if="allowReset && overall.completedUnits > 0"
          type="button"
          class="roadmap__reset"
          @click="handleReset"
        >
          Reiniciar progresso
        </button>
      </header>

      <section class="roadmap__overview" aria-label="Progresso geral">
        <ProgressBar
          :value="overall.percent"
          :max="100"
          label="Progresso geral"
          show-value
        />

        <div class="roadmap__overview-meta">
          <span>
            {{ overall.completedLevels }} de {{ overall.totalLevels }}
            {{ overall.totalLevels === 1 ? 'nível' : 'níveis' }}
          </span>

          <span v-if="overall.totalPhases > 0">
            {{ overall.completedPhases }} de {{ overall.totalPhases }}
            {{ overall.totalPhases === 1 ? 'fase' : 'fases' }}
          </span>

          <span v-if="lastPlayedLabel" class="roadmap__last-played">
            Último acesso: {{ lastPlayedLabel }}
          </span>
        </div>
      </section>

      <section v-if="levelsWithProgress.length" class="roadmap__levels">
        <article
          v-for="level in levelsWithProgress"
          :key="level.id"
          class="roadmap__level"
          :class="`is-${level.status}`"
        >
          <header class="roadmap__level-header">
            <span class="roadmap__level-number">
              {{ String(level.number).padStart(2, '0') }}
            </span>

            <div class="roadmap__level-copy">
              <h2 class="roadmap__level-title">{{ level.title }}</h2>
              <p v-if="level.description" class="roadmap__level-description">
                {{ level.description }}
              </p>
            </div>

            <span class="roadmap__status" :class="`is-${level.status}`">
              {{ statusLabel(level.status) }}
            </span>
          </header>

          <div class="roadmap__level-meta">
            <span v-if="level.progress.totalPhases > 0">
              {{ level.progress.completedPhases }}/{{ level.progress.totalPhases }}
              fases concluídas
            </span>

            <span v-if="level.progress.bestScore > 0">
              Melhor pontuação: {{ formatScore(level.progress.bestScore) }}
            </span>

            <span v-if="level.progress.attempts > 0">
              {{ level.progress.attempts }}
              {{ level.progress.attempts === 1 ? 'tentativa' : 'tentativas' }}
            </span>
          </div>

          <ol v-if="level.phases.length" class="roadmap__phases">
            <li
              v-for="(phase, phaseIndex) in level.phases"
              :key="phase.id"
              class="roadmap__phase"
              :class="`is-${phase.status}`"
            >
              <span class="roadmap__phase-marker" aria-hidden="true">
                {{ phase.progress.completed ? '✓' : phaseIndex + 1 }}
              </span>

              <div class="roadmap__phase-copy">
                <h3 class="roadmap__phase-title">{{ phase.title }}</h3>
                <p v-if="phase.description" class="roadmap__phase-description">
                  {{ phase.description }}
                </p>

                <div class="roadmap__phase-meta">
                  <span>
                    {{ phase.questionCount }}
                    {{ phase.questionCount === 1 ? 'exercício' : 'exercícios' }}
                  </span>

                  <span v-if="phase.progress.accuracy > 0">
                    Precisão: {{ Math.round(phase.progress.accuracy) }}%
                  </span>

                  <span v-if="phase.progress.bestScore > 0">
                    Melhor: {{ formatScore(phase.progress.bestScore) }} pts
                  </span>
                </div>
              </div>

              <button
                type="button"
                class="roadmap__phase-action"
                :disabled="phase.status === 'locked'"
                @click="handlePlayPhase(level, phase)"
              >
                {{ phase.status === 'locked' ? 'Bloqueado' : playLabel(phase.status) }}
              </button>
            </li>
          </ol>

          <footer class="roadmap__level-footer">
            <button
              type="button"
              class="roadmap__play"
              :disabled="level.status === 'locked'"
              @click="handlePlayLevel(level)"
            >
              {{ level.status === 'completed' ? 'Rejogar nível' : playLabel(level.status) }}
            </button>
          </footer>
        </article>
      </section>

      <section v-else class="roadmap__empty">
        <span class="roadmap__empty-icon" aria-hidden="true">✦</span>
        <h2 class="roadmap__empty-title">Nenhum nível disponível</h2>
        <p class="roadmap__empty-text">
          Assim que um nível for cadastrado, ele aparecerá aqui com o seu
          progresso.
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
:global(html),
:global(body),
:global(#app) {
  min-height: 100%;
}

:global(body) {
  margin: 0;
  background: #08080c;
}

.roadmap {
  --neon: #00f0ff;
  --surface: #0d0e15;
  --surface-panel: #10121a;
  --border-default: #1a1c29;
  --text: #eafcff;
  --muted: #8a99ad;
  --success: #2bffc6;
  --danger: #ff3b30;

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

.roadmap__shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 860px;
}

.roadmap__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.roadmap__heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.roadmap__eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--neon);
}

.roadmap__title {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  line-height: 1.15;
}

.roadmap__subtitle {
  max-width: 54ch;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--muted);
}

.roadmap__reset {
  padding: 9px 14px;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  transition: color 150ms ease, border-color 150ms ease;
}

.roadmap__reset:hover {
  color: var(--danger);
  border-color: var(--danger);
}

.roadmap__overview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  background: var(--surface-panel);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.roadmap__overview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 0.75rem;
  color: var(--muted);
}

.roadmap__last-played {
  margin-left: auto;
  color: var(--neon);
}

.roadmap__levels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.roadmap__level {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: clamp(16px, 3vw, 24px);
  background: var(--surface-panel);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.roadmap__level.is-locked {
  opacity: 0.6;
}

.roadmap__level.is-completed {
  border-color: rgb(43 255 198 / 35%);
}

.roadmap__level-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.roadmap__level-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--neon);
  border: 1px solid var(--neon);
  border-radius: 4px;
}

.roadmap__level-copy {
  flex: 1 1 auto;
  min-width: 0;
}

.roadmap__level-title {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.3;
}

.roadmap__level-description {
  margin: 4px 0 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--muted);
}

.roadmap__status {
  flex: 0 0 auto;
  padding: 3px 8px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  border: 1px solid var(--border-default);
  border-radius: 4px;
}

.roadmap__status.is-completed {
  color: var(--success);
  border-color: rgb(43 255 198 / 45%);
}

.roadmap__status.is-in-progress {
  color: var(--neon);
  border-color: rgb(0 240 255 / 45%);
}

.roadmap__status.is-locked {
  color: var(--muted);
}

.roadmap__level-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding-top: 12px;
  font-size: 0.72rem;
  color: var(--muted);
  border-top: 1px solid var(--border-default);
}

.roadmap__phases {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.roadmap__phase {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-radius: 4px;
}

.roadmap__phase.is-locked {
  opacity: 0.55;
}

.roadmap__phase.is-completed {
  border-color: rgb(43 255 198 / 25%);
}

.roadmap__phase-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted);
  border: 1px solid var(--border-default);
  border-radius: 50%;
}

.roadmap__phase.is-completed .roadmap__phase-marker {
  color: #0d0e15;
  background: var(--success);
  border-color: var(--success);
}

.roadmap__phase-copy {
  flex: 1 1 auto;
  min-width: 0;
}

.roadmap__phase-title {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.35;
}

.roadmap__phase-description {
  margin: 3px 0 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--muted);
}

.roadmap__phase-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 6px;
  font-size: 0.68rem;
  color: var(--muted);
}

.roadmap__phase-action {
  flex: 0 0 auto;
  padding: 8px 12px;
  font: inherit;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--neon);
  cursor: pointer;
  background: transparent;
  border: 1px solid rgb(0 240 255 / 45%);
  border-radius: 4px;
  transition: background-color 150ms ease;
}

.roadmap__phase-action:hover:not(:disabled) {
  background: rgb(0 240 255 / 10%);
}

.roadmap__phase-action:disabled {
  color: var(--muted);
  cursor: not-allowed;
  border-color: var(--border-default);
}

.roadmap__level-footer {
  display: flex;
  justify-content: flex-end;
}

.roadmap__play {
  min-width: 150px;
  padding: 10px 18px;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0d0e15;
  cursor: pointer;
  background: var(--neon);
  border: 1px solid var(--neon);
  border-radius: 4px;
  transition: background-color 150ms ease, border-color 150ms ease;
}

.roadmap__play:hover:not(:disabled) {
  background: #33f3ff;
  border-color: #33f3ff;
}

.roadmap__play:disabled {
  color: var(--muted);
  cursor: not-allowed;
  background: transparent;
  border-color: var(--border-default);
}

.roadmap__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: clamp(32px, 6vw, 64px) 20px;
  text-align: center;
  background: var(--surface-panel);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.roadmap__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  font-size: 1.1rem;
  color: var(--neon);
  border: 1px solid var(--neon);
  border-radius: 4px;
}

.roadmap__empty-title {
  margin: 4px 0 0;
  font-size: 1.15rem;
}

.roadmap__empty-text {
  max-width: 40ch;
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--muted);
}

.roadmap__reset:focus-visible,
.roadmap__phase-action:focus-visible,
.roadmap__play:focus-visible {
  outline: 2px solid var(--neon);
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .roadmap__level-header,
  .roadmap__phase {
    flex-wrap: wrap;
  }

  .roadmap__status {
    margin-left: 54px;
  }

  .roadmap__phase-action,
  .roadmap__play {
    width: 100%;
  }

  .roadmap__level-footer {
    justify-content: stretch;
  }

  .roadmap__last-played {
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roadmap__reset,
  .roadmap__phase-action,
  .roadmap__play {
    transition: none;
  }
}
</style>
