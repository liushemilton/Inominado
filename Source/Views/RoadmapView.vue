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

const ELEMENTS = Object.freeze([
  { number: 1, symbol: 'H', name: 'Hidrogênio', tone: 'mint' },
  { number: 2, symbol: 'He', name: 'Hélio', tone: 'cyan' },
  { number: 3, symbol: 'Li', name: 'Lítio', tone: 'sun' },
  { number: 4, symbol: 'Be', name: 'Berílio', tone: 'coral' },
  { number: 5, symbol: 'B', name: 'Boro', tone: 'lilac' },
  { number: 6, symbol: 'C', name: 'Carbono', tone: 'mint' },
  { number: 7, symbol: 'N', name: 'Nitrogênio', tone: 'cyan' },
  { number: 8, symbol: 'O', name: 'Oxigênio', tone: 'sun' },
  { number: 9, symbol: 'F', name: 'Flúor', tone: 'coral' },
  { number: 10, symbol: 'Ne', name: 'Neônio', tone: 'lilac' },
  { number: 11, symbol: 'Na', name: 'Sódio', tone: 'mint' },
  { number: 12, symbol: 'Mg', name: 'Magnésio', tone: 'cyan' },
  { number: 13, symbol: 'Al', name: 'Alumínio', tone: 'sun' },
  { number: 14, symbol: 'Si', name: 'Silício', tone: 'coral' },
  { number: 15, symbol: 'P', name: 'Fósforo', tone: 'lilac' },
  { number: 16, symbol: 'S', name: 'Enxofre', tone: 'mint' },
  { number: 17, symbol: 'Cl', name: 'Cloro', tone: 'cyan' },
  { number: 18, symbol: 'Ar', name: 'Argônio', tone: 'sun' },
  { number: 19, symbol: 'K', name: 'Potássio', tone: 'coral' },
  { number: 20, symbol: 'Ca', name: 'Cálcio', tone: 'lilac' },
  { number: 26, symbol: 'Fe', name: 'Ferro', tone: 'mint' },
  { number: 29, symbol: 'Cu', name: 'Cobre', tone: 'cyan' },
  { number: 30, symbol: 'Zn', name: 'Zinco', tone: 'sun' },
  { number: 47, symbol: 'Ag', name: 'Prata', tone: 'coral' },
  { number: 79, symbol: 'Au', name: 'Ouro', tone: 'lilac' },
])

const LEVEL_TONES = Object.freeze(['mint', 'cyan', 'sun', 'coral', 'lilac'])

const overall = computed(() => getOverallStats(props.levels))

