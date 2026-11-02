<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  question: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit-answer'])

const BLANK_PATTERN = /(\{\{\s*blank\s*\}|_{2,}|\[\s*blank\s*\])/i

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
  return 'Rota Reacional / Mecanismo'
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

  return props.question?.placeholder ?? 'Ex: SN2, Etapa 1...'
}

function submitAnswer() {
  if (props.disabled || !canSubmit.value) return

  const answers = values.value.map((value) => String(value ?? '').trim())
  emit('submit-answer', answers.length === 1 ? answers[0] : answers)
}
</script>

<template>
  <section class="reaction-path-selector">
    <header class="reaction-path-selector__header">
      <span class="reaction-path-selector__type">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
          <path d="M19 12H5" />
        </svg>
        {{ typeLabel }}
      </span>

      <h2 v-if="instruction" class="reaction-path-selector__instruction">
        {{ instruction }}
      </h2>
    </header>

    <!-- Exibição opcional do esquema reacional ou equação -->
    <div v-if="question?.reaction || question?.scheme" class="reaction-path-selector__reaction-card">
      <span class="reaction-path-selector__reaction-label">Esquema Reacional:</span>
      <code class="reaction-path-selector__reaction-code">{{ question.reaction || question.scheme }}</code>
    </div>

    <form class="reaction-path-selector__form" @submit.prevent="submitAnswer">
      <p
        v-if="rawText"
        class="reaction-path-selector__sentence"
        :class="{ 'has-inline-blanks': markerCount > 0 }"
      >
        <template v-for="(part, index) in textParts" :key="`part-${index}`">
          <template v-if="index % 2 === 1">
            <input
              v-model="values[Math.floor(index / 2)]"
              class="reaction-path-selector__input"
              type="text"
              :placeholder="placeholderFor(Math.floor(index / 2))"
              :aria-label="`Etapa / Rota ${Math.floor(index / 2) + 1}`"
              :disabled="disabled"
              autocomplete="off"
              spellcheck="false"
            />
          </template>

          <template v-else>{{ part }}</template>
        </template>
      </p>

      <p v-else class="reaction-path-selector__sentence">
        Selecione ou indique a rota reacional adequada:
      </p>

      <div v-if="extraBlankIndexes.length" class="reaction-path-selector__fields">
        <label
          v-for="index in extraBlankIndexes"
          :key="`blank-${index}`"
          class="reaction-path-selector__field"
        >
          <span class="reaction-path-selector__field-label">Etapa / Rota {{ index + 1 }}</span>

          <input
            v-model="values[index]"
            class="reaction-path-selector__input is-block"
            type="text"
            :placeholder="placeholderFor(index)"
            :disabled="disabled"
            autocomplete="off"
            spellcheck="false"
          />
        </label>
      </div>

      <div class="reaction-path-selector__actions">
        <button
          type="submit"
          class="reaction-path-selector__submit"
          :disabled="disabled || !canSubmit"
        >
          Responder
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.reaction-path-selector {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  color: var(--color-ink);
}

.reaction-path-selector__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reaction-path-selector__type {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 12px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-purple-strong, #6d28d9);
  background: var(--color-purple-soft, #f5f3ff);
  border: 2px solid var(--color-purple, #8b5cf6);
  border-radius: var(--radius-pill, 9999px);
}

.reaction-path-selector__type svg {
  width: 14px;
  height: 14px;
}

.reaction-path-selector__instruction {
  margin: 0;
  font-size: clamp(1.1rem, 2.2vw, 1.4rem);
  font-weight: 800;
  line-height: 1.4;
  color: var(--color-ink);
  text-wrap: balance;
}

.reaction-path-selector__reaction-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  background: var(--color-surface-soft, #f9fafb);
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
}

.reaction-path-selector__reaction-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-muted, #6b7280);
}

.reaction-path-selector__reaction-code {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-ink);
}

.reaction-path-selector__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.reaction-path-selector__sentence {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.9;
  color: var(--color-ink);
  white-space: pre-wrap;
}

.reaction-path-selector__sentence.has-inline-blanks {
  line-height: 2.2;
}

.reaction-path-selector__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reaction-path-selector__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reaction-path-selector__field-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-muted, #6b7280);
}

.reaction-path-selector__input {
  width: clamp(8rem, 22vw, 13rem);
  min-width: 7rem;
  margin: 0 4px;
  padding: 8px 14px;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-ink);
  background: var(--color-surface, #fff);
  border: 2px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-pill, 9999px);
  caret-color: var(--color-purple-strong, #6d28d9);
  transition: border-color 160ms ease, background-color 160ms ease;
}

.reaction-path-selector__input.is-block {
  width: 100%;
  margin: 0;
}

.reaction-path-selector__input::placeholder {
  font-weight: 500;
  color: var(--color-ink-faint, #9ca3af);
  opacity: 1;
}

.reaction-path-selector__input:focus {
  outline: none;
  background: var(--color-purple-soft, #f5f3ff);
  border-color: var(--color-purple-strong, #6d28d9);
}

.reaction-path-selector__input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--color-surface-soft, #f3f4f6);
}

.reaction-path-selector__actions {
  display: flex;
  justify-content: flex-end;
}

.reaction-path-selector__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  padding: 12px 22px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-primary-ink, #fff);
  cursor: pointer;
  background: var(--color-primary, #7c3aed);
  border: 2px solid var(--color-primary-border, #6d28d9);
  border-radius: var(--radius-pill, 9999px);
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease, opacity 160ms ease;
}

.reaction-path-selector__submit:not(:disabled):hover {
  background: var(--color-primary-hover, #6d28d9);
  border-color: var(--color-primary-active, #5b21b6);
  transform: translateY(-1px);
}

.reaction-path-selector__submit:not(:disabled):active {
  background: var(--color-primary-active, #5b21b6);
  transform: translateY(1px);
}

.reaction-path-selector__submit:focus-visible {
  outline: 3px solid var(--color-focus, #a78bfa);
  outline-offset: 3px;
}

.reaction-path-selector__submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--color-surface-soft, #f3f4f6);
  border-color: var(--color-border-soft, #e5e7eb);
  color: var(--color-ink-faint, #9ca3af);
}

@media (max-width: 480px) {
  .reaction-path-selector {
    gap: 14px;
  }

  .reaction-path-selector__form {
    gap: 16px;
  }

  .reaction-path-selector__input {
    width: 100%;
    margin: 4px 0;
  }

  .reaction-path-selector__actions {
    justify-content: stretch;
  }

  .reaction-path-selector__submit {
    width: 100%;
  }
}

@media (reduced-motion: reduce) {
  .reaction-path-selector__input,
  .reaction-path-selector__submit {
    transition: none;
  }

  .reaction-path-selector__submit:not(:disabled):hover {
    transform: none;
  }
}
</style>