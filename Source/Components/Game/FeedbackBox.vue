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
        {{ isCorrect ? '✓' : '✕' }}
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
  --tone: #00f0ff;
  --surface: #0d0e15;
  --border-default: #1a1c29;

  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  color: #eafcff;
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-left-width: 3px;
  border-radius: 6px;
}

.feedback-box.is-correct {
  --tone: #00f0ff;
  border-left-color: var(--tone);
}

.feedback-box.is-incorrect {
  --tone: #ff3b30;
  border-left-color: var(--tone);
}

.feedback-box__icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--tone);
  background: transparent;
  border: 1px solid var(--tone);
  border-radius: 4px;
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
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--tone);
}

.feedback-box__points {
  padding: 2px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--tone);
  background: transparent;
  border: 1px solid var(--tone);
  border-radius: 4px;
}

.feedback-box__explanation {
  margin: 6px 0 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #8a99ad;
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
    padding: 12px;
  }

  .feedback-box__icon {
    width: 26px;
    height: 26px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feedback-enter-active,
  .feedback-leave-active {
    transition: none;
  }
}
</style>