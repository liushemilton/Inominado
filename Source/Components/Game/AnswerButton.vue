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
  --neon: #00f0ff;
  --surface: #0d0e15;
  --surface-hover: #141622;
  --border-default: #1a1c29;
  --text: #eafcff;

  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.4;
  color: var(--text);
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
}

.answer-button:not(:disabled):hover {
  border-color: var(--neon);
  background: var(--surface-hover);
}

.answer-button:focus-visible {
  outline: 2px solid var(--neon);
  outline-offset: 2px;
}

.answer-button__letter {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--neon);
  background: transparent;
  border: 1px solid var(--neon);
  border-radius: 4px;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
}

.answer-button__label {
  flex: 1 1 auto;
  min-width: 0;
}

/* Estado Selecionado */
.answer-button.is-selected {
  border-color: var(--neon);
  background: var(--surface-hover);
  color: #ffffff;
}

.answer-button.is-selected .answer-button__letter {
  color: #0d0e15;
  background: var(--neon);
  border-color: var(--neon);
}

/* Estado Desabilitado */
.answer-button:disabled,
.answer-button.is-disabled {
  cursor: not-allowed;
  opacity: 0.35;
  border-color: var(--border-default);
}

.answer-button.is-selected:disabled {
  opacity: 0.6;
  border-color: var(--neon);
}

@media (max-width: 480px) {
  .answer-button {
    gap: 12px;
    padding: 12px;
    font-size: 0.9rem;
  }

  .answer-button__letter {
    width: 26px;
    height: 26px;
    font-size: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .answer-button,
  .answer-button__letter {
    transition: none;
  }
}
</style>