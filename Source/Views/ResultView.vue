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
        <span class="result-view__eyebrow">Partida concluída</span>
        <h1 class="result-view__title">{{ headline }}</h1>
        <p class="result-view__subtitle">
          Você respondeu {{ answeredCount }} de {{ totalQuestions }}
          {{ totalQuestions === 1 ? 'questão' : 'questões' }}.
        </p>
      </header>

      <div class="result-view__score">
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
          Ver roadmap
        </button>

        <button
          type="button"
          class="result-view__restart"
          @click="emit('restart')"
        >
          Jogar de novo
        </button>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.result-view {
  --neon: #00f0ff;
  --surface: #0d0e15;
  --surface-panel: #10121a;
  --border-default: #1a1c29;
  --text: #eafcff;
  --muted: #8a99ad;

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

.result-view__card {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 720px;
  padding: clamp(20px, 4vw, 36px);
  box-sizing: border-box;
  background: var(--surface-panel);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.result-view__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.result-view__eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--neon);
}

.result-view__title {
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2.1rem);
  line-height: 1.2;
  color: var(--text);
}

.result-view__subtitle {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--muted);
}

.result-view__score {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.result-view__score-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.result-view__score-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: clamp(2rem, 6vw, 2.8rem);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--neon);
}

.result-view__score-meta {
  font-size: 0.85rem;
  color: var(--muted);
}

.result-view__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.result-view__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.result-view__stat dt {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.result-view__stat dd {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 1.1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.result-view__stat dd.is-correct {
  color: #2bffc6;
}

.result-view__stat dd.is-incorrect {
  color: #ff3b30;
}

.result-view__breakdown {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-view__breakdown-title {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.result-view__breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.result-view__breakdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-radius: 4px;
}

.result-view__breakdown-item strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-variant-numeric: tabular-nums;
  color: var(--neon);
}

.result-view__breakdown-item strong.is-negative {
  color: #ff3b30;
}

.result-view__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid var(--border-default);
}

.result-view__roadmap,
.result-view__restart {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 190px;
  padding: 12px 24px;
  box-sizing: border-box;
  font: inherit;
  font-size: 0.8rem;
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

.result-view__roadmap {
  color: var(--muted);
  background: transparent;
  border-color: var(--border-default);
}

.result-view__roadmap:hover {
  color: var(--text);
  background: transparent;
  border-color: var(--neon);
}

.result-view__restart:hover {
  background: #33f3ff;
  border-color: #33f3ff;
}

.result-view__roadmap:focus-visible,
.result-view__restart:focus-visible {
  outline: 2px solid var(--neon);
  outline-offset: 2px;
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
}
</style>
