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
  return 'Ranking de Propriedades'
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

  return props.question?.placeholder ?? 'Ex: 1, 2, 3 ou ordem...'
}

function submitAnswer() {
  if (props.disabled || !canSubmit.value) return

  const answers = values.value.map((value) => String(value ?? '').trim())
  emit('submit-answer', answers.length === 1 ? answers[0] : answers)
}
</script>

<template>
  <section class="property-ranking">
    <header class="property-ranking__header">
      <span class="property-ranking__type">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        {{ typeLabel }}
      </span>

      <h2 v-if="instruction" class="property-ranking__instruction">
        {{ instruction }}
      </h2>
    </header>

    <!-- Lista opcional de itens a serem ordenados ou analisados -->
    <div v-if="question?.items && Array.isArray(question.items)" class="property-ranking__items-card">
      <span class="property-ranking__items-title">Itens para análise:</span>
      <ul class="property-ranking__items-list">
        <li v-for="(item, idx) in question.items" :key="`item-${idx}`" class="property-ranking__item">
          <span class="property-ranking__item-index">{{ idx + 1 }}</span>
          <code>{{ item }}</code>
        </li>
      </ul>
    </div>

    <form class="property-ranking__form" @submit.prevent="submitAnswer">
      <p
        v-if="rawText"
        class="property-ranking__sentence"
        :class="{ 'has-inline-blanks': markerCount > 0 }"
      >
        <template v-for="(part, index) in textParts" :key="`part-${index}`">
          <template v-if="index % 2 === 1">
            <input
              v-model="values[Math.floor(index / 2)]"
              class="property-ranking__input"
              type="text"
              :placeholder="placeholderFor(Math.floor(index / 2))"
              :aria-label="`Posição ${Math.floor(index / 2) + 1}`"
              :disabled="disabled"
              autocomplete="off"
              spellcheck="false"
            />
          </template>

          <template v-else>{{ part }}</template>
        </template>
      </p>

      <p v-else class="property-ranking__sentence">
        Ordene os compostos conforme solicitado:
      </p>

      <div v-if="extraBlankIndexes.length" class="property-ranking__fields">
        <label
          v-for="index in extraBlankIndexes"
          :key="`blank-${index}`"
          class="property-ranking__field"
        >
          <span class="property-ranking__field-label">Posição / Valor {{ index + 1 }}</span>

          <input
            v-model="values[index]"
            class="property-ranking__input is-block"
            type="text"
            :placeholder="placeholderFor(index)"
            :disabled="disabled"
            autocomplete="off"
            spellcheck="false"
          />
        </label>
      </div>

      <div class="property-ranking__actions">
        <button
          type="submit"
          class="property-ranking__submit"
          :disabled="disabled || !canSubmit"
        >
          Responder
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.property-ranking {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  color: var(--color-ink);
}

.property-ranking__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.property-ranking__type {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 12px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-indigo-strong, #4338ca);
  background: var(--color-indigo-soft, #eef2ff);
  border: 2px solid var(--color-indigo, #6366f1);
  border-radius: var(--radius-pill, 9999px);
}

.property-ranking__type svg {
  width: 14px;
  height: 14px;
}

.property-ranking__instruction {
  margin: 0;
  font-size: clamp(1.1rem, 2.2vw, 1.4rem);
  font-weight: 800;
  line-height: 1.4;
  color: var(--color-ink);
  text-wrap: balance;
}

.property-ranking__items-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: var(--color-surface-soft, #f9fafb);
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
}

.property-ranking__items-title {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-muted, #6b7280);
}

.property-ranking__items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.property-ranking__item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.property-ranking__item-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 0.75rem;
  font-weight: 800;
  color: #4338ca;
  background: #eef2ff;
  border-radius: 50%;
}

.property-ranking__item code {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-ink);
}

.property-ranking__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.property-ranking__sentence {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.9;
  color: var(--color-ink);
  white-space: pre-wrap;
}

.property-ranking__sentence.has-inline-blanks {
  line-height: 2.2;
}

.property-ranking__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.property-ranking__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.property-ranking__field-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-muted, #6b7280);
}

.property-ranking__input {
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
  caret-color: var(--color-indigo-strong, #4338ca);
  transition: border-color 160ms ease, background-color 160ms ease;
}

.property-ranking__input.is-block {
  width: 100%;
  margin: 0;
}

.property-ranking__input::placeholder {
  font-weight: 500;
  color: var(--color-ink-faint, #9ca3af);
  opacity: 1;
}

.property-ranking__input:focus {
  outline: none;
  background: var(--color-indigo-soft, #eef2ff);
  border-color: var(--color-indigo-strong, #4338ca);
}

.property-ranking__input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--color-surface-soft, #f3f4f6);
}

.property-ranking__actions {
  display: flex;
  justify-content: flex-end;
}

.property-ranking__submit {
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
  background: var(--color-primary, #4f46e5);
  border: 2px solid var(--color-primary-border, #4338ca);
  border-radius: var(--radius-pill, 9999px);
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease, opacity 160ms ease;
}

.property-ranking__submit:not(:disabled):hover {
  background: var(--color-primary-hover, #4338ca);
  border-color: var(--color-primary-active, #3730a3);
  transform: translateY(-1px);
}

.property-ranking__submit:not(:disabled):active {
  background: var(--color-primary-active, #3730a3);
  transform: translateY(1px);
}

.property-ranking__submit:focus-visible {
  outline: 3px solid var(--color-focus, #818cf8);
  outline-offset: 3px;
}

.property-ranking__submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--color-surface-soft, #f3f4f6);
  border-color: var(--color-border-soft, #e5e7eb);
  color: var(--color-ink-faint, #9ca3af);
}

@media (max-width: 480px) {
  .property-ranking {
    gap: 14px;
  }

  .property-ranking__form {
    gap: 16px;
  }

  .property-ranking__input {
    width: 100%;
    margin: 4px 0;
  }

  .property-ranking__actions {
    justify-content: stretch;
  }

  .property-ranking__submit {
    width: 100%;
  }
}

@media (reduced-motion: reduce) {
  .property-ranking__input,
  .property-ranking__submit {
    transition: none;
  }

  .property-ranking__submit:not(:disabled):hover {
    transform: none;
  }
}
</style>