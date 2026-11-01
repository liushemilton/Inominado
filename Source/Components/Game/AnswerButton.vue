<script setup>
const props = defineProps({
  label: { type: String, required: true },
  letter: { type: String, default: '' },
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

function handleClick() {
  if (props.disabled) return

  emit('select')
}
</script>

<template>
  <button
    type="button"
    class="answer-button"
    :class="{ 'is-selected': selected, 'is-disabled': disabled }"
    :disabled="disabled"
    :aria-pressed="selected"
    @click="handleClick"
  >
    <span v-if="letter" class="answer-button__letter" aria-hidden="true">
      {{ letter }}
    </span>

    <span class="answer-button__label">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<style scoped>
.answer-button {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 18px;
  font: inherit;
  font-size: 0.96rem;
  line-height: 1.45;
  color: var(--color-ink);
  text-align: left;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.answer-button:not(:disabled):hover {
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan);
  transform: translateY(-1px);
}

.answer-button:not(:disabled):active {
  background: var(--color-cyan);
  border-color: var(--color-cyan-strong);
  transform: translateY(1px);
}

.answer-button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.answer-button__letter {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border: 2px solid var(--color-cyan);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease;
}

.answer-button__label {
  flex: 1 1 auto;
  min-width: 0;
}

/* Estado selecionado */
.answer-button.is-selected {
  color: var(--color-cyan-ink);
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan-strong);
}

.answer-button.is-selected .answer-button__letter {
  color: var(--color-cyan-ink);
  background: var(--color-cyan);
  border-color: var(--color-cyan-strong);
}

/* Estado desabilitado */
.answer-button:disabled,
.answer-button.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
  border-color: var(--color-border-soft);
}

.answer-button.is-selected:disabled {
  opacity: 0.75;
  border-color: var(--color-cyan);
}

@media (max-width: 480px) {
  .answer-button {
    gap: 12px;
    padding: 13px 14px;
    font-size: 0.92rem;
  }

  .answer-button__letter {
    width: 30px;
    height: 30px;
    font-size: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .answer-button,
  .answer-button__letter {
    transition: none;
  }

  .answer-button:not(:disabled):hover,
  .answer-button:not(:disabled):active {
    transform: none;
  }
}
</style>