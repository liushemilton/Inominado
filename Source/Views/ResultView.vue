<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['restart', 'roadmap'])

const summary = computed(() => props.result?.summary ?? {})

const totalScore = computed(() => {
  const value = Number(summary.value?.total)

  if (Number.isFinite(value)) return value

  return Number(props.result?.score) || 0
})

const totalQuestions = computed(() => {
  return Number(props.result?.totalQuestions ?? summary.value?.totalQuestions ?? 0)
})

const correctCount = computed(() => {
  return Number(summary.value?.correctAnswers ?? props.result?.correctCount ?? 0)
})

const wrongCount = computed(() => {
  const value = Number(props.result?.wrongCount)

  if (Number.isFinite(value)) return value

  return Math.max(0, totalQuestions.value - correctCount.value)
})

const answeredCount = computed(() => {
  if (Array.isArray(props.result?.answers)) return props.result.answers.length

  return correctCount.value + wrongCount.value
})

const accuracy = computed(() => {
  const value = Number(summary.value?.accuracyPercent)

  if (Number.isFinite(value)) return value
  if (totalQuestions.value === 0) return 0

  return Math.round((correctCount.value / totalQuestions.value) * 100)
})

const bestStreak = computed(() => {
  return Number(summary.value?.bestStreak ?? props.result?.bestStreak ?? 0)
})

const elapsedSeconds = computed(() => {
  return Math.max(0, Number(props.result?.elapsedSeconds) || 0)
})

const elapsedLabel = computed(() => {
  const seconds = Math.round(elapsedSeconds.value)
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
})

const headline = computed(() => {
  if (answeredCount.value === 0) return 'Nenhuma questão respondida'

  if (accuracy.value >= 80) return 'Excelente desempenho!'
  if (accuracy.value >= 50) return 'Bom trabalho!'

  return 'Continue praticando!'
})

const breakdown = computed(() => {
  const items = [
    { key: 'base', label: 'Pontos-base', value: summary.value.base },
    { key: 'combo', label: 'Bônus de combo', value: summary.value.combo },
    { key: 'time', label: 'Bônus de tempo', value: summary.value.timeBonus },
    {
      key: 'accuracy',
      label: 'Bônus de precisão',
      value: summary.value.accuracyBonus,
    },
  ]

  const penalty = Number(summary.value.penalty)

  if (Number.isFinite(penalty) && penalty > 0) {
    items.push({ key: 'penalty', label: 'Penalidades', value: -penalty })
  }

  return items.filter((item) => Number.isFinite(Number(item.value)))
})

function formatPoints(value) {
  const number = Number(value) || 0

  return number > 0 ? `+${number}` : String(number)
}
</script>

<template>
  <main class="result-view">
    <section class="result-view__card">
      <header class="result-view__header">
        <span class="result-view__eyebrow">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
            <path d="M7 6H4a3 3 0 0 0 3 3" />
            <path d="M17 6h3a3 3 0 0 1-3 3" />
          </svg>
          Partida concluída
        </span>
        <h1 class="result-view__title">{{ headline }}</h1>
        <p class="result-view__subtitle">
          Você respondeu {{ answeredCount }} de {{ totalQuestions }}
          {{ totalQuestions === 1 ? 'questão' : 'questões' }}.
        </p>
      </header>

      <div class="result-view__score">
        <span class="result-view__score-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v8" />
            <path d="M9.5 10h5" />
            <path d="M9.5 14h5" />
          </svg>
        </span>
        <span class="result-view__score-label">Pontuação final</span>
        <strong class="result-view__score-value">{{ totalScore }}</strong>
        <span class="result-view__score-meta">pontos</span>
      </div>

      <dl class="result-view__stats">
        <div class="result-view__stat">
          <dt>Acertos</dt>
          <dd class="is-correct">{{ correctCount }}</dd>
        </div>

        <div class="result-view__stat">
          <dt>Erros</dt>
          <dd class="is-incorrect">{{ wrongCount }}</dd>
        </div>

        <div class="result-view__stat">
          <dt>Precisão</dt>
          <dd>{{ accuracy }}%</dd>
        </div>

        <div class="result-view__stat">
          <dt>Melhor sequência</dt>
          <dd>{{ bestStreak }}</dd>
        </div>

        <div class="result-view__stat">
          <dt>Tempo</dt>
          <dd>{{ elapsedLabel }}</dd>
        </div>

        <div class="result-view__stat">
          <dt>Vidas restantes</dt>
          <dd>{{ props.result.lives ?? '—' }}</dd>
        </div>
      </dl>

      <div v-if="breakdown.length" class="result-view__breakdown">
        <h2 class="result-view__breakdown-title">Composição da pontuação</h2>

        <ul class="result-view__breakdown-list">
          <li
            v-for="item in breakdown"
            :key="item.key"
            class="result-view__breakdown-item"
          >
            <span>{{ item.label }}</span>
            <strong :class="{ 'is-negative': Number(item.value) < 0 }">
              {{ formatPoints(item.value) }}
            </strong>
          </li>
        </ul>
      </div>

      <footer class="result-view__footer">
        <button
          type="button"
          class="result-view__roadmap"
          @click="emit('roadmap')"
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
            <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
            <path d="M9 3v15" />
            <path d="M15 6v15" />
          </svg>
          Ver roadmap
        </button>

        <button
          type="button"
          class="result-view__restart"
          @click="emit('restart')"
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
          Jogar de novo
        </button>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.result-view {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  padding: var(--page-padding);
  color: var(--color-ink);
  background: var(--color-bg);
}

