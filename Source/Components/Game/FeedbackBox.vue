<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'idle',
    validator: (value) => ['idle', 'correct', 'incorrect'].includes(value),
  },
  message: { type: String, default: '' },
  points: { type: Number, default: 0 },
  explanation: { type: String, default: '' },
})

const isVisible = computed(() => {
  return props.status === 'correct' || props.status === 'incorrect'
})

const isCorrect = computed(() => props.status === 'correct')

const title = computed(() => {
  if (props.message) return props.message

  return isCorrect.value ? 'Resposta correta!' : 'Resposta incorreta.'
})

const pointsLabel = computed(() => {
  return isCorrect.value && props.points > 0 ? `+${props.points} pts` : ''
})
</script>

<template>
  <Transition name="feedback">
    <section
      v-if="isVisible"
      class="feedback-box"
      :class="`is-${status}`"
      role="status"
      aria-live="polite"
    >
      <div class="feedback-box__icon" aria-hidden="true">
        <svg
          v-if="isCorrect"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>

        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </div>

      <div class="feedback-box__content">
        <p class="feedback-box__title">
          <span>{{ title }}</span>
          <span v-if="pointsLabel" class="feedback-box__points">
            {{ pointsLabel }}
          </span>
        </p>

        <p v-if="explanation" class="feedback-box__explanation">
          {{ explanation }}
        </p>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.feedback-box {
  --tone: var(--color-cyan);
  --tone-soft: var(--color-cyan-soft);
  --tone-strong: var(--color-cyan-strong);

  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  color: var(--color-ink);
  background: var(--tone-soft);
  border: 3px solid var(--tone);
  border-radius: var(--radius-card);
}

.feedback-box.is-correct {
  --tone: var(--color-mint);
  --tone-soft: var(--color-mint-soft);
  --tone-strong: var(--color-mint-strong);
}

.feedback-box.is-incorrect {
  --tone: var(--color-coral);
  --tone-soft: var(--color-coral-soft);
  --tone-strong: var(--color-coral-strong);
}

.feedback-box__icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--tone-strong);
  background: var(--color-surface);
  border: 2px solid var(--tone);
  border-radius: var(--radius-pill);
}

.feedback-box__icon svg {
  width: 18px;
  height: 18px;
}

.feedback-box__content {
  flex: 1 1 auto;
  min-width: 0;
}

.feedback-box__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--tone-strong);
}

.feedback-box__points {
  padding: 3px 10px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--tone-strong);
  background: var(--color-surface);
  border: 2px solid var(--tone);
  border-radius: var(--radius-pill);
}

.feedback-box__explanation {
  margin: 8px 0 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--color-ink-soft);
}

.feedback-enter-active,
.feedback-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (max-width: 480px) {
  .feedback-box {
    gap: 12px;
    padding: 14px;
  }

  .feedback-box__icon {
    width: 32px;
    height: 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feedback-enter-active,
  .feedback-leave-active {
    transition: none;
  }
}
</style>
