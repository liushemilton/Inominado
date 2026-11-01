<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  question: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit-answer'])

const BLANK_PATTERN = /(\{\{\s*blank\s*\}\}|_{2,}|\[\s*blank\s*\])/i

const values = ref([])

const rawText = computed(() => {
  return (
    props.question?.text ??
    props.question?.sentence ??
    props.question?.prompt ??
    props.question?.question ??
    ''
  )
})

const instruction = computed(() => {
  const prompt = props.question?.prompt ?? props.question?.question ?? ''

  return prompt && prompt !== rawText.value ? prompt : ''
})

const textParts = computed(() => {
  return String(rawText.value ?? '').split(BLANK_PATTERN)
})

const markerCount = computed(() => {
  return textParts.value.reduce((count, _part, index) => {
    return count + (index % 2 === 1 ? 1 : 0)
  }, 0)
})

const declaredCount = computed(() => {
  const blanks = props.question?.blanks

  if (Array.isArray(blanks)) return blanks.length

  const count = Number(blanks)

  return Number.isInteger(count) && count > 0 ? count : 0
})

const blankCount = computed(() => {
  return Math.max(markerCount.value, declaredCount.value, 1)
})

const extraBlankIndexes = computed(() => {
  const start = markerCount.value
  const length = Math.max(0, blankCount.value - start)

  return Array.from({ length }, (_item, index) => start + index)
})

const typeLabel = computed(() => {
  return blankCount.value > 1 ? 'Complete as lacunas' : 'Complete a lacuna'
})

const canSubmit = computed(() => {
  return values.value.some((value) => String(value ?? '').trim() !== '')
})

watch(
  () => [props.question, blankCount.value],
  () => {
    values.value = Array.from({ length: blankCount.value }, () => '')
  },
  { immediate: true },
)

function placeholderFor(index) {
  const placeholders = props.question?.placeholders

  if (Array.isArray(placeholders) && placeholders[index]) {
    return String(placeholders[index])
  }

  const blank = props.question?.blanks?.[index]

  if (blank && typeof blank === 'object' && blank.placeholder) {
    return String(blank.placeholder)
  }

  return props.question?.placeholder ?? 'Sua resposta'
}

function submitAnswer() {
  if (props.disabled || !canSubmit.value) return

  const answers = values.value.map((value) => String(value ?? '').trim())

  emit('submit-answer', answers.length === 1 ? answers[0] : answers)
}
</script>

<template>
  <section class="fill-blanks">
    <header class="fill-blanks__header">
      <span class="fill-blanks__type">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        {{ typeLabel }}
      </span>

      <h2 v-if="instruction" class="fill-blanks__instruction">
        {{ instruction }}
      </h2>
    </header>

    <form class="fill-blanks__form" @submit.prevent="submitAnswer">
      <p
        v-if="rawText"
        class="fill-blanks__sentence"
        :class="{ 'has-inline-blanks': markerCount > 0 }"
      >
        <template v-for="(part, index) in textParts" :key="`part-${index}`">
          <template v-if="index % 2 === 1">
            <input
              v-model="values[Math.floor(index / 2)]"
              class="fill-blanks__input"
              type="text"
              :placeholder="placeholderFor(Math.floor(index / 2))"
              :aria-label="`Lacuna ${Math.floor(index / 2) + 1}`"
              :disabled="disabled"
              autocomplete="off"
              spellcheck="false"
            />
          </template>

          <template v-else>{{ part }}</template>
        </template>
      </p>

      <p v-else class="fill-blanks__sentence">
        Complete a lacuna abaixo.
      </p>

      <div v-if="extraBlankIndexes.length" class="fill-blanks__fields">
        <label
          v-for="index in extraBlankIndexes"
          :key="`blank-${index}`"
          class="fill-blanks__field"
        >
          <span class="fill-blanks__field-label">Lacuna {{ index + 1 }}</span>

          <input
            v-model="values[index]"
            class="fill-blanks__input is-block"
            type="text"
            :placeholder="placeholderFor(index)"
            :disabled="disabled"
            autocomplete="off"
            spellcheck="false"
          />
        </label>
      </div>

      <div class="fill-blanks__actions">
        <button
          type="submit"
          class="fill-blanks__submit"
          :disabled="disabled || !canSubmit"
        >
          Responder
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.fill-blanks {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  color: var(--color-ink);
}

.fill-blanks__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fill-blanks__type {
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

.fill-blanks__type svg {
  width: 14px;
  height: 14px;
}

.fill-blanks__instruction {
  margin: 0;
  font-size: clamp(1.1rem, 2.2vw, 1.4rem);
  font-weight: 800;
  line-height: 1.4;
  color: var(--color-ink);
  text-wrap: balance;
}

.fill-blanks__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.fill-blanks__sentence {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.9;
  color: var(--color-ink);
  white-space: pre-wrap;
}

.fill-blanks__sentence.has-inline-blanks {
  line-height: 2.2;
}

.fill-blanks__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fill-blanks__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fill-blanks__field-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.fill-blanks__input {
  width: clamp(8rem, 22vw, 13rem);
  min-width: 7rem;
  margin: 0 4px;
  padding: 8px 14px;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-ink);
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  caret-color: var(--color-cyan-strong);
  transition: border-color 160ms ease, background-color 160ms ease;
}

.fill-blanks__input.is-block {
  width: 100%;
  margin: 0;
}

.fill-blanks__input::placeholder {
  font-weight: 500;
  color: var(--color-ink-faint);
  opacity: 1;
}

.fill-blanks__input:focus {
  outline: none;
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan-strong);
}

.fill-blanks__input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--color-surface-soft);
}

.fill-blanks__actions {
  display: flex;
  justify-content: flex-end;
}

.fill-blanks__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  padding: 12px 22px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-primary-ink);
  cursor: pointer;
  background: var(--color-primary);
  border: 2px solid var(--color-primary-border);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease, opacity 160ms ease;
}

.fill-blanks__submit:not(:disabled):hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-active);
  transform: translateY(-1px);
}

.fill-blanks__submit:not(:disabled):active {
  background: var(--color-primary-active);
  transform: translateY(1px);
}

.fill-blanks__submit:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.fill-blanks__submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--color-surface-soft);
  border-color: var(--color-border-soft);
  color: var(--color-ink-faint);
}

@media (max-width: 480px) {
  .fill-blanks {
    gap: 14px;
  }

  .fill-blanks__form {
    gap: 16px;
  }

  .fill-blanks__input {
    width: 100%;
    margin: 4px 0;
  }

  .fill-blanks__actions {
    justify-content: stretch;
  }

  .fill-blanks__submit {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fill-blanks__input,
  .fill-blanks__submit {
    transition: none;
  }

  .fill-blanks__submit:not(:disabled):hover {
    transform: none;
  }
}
</style>