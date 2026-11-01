<script setup>
import { computed, onMounted, ref } from 'vue'

import FeedbackBox from '../Components/Game/FeedbackBox.vue'

const props = defineProps({
  feedback: { type: Object, default: () => ({}) },
  question: { type: Object, default: () => ({}) },
  isFinal: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  lives: { type: Number, default: 0 },
})

const emit = defineEmits(['continue'])

const continueButton = ref(null)

const isCorrect = computed(() => props.feedback?.status === 'correct')

const prompt = computed(() => {
  return (
    props.question?.prompt ??
    props.question?.question ??
    props.question?.statement ??
    props.question?.text ??
    ''
  )
})

const hasCorrectAnswer = computed(() => {
  const value = props.feedback?.correctAnswer

  return value !== undefined && value !== null && value !== ''
})

const continueLabel = computed(() => {
  return props.isFinal ? 'Ver resultado' : 'Próxima questão'
})

function resolveOptionLabel(value) {
  if (!props.question) return null

  const options =
    props.question.options ??
    props.question.choices ??
    props.question.alternatives

  if (!Array.isArray(options)) return null

  const match = options.find((option) => {
    if (option && typeof option === 'object') {
      const candidate =
        option.id ?? option.value ?? option.key ?? option.label ?? option.text

      return String(candidate) === String(value)
    }

    return String(option) === String(value)
  })

  if (!match || typeof match !== 'object') return null

  return String(match.text ?? match.label ?? match.value ?? match.id ?? '')
}

function formatScalar(value) {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Verdadeiro' : 'Falso'

  return resolveOptionLabel(value) ?? String(value)
}

function formatAnswer(value) {
  if (value === undefined || value === null || value === '') return '—'

  if (Array.isArray(value)) {
    return value.map((item) => formatAnswer(item)).join(' · ')
  }

  if (typeof value === 'object') {
    if ('left' in value && 'right' in value) {
      return `${formatScalar(value.left)} → ${formatScalar(value.right)}`
    }

    return Object.values(value).map((item) => formatScalar(item)).join(' · ')
  }

  return formatScalar(value)
}

const userAnswerLabel = computed(() => formatAnswer(props.feedback?.userAnswer))
const correctAnswerLabel = computed(() => formatAnswer(props.feedback?.correctAnswer))

onMounted(() => {
  continueButton.value?.focus()
})
</script>

<template>
  <section class="explanation-view">
    <header class="explanation-view__header">
      <span class="explanation-view__eyebrow">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />
        </svg>
        Explicação
      </span>

      <h2 v-if="prompt" class="explanation-view__prompt">
        {{ prompt }}
      </h2>
    </header>

    <FeedbackBox
      :status="feedback.status"
      :message="feedback.message"
      :points="feedback.points"
      :explanation="feedback.explanation"
    />

    <div class="explanation-view__answers">
      <div class="explanation-view__answer">
        <span class="explanation-view__answer-label">Sua resposta</span>
        <span
          class="explanation-view__answer-value"
          :class="isCorrect ? 'is-correct' : 'is-incorrect'"
        >
          {{ userAnswerLabel }}
        </span>
      </div>

      <div v-if="!isCorrect && hasCorrectAnswer" class="explanation-view__answer">
        <span class="explanation-view__answer-label">Resposta correta</span>
        <span class="explanation-view__answer-value is-correct">
          {{ correctAnswerLabel }}
        </span>
      </div>
    </div>

    <footer class="explanation-view__footer">
      <div class="explanation-view__score">
        <span class="explanation-view__score-label">Pontuação parcial</span>
        <strong class="explanation-view__score-value">{{ score }}</strong>
        <span class="explanation-view__score-meta">
          {{ lives }} {{ lives === 1 ? 'vida restante' : 'vidas restantes' }}
        </span>
      </div>

      <button
        ref="continueButton"
        type="button"
        class="explanation-view__continue"
        @click="emit('continue')"
      >
        <span>{{ continueLabel }}</span>

        <svg
          class="explanation-view__continue-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </button>
    </footer>
  </section>
</template>

<style scoped>
.explanation-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  color: var(--color-ink);
}

.explanation-view__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.explanation-view__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 12px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-sun-strong);
  background: var(--color-sun-soft);
  border: 2px solid var(--color-sun);
  border-radius: var(--radius-pill);
}

.explanation-view__eyebrow svg {
  width: 14px;
  height: 14px;
}

.explanation-view__prompt {
  margin: 0;
  font-size: clamp(1.05rem, 2.2vw, 1.35rem);
  font-weight: 800;
  line-height: 1.45;
  color: var(--color-ink);
  text-wrap: balance;
}

.explanation-view__answers {
  display: grid;
  gap: 12px;
}

.explanation-view__answer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-card);
}

.explanation-view__answer-label {
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.explanation-view__answer-value {
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.45;
  color: var(--color-ink);
  overflow-wrap: anywhere;
}

.explanation-view__answer-value.is-correct {
  color: var(--color-mint-strong);
}

.explanation-view__answer-value.is-incorrect {
  color: var(--color-coral-strong);
}

.explanation-view__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 20px;
  border-top: 2px solid var(--color-border-soft);
}

.explanation-view__score {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}

.explanation-view__score-label {
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.explanation-view__score-value {
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--color-cyan-strong);
}

.explanation-view__score-meta {
  font-size: 0.8rem;
  color: var(--color-ink-muted);
}

.explanation-view__continue {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 190px;
  padding: 12px 22px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-primary-ink);
  cursor: pointer;
  background: var(--color-primary);
  border: 2px solid var(--color-primary-border);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.explanation-view__continue:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-active);
  transform: translateY(-1px);
}

.explanation-view__continue:active {
  background: var(--color-primary-active);
  transform: translateY(1px);
}

.explanation-view__continue:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.explanation-view__continue-icon {
  width: 16px;
  height: 16px;
}

@media (max-width: 600px) {
  .explanation-view__footer {
    align-items: stretch;
  }

  .explanation-view__continue {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .explanation-view__continue {
    transition: none;
  }

  .explanation-view__continue:hover {
    transform: none;
  }
}
</style>
