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
      <span class="multiple-choice__type">Múltipla escolha</span>

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
  --neon: #00f0ff;
  --neon-glow: rgba(0, 240, 255, 0.4);
  --text: #eafcff;
  --muted: rgba(234, 252, 255, 0.62);

  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  color: var(--text);
}

.multiple-choice__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.multiple-choice__type {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--neon);
  text-shadow: 0 0 10px var(--neon-glow);
}

.multiple-choice__prompt {
  margin: 0;
  font-size: clamp(1.15rem, 2.4vw, 1.45rem);
  font-weight: 700;
  line-height: 1.45;
  color: var(--text);
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
  color: var(--muted);
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(0, 240, 255, 0.24);
  border-radius: 12px;
}

@media (max-width: 480px) {
  .multiple-choice {
    gap: 18px;
  }
}
</style>