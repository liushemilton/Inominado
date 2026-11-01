<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  question: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit-answer'])

const selected = ref(null)

const statement = computed(() => {
  return (
    props.question?.statement ??
    props.question?.prompt ??
    props.question?.question ??
    props.question?.text ??
    ''
  )
})

function choose(value) {
  if (props.disabled || selected.value === value) return

  selected.value = value
  emit('submit-answer', value)
}

watch(
  () => props.question,
  () => {
    selected.value = null
  },
)
</script>

<template>
  <section class="true-or-false">
    <header class="true-or-false__header">
      <span class="true-or-false__type">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v18" />
          <path d="M5 7h14" />
          <path d="m7 7-3 7h6L7 7Z" />
          <path d="m17 7-3 7h6l-3-7Z" />
        </svg>
        Verdadeiro ou falso
      </span>

      <h2 v-if="statement" class="true-or-false__statement">
        {{ statement }}
      </h2>
    </header>

    <div
      class="true-or-false__actions"
      role="group"
      aria-label="Escolha verdadeiro ou falso"
    >
      <button
        type="button"
        class="true-or-false__button is-true"
        :class="{ 'is-selected': selected === true }"
        :disabled="disabled"
        :aria-pressed="selected === true"
        @click="choose(true)"
      >
        <span class="true-or-false__icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <span class="true-or-false__label">Verdadeiro</span>
      </button>

      <button
        type="button"
        class="true-or-false__button is-false"
        :class="{ 'is-selected': selected === false }"
        :disabled="disabled"
        :aria-pressed="selected === false"
        @click="choose(false)"
      >
        <span class="true-or-false__icon" aria-hidden="true">
          <svg
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
        </span>
        <span class="true-or-false__label">Falso</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.true-or-false {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  color: var(--color-ink);
}

.true-or-false__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.true-or-false__type {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 12px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border: 2px solid var(--color-cyan);
  border-radius: var(--radius-pill);
}

.true-or-false__type svg {
  width: 14px;
  height: 14px;
}

.true-or-false__statement {
  margin: 0;
  font-size: clamp(1.15rem, 2.4vw, 1.5rem);
  font-weight: 800;
  line-height: 1.4;
  color: var(--color-ink);
  text-wrap: balance;
}

.true-or-false__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.true-or-false__button {
  --tone: var(--color-mint);
  --tone-soft: var(--color-mint-soft);
  --tone-strong: var(--color-mint-strong);
  --tone-ink: var(--color-mint-ink);

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 80px;
  padding: 18px 20px;
  font: inherit;
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: var(--tone-ink);
  cursor: pointer;
  background: var(--tone-soft);
  border: 3px solid var(--tone);
  border-radius: 16px;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.true-or-false__button.is-false {
  --tone: var(--color-coral);
  --tone-soft: var(--color-coral-soft);
  --tone-strong: var(--color-coral-strong);
  --tone-ink: var(--color-coral-ink);
}

.true-or-false__button:not(:disabled):hover {
  background: var(--tone);
  border-color: var(--tone-strong);
  transform: translateY(-2px);
}

.true-or-false__button:not(:disabled):active {
  border-color: var(--tone-strong);
  transform: translateY(1px);
}

.true-or-false__button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.true-or-false__icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--tone-strong);
  background: var(--color-surface);
  border: 2px solid var(--tone-strong);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.true-or-false__icon svg {
  width: 20px;
  height: 20px;
}

.true-or-false__button.is-selected {
  background: var(--tone);
  border-color: var(--tone-strong);
}

.true-or-false__button.is-selected .true-or-false__icon {
  color: var(--color-surface);
  background: var(--tone-strong);
  border-color: var(--tone-strong);
}

.true-or-false__button.is-selected .true-or-false__label {
  color: var(--tone-ink);
}

.true-or-false__button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  border-color: var(--color-border-soft);
}

.true-or-false__button.is-selected:disabled {
  opacity: 0.75;
  border-color: var(--tone-strong);
}

@media (max-width: 480px) {
  .true-or-false {
    gap: 18px;
  }

  .true-or-false__actions {
    grid-template-columns: 1fr;
  }

  .true-or-false__button {
    min-height: 68px;
    padding: 15px 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .true-or-false__button,
  .true-or-false__icon {
    transition: none;
  }

  .true-or-false__button:not(:disabled):hover {
    transform: none;
  }
}
</style>