.result-view__card {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 760px;
  padding: clamp(22px, 4vw, 38px);
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
}

.result-view__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.result-view__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-mint-strong);
  background: var(--color-mint-soft);
  border: 2px solid var(--color-mint);
  border-radius: var(--radius-pill);
}

.result-view__eyebrow svg {
  width: 14px;
  height: 14px;
}

.result-view__title {
  margin: 0;
  font-size: clamp(1.55rem, 4vw, 2.2rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.result-view__subtitle {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--color-ink-muted);
}

.result-view__score {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  padding: 22px;
  background: var(--color-sun-soft);
  border: 3px solid var(--color-sun);
  border-radius: var(--radius-card);
}

.result-view__score-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--color-sun-strong);
  background: var(--color-surface);
  border: 2px solid var(--color-sun);
  border-radius: var(--radius-pill);
  align-self: center;
}

.result-view__score-icon svg {
  width: 22px;
  height: 22px;
}

.result-view__score-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-sun-ink);
}

.result-view__score-value {
  font-family: var(--font-mono);
  font-size: clamp(2.2rem, 6vw, 3rem);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--color-sun-strong);
}

.result-view__score-meta {
  font-size: 0.85rem;
  color: var(--color-sun-ink);
}

.result-view__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.result-view__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-card);
}

.result-view__stat dt {
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.result-view__stat dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink);
}

.result-view__stat dd.is-correct {
  color: var(--color-mint-strong);
}

.result-view__stat dd.is-incorrect {
  color: var(--color-coral-strong);
}

.result-view__breakdown {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-view__breakdown-title {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.result-view__breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.result-view__breakdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  font-size: 0.86rem;
  color: var(--color-ink-soft);
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-field);
}

.result-view__breakdown-item strong {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--color-cyan-strong);
}

.result-view__breakdown-item strong.is-negative {
  color: var(--color-coral-strong);
}

.result-view__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  padding-top: 22px;
  border-top: 2px solid var(--color-border-soft);
}

.result-view__roadmap,
.result-view__restart {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 190px;
  padding: 12px 24px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  border: 2px solid;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.result-view__roadmap svg,
.result-view__restart svg {
  width: 16px;
  height: 16px;
}

.result-view__roadmap {
  color: var(--color-ink-soft);
  background: var(--color-surface);
  border-color: var(--color-border);
}

.result-view__roadmap:hover {
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan);
  transform: translateY(-1px);
}

.result-view__roadmap:active {
  background: var(--color-cyan);
  transform: translateY(1px);
}

.result-view__restart {
  color: var(--color-primary-ink);
  background: var(--color-primary);
  border-color: var(--color-primary-border);
}

.result-view__restart:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-active);
  transform: translateY(-1px);
}

.result-view__restart:active {
  background: var(--color-primary-active);
  transform: translateY(1px);
}

.result-view__roadmap:focus-visible,
.result-view__restart:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

@media (max-width: 600px) {
  .result-view__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .result-view__roadmap,
  .result-view__restart {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .result-view__roadmap,
  .result-view__restart {
    transition: none;
  }

  .result-view__roadmap:hover,
  .result-view__restart:hover {
    transform: none;
  }
}
</style>