const levelsWithProgress = computed(() => {
  return props.levels.map((level, index) => {
    const levelProgress = getLevelProgress(level.id)
    const phases = toPhaseArray(level.phases).map((phase, phaseIndex) => {
      const questions = Array.isArray(phase.questions) ? phase.questions : []

      return {
        ...phase,
        progress: getPhaseProgress(level.id, phase.id),
        status: getPhaseStatus(level.id, phase.id, level),
        questionCount: questions.length,
        element: elementFor(phaseIndex),
      }
    })

    return {
      ...level,
      number: index + 1,
      tone: LEVEL_TONES[index % LEVEL_TONES.length],
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

function elementFor(index) {
  return ELEMENTS[index % ELEMENTS.length]
}

function statusLabel(status) {
  return STATUS_LABELS[status] ?? status
}

function formatScore(value) {
  const number = Number(value)

  return Number.isFinite(number) ? number.toLocaleString('pt-BR') : '0'
}

function playLabel(status) {
  if (status === 'completed') return 'Revisar trilha'
  if (status === 'in-progress') return 'Continuar'

  return 'Abrir trilha'
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
          <span class="roadmap__eyebrow">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M9 3h6" />
              <path d="M10 3v6.5L5.5 17a2.5 2.5 0 0 0 2.2 3.5h8.6a2.5 2.5 0 0 0 2.2-3.5L14 9.5V3" />
              <path d="M7.5 15h9" />
            </svg>
            Sua jornada
          </span>
          <h1 class="roadmap__title">{{ title }}</h1>
          <p class="roadmap__subtitle">{{ subtitle }}</p>
        </div>

        <button
          v-if="allowReset && overall.completedUnits > 0"
          type="button"
          class="roadmap__reset"
          @click="handleReset"
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
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
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
          :class="[`is-${level.status}`, `tone-${level.tone}`]"
        >
          <header class="roadmap__level-header">
            <span class="roadmap__level-number" aria-hidden="true">
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
              v-for="phase in level.phases"
              :key="phase.id"
              class="roadmap__phase"
              :class="[`is-${phase.status}`, `tone-${phase.element.tone}`]"
            >
              <div class="roadmap__phase-top">
                <span class="roadmap__atomic-number" aria-hidden="true">
                  {{ phase.element.number }}
                </span>
                <span class="roadmap__phase-status">
                  {{ statusLabel(phase.status) }}
                </span>
              </div>

              <div class="roadmap__element" aria-hidden="true">
                <span class="roadmap__element-symbol">
                  {{ phase.element.symbol }}
                </span>
                <span class="roadmap__element-name">
                  {{ phase.element.name }}
                </span>
              </div>

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
              {{ level.status === 'completed' ? 'Revisar nível' : playLabel(level.status) }}
            </button>
          </footer>
        </article>
      </section>

      <section v-else class="roadmap__empty">
        <span class="roadmap__empty-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 3h6" />
            <path d="M10 3v6.5L5.5 17a2.5 2.5 0 0 0 2.2 3.5h8.6a2.5 2.5 0 0 0 2.2-3.5L14 9.5V3" />
            <path d="M7.5 15h9" />
          </svg>
        </span>
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
.roadmap {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  padding: var(--page-padding);
  color: var(--color-ink);
  background: var(--color-bg);
}

.roadmap__shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: var(--content-width);
}

.roadmap__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.roadmap__heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.roadmap__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 12px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-mint-strong);
  background: var(--color-mint-soft);
  border: 2px solid var(--color-mint);
  border-radius: var(--radius-pill);
}

.roadmap__eyebrow svg {
  width: 14px;
  height: 14px;
}

.roadmap__title {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

.roadmap__subtitle {
  max-width: 56ch;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--color-ink-muted);
}

.roadmap__reset {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-coral-strong);
  cursor: pointer;
  background: var(--color-coral-soft);
  border: 2px solid var(--color-coral);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.roadmap__reset svg {
  width: 16px;
  height: 16px;
}

.roadmap__reset:hover {
  color: var(--color-coral-ink);
  background: var(--color-coral);
  border-color: var(--color-coral-strong);
  transform: translateY(-1px);
}

.roadmap__reset:active {
  color: var(--color-surface);
  background: var(--color-coral-strong);
  transform: translateY(1px);
}

.roadmap__overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  padding: 20px 22px;
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
}

.roadmap__overview-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--color-ink-muted);
}

.roadmap__overview-meta > span {
  padding: 5px 10px;
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-pill);
}

.roadmap__overview-meta > .roadmap__last-played {
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan);
}

.roadmap__levels {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.roadmap__level {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: clamp(20px, 3vw, 30px);
  overflow: hidden;
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
  transition: border-color 180ms ease, background-color 180ms ease;
}

.roadmap__level::before {
  position: absolute;
  inset: 0 0 auto;
  height: 8px;
  content: '';
  background: var(--tone, var(--color-cyan));
}

.roadmap__level.is-locked {
  background: var(--color-surface-soft);
  border-color: var(--color-border-soft);
}

.roadmap__level.is-completed {
  border-color: var(--tone, var(--color-mint));
}

.roadmap__level.is-in-progress {
  border-color: var(--color-cyan);
}

.roadmap__level.is-locked .roadmap__level-number {
  color: var(--color-ink-faint);
  background: var(--color-surface-soft);
  border-color: var(--color-border-soft);
}

.roadmap__level-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding-top: 6px;
}

