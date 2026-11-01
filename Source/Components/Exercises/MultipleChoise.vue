<script setup>
import { computed, ref, watch } from 'vue'

import AnswerButton from '../Game/AnswerButton.vue'

const props = defineProps({
  question: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit-answer'])

const selectedIndex = ref(null)

const prompt = computed(() => {
  return (
    props.question?.prompt ??
    props.question?.question ??
    props.question?.statement ??
    props.question?.text ??
    ''
  )
})

const options = computed(() => {
  const value =
    props.question?.options ??
    props.question?.choices ??
    props.question?.alternatives ??
    []

  return Array.isArray(value) ? value : []
})

function optionValue(option) {
  if (option && typeof option === 'object') {
    if ('id' in option) return option.id
    if ('value' in option) return option.value
    if ('key' in option) return option.key
    if ('label' in option) return option.label
    if ('text' in option) return option.text
  }

  return option
}

function optionLabel(option) {
  if (option && typeof option === 'object') {
    return String(
      option.text ??
        option.label ??
        option.value ??
        option.id ??
        option.key ??
        '',
    )
  }

  return String(option ?? '')
}

function optionKey(option, index) {
  const value = optionValue(option)

  return `${index}:${String(value ?? '')}`
}

function letterFor(index) {
  if (index < 26) return String.fromCharCode(65 + index)

  return String(index + 1)
}

function selectOption(option, index) {
  if (props.disabled || selectedIndex.value === index) return

  selectedIndex.value = index
  emit('submit-answer', optionValue(option))
}

watch(
  () => props.question,
  () => {
    selectedIndex.value = null
  },
)
</script>

<template>
  <section class="multiple-choice">
    <header class="multiple-choice__header">
      <span class="multiple-choice__type">
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
        Múltipla escolha
      </span>

      <h2 v-if="prompt" class="multiple-choice__prompt">
        {{ prompt }}
      </h2>
    </header>

    <div
      v-if="options.length"
      class="multiple-choice__options"
      role="group"
      aria-label="Alternativas"
    >
      <AnswerButton
        v-for="(option, index) in options"
        :key="optionKey(option, index)"
        :label="optionLabel(option)"
        :letter="letterFor(index)"
        :selected="selectedIndex === index"
        :disabled="disabled"
        @select="selectOption(option, index)"
      />
    </div>

    <p v-else class="multiple-choice__empty">
      Nenhuma alternativa disponível.
    </p>
  </section>
</template>

<style scoped>
.multiple-choice {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  color: var(--color-ink);
}

.multiple-choice__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.multiple-choice__type {
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

.multiple-choice__type svg {
  width: 14px;
  height: 14px;
}

.multiple-choice__prompt {
  margin: 0;
  font-size: clamp(1.15rem, 2.4vw, 1.5rem);
  font-weight: 800;
  line-height: 1.4;
  color: var(--color-ink);
  text-wrap: balance;
}

.multiple-choice__options {
  display: grid;
  gap: 12px;
}

.multiple-choice__empty {
  margin: 0;
  padding: 18px;
  font-size: 0.95rem;
  color: var(--color-ink-muted);
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-card);
}

@media (max-width: 480px) {
  .multiple-choice {
    gap: 18px;
  }
}
</style>