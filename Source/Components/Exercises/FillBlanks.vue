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
      <span class="fill-blanks__type">{{ typeLabel }}</span>

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
  --neon: #00f0ff;
  --surface: #0d0e15;
  --border-default: #1a1c29;
  --text: #eafcff;
  --muted: #8a99ad;

  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  color: var(--text);
}

.fill-blanks__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fill-blanks__type {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--neon);
}

.fill-blanks__instruction {
  margin: 0;
  font-size: clamp(1.1rem, 2.2vw, 1.35rem);
  font-weight: 700;
  line-height: 1.4;
  color: var(--text);
  text-wrap: balance;
}

.fill-blanks__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.fill-blanks__sentence {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.8;
  color: var(--text);
  white-space: pre-wrap;
}

.fill-blanks__sentence.has-inline-blanks {
  line-height: 2.1;
}

.fill-blanks__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fill-blanks__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fill-blanks__field-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.fill-blanks__input {
  width: clamp(8rem, 22vw, 13rem);
  min-width: 7rem;
  margin: 0 4px;
  padding: 6px 10px;
  box-sizing: border-box;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--neon);
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-bottom: 2px solid var(--neon);
  border-radius: 4px;
  caret-color: var(--neon);
  transition: border-color 150ms ease, background-color 150ms ease;
}

.fill-blanks__input.is-block {
  width: 100%;
  margin: 0;
}

.fill-blanks__input::placeholder {
  color: var(--muted);
  font-weight: 400;
  opacity: 0.6;
}

.fill-blanks__input:focus {
  outline: none;
  border-color: var(--neon);
  border-bottom-color: var(--neon);
  background: #141622;
}

.fill-blanks__input:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.fill-blanks__actions {
  display: flex;
  justify-content: flex-end;
}

.fill-blanks__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 130px;
  padding: 10px 20px;
  box-sizing: border-box;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0d0e15;
  background: var(--neon);
  border: 1px solid var(--neon);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease, opacity 150ms ease;
}

.fill-blanks__submit:not(:disabled):hover {
  background: #33f3ff;
  border-color: #33f3ff;
}

.fill-blanks__submit:focus-visible {
  outline: 2px solid var(--neon);
  outline-offset: 2px;
}

.fill-blanks__submit:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

@media (max-width: 480px) {
  .fill-blanks {
    gap: 14px;
  }

  .fill-blanks__form {
    gap: 14px;
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
}
</style>