.roadmap__level-number {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--tone-strong, var(--color-cyan-strong));
  background: var(--tone-soft, var(--color-cyan-soft));
  border: 2px solid var(--tone, var(--color-cyan));
  border-radius: 14px;
}

.roadmap__level-copy {
  flex: 1 1 auto;
  min-width: 0;
}

.roadmap__level-title {
  margin: 0;
  font-size: clamp(1.1rem, 2.2vw, 1.35rem);
  font-weight: 800;
  line-height: 1.3;
  color: var(--color-ink);
}

.roadmap__level-description {
  margin: 6px 0 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--color-ink-muted);
}

.roadmap__status {
  flex: 0 0 auto;
  padding: 6px 12px;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-pill);
}

.roadmap__status.is-completed {
  color: var(--color-mint-strong);
  background: var(--color-mint-soft);
  border-color: var(--color-mint);
}

.roadmap__status.is-in-progress {
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan);
}

.roadmap__status.is-available {
  color: var(--color-sun-strong);
  background: var(--color-sun-soft);
  border-color: var(--color-sun);
}

.roadmap__level-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding-top: 14px;
  font-size: 0.74rem;
  color: var(--color-ink-muted);
  border-top: 2px solid var(--color-border-soft);
}

.roadmap__phases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.roadmap__phase {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--color-surface-soft);
  border: 3px solid var(--color-border-soft);
  border-radius: var(--radius-card);
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
}

.roadmap__phase.is-available,
.roadmap__phase.is-in-progress {
  background: var(--color-surface);
  border-color: var(--tone, var(--color-cyan));
}

.roadmap__phase.is-completed {
  background: var(--tone-soft, var(--color-mint-soft));
  border-color: var(--tone, var(--color-mint));
}

.roadmap__phase.is-locked {
  background: var(--color-surface-soft);
  border-color: var(--color-border-soft);
}

.roadmap__phase.is-locked .roadmap__atomic-number {
  color: var(--color-ink-faint);
  background: var(--color-surface-soft);
  border-color: var(--color-border-soft);
}

.roadmap__phase.is-locked .roadmap__element {
  background: var(--color-surface);
  border-color: var(--color-border-soft);
}

.roadmap__phase.is-locked .roadmap__element-symbol {
  color: var(--color-ink-faint);
}

.roadmap__phase:hover {
  border-color: var(--tone, var(--color-cyan));
  transform: translateY(-2px);
}

.roadmap__phase.is-locked:hover {
  border-color: var(--color-border-soft);
  transform: none;
}

.roadmap__phase-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.roadmap__atomic-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 28px;
  padding: 0 8px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--tone-strong, var(--color-cyan-strong));
  background: var(--color-surface);
  border: 2px solid var(--tone, var(--color-cyan));
  border-radius: var(--radius-pill);
}

.roadmap__phase-status {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.roadmap__phase.is-completed .roadmap__phase-status {
  color: var(--tone-strong, var(--color-mint-strong));
}

.roadmap__phase.is-locked .roadmap__phase-status {
  color: var(--color-ink-faint);
}

.roadmap__element {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 12px 14px;
  background: var(--color-surface);
  border: 2px solid var(--tone, var(--color-border));
  border-radius: var(--radius-field);
}

.roadmap__element-symbol {
  font-family: var(--font-mono);
  font-size: 2.7rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--tone-strong, var(--color-cyan-strong));
}

.roadmap__element-name {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.roadmap__phase-copy {
  flex: 1 1 auto;
  min-width: 0;
}

.roadmap__phase-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.35;
  color: var(--color-ink);
}

.roadmap__phase-description {
  margin: 4px 0 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--color-ink-muted);
}

