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
  return 'Correção de Nomenclatura'
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

  return props.question?.placeholder ?? 'Digite o nome correto IUPAC...'
}

function submitAnswer() {
  if (props.disabled || !canSubmit.value) return

  const answers = values.value.map((value) => String(value ?? '').trim())
  emit('submit-answer', answers.length === 1 ? answers[0] : answers)
}
</script>

<template>
  <section class="nomenclature-error-spotter">
    <header class="nomenclature-error-spotter__header">
      <span class="nomenclature-error-spotter__type">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        {{ typeLabel }}
      </span>

      <h2 v-if="instruction" class="nomenclature-error-spotter__instruction">
        {{ instruction }}
      </h2>
    </header>

    <!-- Exibição de nome incorreto ou molécula para análise -->
    <div v-if="question?.wrongName || question?.molecule" class="nomenclature-error-spotter__banner">
      <div v-if="question?.wrongName" class="nomenclature-error-spotter__wrong-box">
        <span class="nomenclature-error-spotter__badge-error">Nome Incorreto</span>
        <code>{{ question.wrongName }}</code>
      </div>
      <div v-if="question?.molecule" class="nomenclature-error-spotter__molecule">
        <span>Estrutura:</span> <code>{{ question.molecule }}</code>
      </div>
    </div>

    <form class="nomenclature-error-spotter__form" @submit.prevent="submitAnswer">
      <p
        v-if="rawText"
        class="nomenclature-error-spotter__sentence"
        :class="{ 'has-inline-blanks': markerCount > 0 }"
      >
        <template v-for="(part, index) in textParts" :key="`part-${index}`">
          <template v-if="index % 2 === 1">
            <input
              v-model="values[Math.floor(index / 2)]"
              class="nomenclature-error-spotter__input"
              type="text"
              :placeholder="placeholderFor(Math.floor(index / 2))"
              :aria-label="`Correção ${Math.floor(index / 2) + 1}`"
              :disabled="disabled"
              autocomplete="off"
              spellcheck="false"
            />
          </template>

          <template v-else>{{ part }}</template>
        </template>
      </p>

      <p v-else class="nomenclature-error-spotter__sentence">
        Aponte o erro e informe o nome correto:
      </p>

      <div v-if="extraBlankIndexes.length" class="nomenclature-error-spotter__fields">
        <label
          v-for="index in extraBlankIndexes"
          :key="`blank-${index}`"
          class="nomenclature-error-spotter__field"
        >
          <span class="nomenclature-error-spotter__field-label">Correção {{ index + 1 }}</span>

          <input
            v-model="values[index]"
            class="nomenclature-error-spotter__input is-block"
            type="text"
            :placeholder="placeholderFor(index)"
            :disabled="disabled"
            autocomplete="off"
            spellcheck="false"
          />
        </label>
      </div>

      <div class="nomenclature-error-spotter__actions">
        <button
          type="submit"
          class="nomenclature-error-spotter__submit"
          :disabled="disabled || !canSubmit"
        >
          Responder
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.nomenclature-error-spotter {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  color: var(--color-ink);
}

.nomenclature-error-spotter__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nomenclature-error-spotter__type {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 12px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-amber-strong, #b45309);
  background: var(--color-amber-soft, #fef3c7);
  border: 2px solid var(--color-amber, #f59e0b);
  border-radius: var(--radius-pill, 9999px);
}

.nomenclature-error-spotter__type svg {
  width: 14px;
  height: 14px;
}

.nomenclature-error-spotter__instruction {
  margin: 0;
  font-size: clamp(1.1rem, 2.2vw, 1.4rem);
  font-weight: 800;
  line-height: 1.4;
  color: var(--color-ink);
  text-wrap: balance;
}

.nomenclature-error-spotter__banner {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: var(--color-surface-soft, #f9fafb);
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
}

.nomenclature-error-spotter__wrong-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nomenclature-error-spotter__badge-error {
  padding: 2px 8px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #991b1b;
  background: #fee2e2;
  border-radius: var(--radius-pill, 9999px);
}

.nomenclature-error-spotter__wrong-box code,
.nomenclature-error-spotter__molecule code {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-ink);
}

.nomenclature-error-spotter__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nomenclature-error-spotter__sentence {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.9;
  color: var(--color-ink);
  white-space: pre-wrap;
}

.nomenclature-error-spotter__sentence.has-inline-blanks {
  line-height: 2.2;
}

.nomenclature-error-spotter__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nomenclature-error-spotter__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nomenclature-error-spotter__field-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-muted, #6b7280);
}

.nomenclature-error-spotter__input {
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
  caret-color: var(--color-amber-strong, #b45309);
  transition: border-color 160ms ease, background-color 160ms ease;
}

.nomenclature-error-spotter__input.is-block {
  width: 100%;
  margin: 0;
}

.nomenclature-error-spotter__input::placeholder {
  font-weight: 500;
  color: var(--color-ink-faint, #9ca3af);
  opacity: 1;
}

.nomenclature-error-spotter__input:focus {
  outline: none;
  background: var(--color-amber-soft, #fef3c7);
  border-color: var(--color-amber-strong, #b45309);
}

.nomenclature-error-spotter__input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--color-surface-soft, #f3f4f6);
}

.nomenclature-error-spotter__actions {
  display: flex;
  justify-content: flex-end;
}

.nomenclature-error-spotter__submit {
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
  background: var(--color-primary, #d97706);
  border: 2px solid var(--color-primary-border, #b45309);
  border-radius: var(--radius-pill, 9999px);
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease, opacity 160ms ease;
}

.nomenclature-error-spotter__submit:not(:disabled):hover {
  background: var(--color-primary-hover, #b45309);
  border-color: var(--color-primary-active, #92400e);
  transform: translateY(-1px);
}

.nomenclature-error-spotter__submit:not(:disabled):active {
  background: var(--color-primary-active, #92400e);
  transform: translateY(1px);
}

.nomenclature-error-spotter__submit:focus-visible {
  outline: 3px solid var(--color-focus, #fbbf24);
  outline-offset: 3px;
}

.nomenclature-error-spotter__submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--color-surface-soft, #f3f4f6);
  border-color: var(--color-border-soft, #e5e7eb);
  color: var(--color-ink-faint, #9ca3af);
}

@media (max-width: 480px) {
  .nomenclature-error-spotter {
    gap: 14px;
  }

  .nomenclature-error-spotter__form {
    gap: 16px;
  }

  .nomenclature-error-spotter__input {
    width: 100%;
    margin: 4px 0;
  }

  .nomenclature-error-spotter__actions {
    justify-content: stretch;
  }

  .nomenclature-error-spotter__submit {
    width: 100%;
  }
}

@media (reduced-motion: reduce) {
  .nomenclature-error-spotter__input,
  .nomenclature-error-spotter__submit {
    transition: none;
  }

  .nomenclature-error-spotter__submit:not(:disabled):hover {
    transform: none;
  }
}
</style>