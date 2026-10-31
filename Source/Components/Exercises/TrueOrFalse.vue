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
      <span class="true-or-false__type">Verdadeiro ou falso</span>

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
        <span class="true-or-false__icon" aria-hidden="true">✓</span>
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
        <span class="true-or-false__icon" aria-hidden="true">✕</span>
        <span class="true-or-false__label">Falso</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.true-or-false {
  --neon: #00f0ff;
  --neon-glow: rgba(0, 240, 255, 0.4);
  --true: #2bffc6;
  --true-glow: rgba(43, 255, 198, 0.38);
  --false: #ff2d78;
  --false-glow: rgba(255, 45, 120, 0.38);
  --surface: #12131c;
  --text: #eafcff;

  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  color: var(--text);
}

.true-or-false__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.true-or-false__type {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--neon);
  text-shadow: 0 0 10px var(--neon-glow);
}

.true-or-false__statement {
  margin: 0;
  font-size: clamp(1.15rem, 2.4vw, 1.45rem);
  font-weight: 700;
  line-height: 1.45;
  color: var(--text);
  text-wrap: balance;
}

.true-or-false__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.true-or-false__button {
  --tone: var(--true);
  --tone-glow: var(--true-glow);
  --tone-soft: rgba(43, 255, 198, 0.14);
  --tone-border: rgba(43, 255, 198, 0.4);
  --tone-fill: rgba(43, 255, 198, 0.2);
  --tone-inset: rgba(43, 255, 198, 0.1);

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 76px;
  padding: 16px 18px;
  box-sizing: border-box;
  font: inherit;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    var(--surface);
  border: 1px solid var(--tone-border);
  border-radius: 14px;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background-color 180ms ease,
    transform 180ms ease;
}

.true-or-false__button.is-false {
  --tone: var(--false);
  --tone-glow: var(--false-glow);
  --tone-soft: rgba(255, 45, 120, 0.14);
  --tone-border: rgba(255, 45, 120, 0.4);
  --tone-fill: rgba(255, 45, 120, 0.2);
  --tone-inset: rgba(255, 45, 120, 0.1);
}

.true-or-false__button:not(:disabled):hover {
  border-color: var(--tone);
  box-shadow: 0 0 18px var(--tone-glow);
  transform: translateY(-1px);
}

.true-or-false__button:not(:disabled):active {
  transform: translateY(0);
  box-shadow: 0 0 10px var(--tone-glow);
}

.true-or-false__button:focus-visible {
  outline: 2px solid var(--tone);
  outline-offset: 3px;
}

.true-or-false__icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 1rem;
  color: var(--tone);
  background: var(--tone-soft);
  border: 1px solid var(--tone-border);
  border-radius: 50%;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.true-or-false__button.is-selected {
  border-color: var(--tone);
  background:
    linear-gradient(90deg, var(--tone-fill), transparent),
    var(--surface);
  box-shadow:
    0 0 18px var(--tone-glow),
    inset 0 0 20px var(--tone-inset);
}

.true-or-false__button.is-selected .true-or-false__icon {
  color: #041014;
  background: var(--tone);
  border-color: var(--tone);
  box-shadow: 0 0 14px var(--tone-glow);
}

.true-or-false__button.is-selected .true-or-false__label {
  color: #ffffff;
  text-shadow: 0 0 12px var(--tone-glow);
}

.true-or-false__button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: none;
  transform: none;
}

.true-or-false__button.is-selected:disabled {
  opacity: 0.75;
  border-color: var(--tone);
  box-shadow: 0 0 12px var(--tone-glow);
}

@media (max-width: 480px) {
  .true-or-false {
    gap: 18px;
  }

  .true-or-false__actions {
    grid-template-columns: 1fr;
  }

  .true-or-false__button {
    min-height: 64px;
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