.roadmap__phase-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 8px;
  font-size: 0.7rem;
  color: var(--color-ink-muted);
}

.roadmap__phase-action {
  width: 100%;
  padding: 11px 18px;
  margin-top: auto;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--color-primary-ink);
  cursor: pointer;
  background: var(--color-primary);
  border: 2px solid var(--color-primary-border);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.roadmap__phase-action:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-active);
  transform: translateY(-1px);
}

.roadmap__phase-action:active:not(:disabled) {
  background: var(--color-primary-active);
  transform: translateY(1px);
}

.roadmap__phase-action:disabled {
  color: var(--color-ink-faint);
  cursor: not-allowed;
  background: var(--color-surface-soft);
  border-color: var(--color-border-soft);
}

.roadmap__level-footer {
  display: flex;
  justify-content: flex-end;
}

.roadmap__play {
  min-width: 180px;
  padding: 12px 22px;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--color-primary-ink);
  cursor: pointer;
  background: var(--color-primary);
  border: 2px solid var(--color-primary-border);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.roadmap__play:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-active);
  transform: translateY(-1px);
}

.roadmap__play:active:not(:disabled) {
  background: var(--color-primary-active);
  transform: translateY(1px);
}

.roadmap__play:disabled {
  color: var(--color-ink-faint);
  cursor: not-allowed;
  background: var(--color-surface-soft);
  border-color: var(--color-border-soft);
}

.roadmap__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: clamp(36px, 6vw, 68px) 20px;
  text-align: center;
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
}

.roadmap__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border: 2px solid var(--color-cyan);
  border-radius: var(--radius-card);
}

.roadmap__empty-icon svg {
  width: 28px;
  height: 28px;
}

.roadmap__empty-title {
  margin: 4px 0 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-ink);
}

.roadmap__empty-text {
  max-width: 42ch;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-ink-muted);
}

.tone-mint {
  --tone: var(--color-mint);
  --tone-soft: var(--color-mint-soft);
  --tone-strong: var(--color-mint-strong);
  --tone-ink: var(--color-mint-ink);
}

.tone-cyan {
  --tone: var(--color-cyan);
  --tone-soft: var(--color-cyan-soft);
  --tone-strong: var(--color-cyan-strong);
  --tone-ink: var(--color-cyan-ink);
}

.tone-sun {
  --tone: var(--color-sun);
  --tone-soft: var(--color-sun-soft);
  --tone-strong: var(--color-sun-strong);
  --tone-ink: var(--color-sun-ink);
}

.tone-coral {
  --tone: var(--color-coral);
  --tone-soft: var(--color-coral-soft);
  --tone-strong: var(--color-coral-strong);
  --tone-ink: var(--color-coral-ink);
}

.tone-lilac {
  --tone: var(--color-lilac);
  --tone-soft: var(--color-lilac-soft);
  --tone-strong: var(--color-lilac-strong);
  --tone-ink: var(--color-lilac-ink);
}

.roadmap__reset:focus-visible,
.roadmap__phase-action:focus-visible,
.roadmap__play:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .roadmap__overview {
    grid-template-columns: 1fr;
  }

  .roadmap__overview-meta {
    justify-content: flex-start;
  }
}

@media (max-width: 600px) {
  .roadmap__level-header {
    flex-wrap: wrap;
  }

  .roadmap__status {
    margin-left: 72px;
  }

  .roadmap__phase-action,
  .roadmap__play {
    width: 100%;
  }

  .roadmap__level-footer {
    justify-content: stretch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roadmap__reset,
  .roadmap__phase,
  .roadmap__phase-action,
  .roadmap__play {
    transition: none;
  }

  .roadmap__reset:hover,
  .roadmap__phase:hover,
  .roadmap__phase-action:hover:not(:disabled),
  .roadmap__play:hover:not(:disabled) {
    transform: none;
  }
}
</style>
