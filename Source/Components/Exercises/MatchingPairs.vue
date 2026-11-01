<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  question: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit-answer'])

const selectedLeftIndex = ref(null)
const matches = ref({})

function asArray(value) {
  return Array.isArray(value) ? value : null
}

function pairFrom(rawPair) {
  if (Array.isArray(rawPair)) {
    return rawPair.length >= 2
      ? { left: rawPair[0], right: rawPair[1] }
      : null
  }

  if (rawPair && typeof rawPair === 'object') {
    const left =
      rawPair.left ??
      rawPair.leftId ??
      rawPair.term ??
      rawPair.question ??
      rawPair.source ??
      rawPair.key ??
      rawPair.from

    const right =
      rawPair.right ??
      rawPair.rightId ??
      rawPair.definition ??
      rawPair.answer ??
      rawPair.target ??
      rawPair.value ??
      rawPair.to

    if (left !== undefined && right !== undefined) {
      return { left, right }
    }
  }

  return null
}

const pairs = computed(() => {
  const raw =
    props.question?.pairs ??
    props.question?.items ??
    props.question?.matches ??
    props.question?.correctAnswer

  if (raw instanceof Map) {
    return Array.from(raw.entries()).map(([left, right]) => ({ left, right }))
  }

  if (Array.isArray(raw)) {
    return raw.map(pairFrom).filter((pair) => pair !== null)
  }

  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([left, right]) => ({ left, right }))
  }

  return []
})

const explicitLeftItems = computed(() => {
  return (
    asArray(props.question?.leftItems) ??
    asArray(props.question?.left) ??
    asArray(props.question?.terms) ??
    asArray(props.question?.sources)
  )
})

const explicitRightItems = computed(() => {
  return (
    asArray(props.question?.rightItems) ??
    asArray(props.question?.right) ??
    asArray(props.question?.definitions) ??
    asArray(props.question?.targets)
  )
})

const leftItems = computed(() => {
  if (explicitLeftItems.value) return explicitLeftItems.value

  return pairs.value.map((pair) => pair.left)
})

function shuffle(items, seed) {
  const shuffled = [...items]
  let state = seed >>> 0

  function random() {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]

    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = current
  }

  return shuffled
}

function hashString(value) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

const shuffleSeed = computed(() => {
  return hashString(
    pairs.value
      .map((pair) => `${itemLabel(pair.left)}::${itemLabel(pair.right)}`)
      .join('|'),
  )
})

const rightItems = computed(() => {
  if (explicitRightItems.value) return explicitRightItems.value

  return shuffle(
    pairs.value.map((pair) => pair.right),
    shuffleSeed.value,
  )
})

const prompt = computed(() => {
  return (
    props.question?.prompt ??
    props.question?.question ??
    props.question?.instruction ??
    ''
  )
})

const matchedCount = computed(() => Object.keys(matches.value).length)

const canSubmit = computed(() => {
  return (
    leftItems.value.length > 0 &&
    matchedCount.value === leftItems.value.length &&
    leftItems.value.every((_item, index) => matches.value[index] !== undefined)
  )
})

const selectedLeftLabel = computed(() => {
  if (selectedLeftIndex.value === null) return ''

  return itemLabel(leftItems.value[selectedLeftIndex.value])
})

const statusLabel = computed(() => {
  if (!leftItems.value.length) return 'Nenhum par disponível.'

  if (selectedLeftIndex.value !== null) {
    return `Agora escolha o par de “${selectedLeftLabel.value}” na coluna B.`
  }

  if (canSubmit.value) {
    return 'Tudo associado. Confirme para enviar sua resposta.'
  }

  if (matchedCount.value === 0) {
    return 'Selecione um item da coluna A para começar.'
  }

  return `${matchedCount.value} de ${leftItems.value.length} pares associados.`
})

function itemValue(item) {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    if ('id' in item) return item.id
    if ('value' in item) return item.value
    if ('key' in item) return item.key
    if ('label' in item) return item.label
    if ('text' in item) return item.text
  }

  return item
}

function itemLabel(item) {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    return String(
      item.text ??
        item.label ??
        item.value ??
        item.id ??
        item.key ??
        '',
    )
  }

  return String(item ?? '')
}

function letterFor(index) {
  if (index < 26) return String.fromCharCode(65 + index)

  return String(index + 1)
}

function isLeftMatched(index) {
  return matches.value[index] !== undefined
}

function rightOwner(rightIndex) {
  const entry = Object.entries(matches.value).find(([, value]) => {
    return value === rightIndex
  })

  return entry ? Number(entry[0]) : null
}

function rightMatchLabel(rightIndex) {
  const owner = rightOwner(rightIndex)

  return owner === null ? '' : letterFor(owner)
}

function rightAriaLabel(item, rightIndex) {
  const owner = rightOwner(rightIndex)

  return owner === null
    ? itemLabel(item)
    : `${itemLabel(item)}, associado a ${letterFor(owner)}`
}

function selectLeft(index) {
  if (props.disabled) return

  selectedLeftIndex.value = selectedLeftIndex.value === index ? null : index
}

function selectRight(rightIndex) {
  if (props.disabled || selectedLeftIndex.value === null) return

  const nextMatches = { ...matches.value }

  for (const leftIndex of Object.keys(nextMatches)) {
    if (nextMatches[leftIndex] === rightIndex) {
      delete nextMatches[leftIndex]
    }
  }

  nextMatches[selectedLeftIndex.value] = rightIndex
  matches.value = nextMatches
  selectedLeftIndex.value = null
}

function clearMatches() {
  if (props.disabled) return

  matches.value = {}
  selectedLeftIndex.value = null
}

function submitAnswer() {
  if (props.disabled || !canSubmit.value) return

  const answer = leftItems.value.map((leftItem, leftIndex) => {
    const rightIndex = matches.value[leftIndex]

    return {
      left: itemValue(leftItem),
      right: itemValue(rightItems.value[rightIndex]),
    }
  })

  emit('submit-answer', answer)
}

watch(
  () => props.question,
  () => {
    matches.value = {}
    selectedLeftIndex.value = null
  },
)
</script>

<template>
  <section class="matching-pairs">
    <header class="matching-pairs__header">
      <span class="matching-pairs__type">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1 1" />
          <path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1-1" />
        </svg>
        Associe os pares
      </span>

      <h2 v-if="prompt" class="matching-pairs__prompt">
        {{ prompt }}
      </h2>

      <p class="matching-pairs__hint">
        Selecione um item da coluna A e depois o item correspondente na
        coluna B.
      </p>
    </header>

    <p v-if="!leftItems.length" class="matching-pairs__empty">
      Nenhum par disponível.
    </p>

    <template v-else>
      <div class="matching-pairs__board">
        <div
          class="matching-pairs__column"
          role="group"
          aria-label="Coluna A"
        >
          <h3 class="matching-pairs__column-title">
            <span aria-hidden="true">A</span>
            Coluna A
          </h3>

          <ul class="matching-pairs__list">
            <li
              v-for="(item, index) in leftItems"
              :key="`left-${index}`"
              class="matching-pairs__row"
            >
              <button
                type="button"
                class="matching-pairs__item is-left"
                :class="{
                  'is-selected': selectedLeftIndex === index,
                  'is-matched': isLeftMatched(index),
                }"
                :disabled="disabled"
                :aria-pressed="selectedLeftIndex === index"
                @click="selectLeft(index)"
              >
                <span class="matching-pairs__marker" aria-hidden="true">
                  {{ letterFor(index) }}
                </span>

                <span class="matching-pairs__label">{{ itemLabel(item) }}</span>

                <span
                  v-if="isLeftMatched(index)"
                  class="matching-pairs__check"
                  aria-hidden="true"
                >
                  ✓
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div
          class="matching-pairs__column"
          role="group"
          aria-label="Coluna B"
        >
          <h3 class="matching-pairs__column-title">
            <span aria-hidden="true">B</span>
            Coluna B
          </h3>

          <ul class="matching-pairs__list">
            <li
              v-for="(item, index) in rightItems"
              :key="`right-${index}`"
              class="matching-pairs__row"
            >
              <button
                type="button"
                class="matching-pairs__item is-right"
                :class="{
                  'is-target': selectedLeftIndex !== null,
                  'is-matched': rightOwner(index) !== null,
                }"
                :disabled="disabled"
                :aria-pressed="rightOwner(index) !== null"
                :aria-label="rightAriaLabel(item, index)"
                @click="selectRight(index)"
              >
                <span class="matching-pairs__label">{{ itemLabel(item) }}</span>

                <span
                  v-if="rightMatchLabel(index)"
                  class="matching-pairs__badge"
                  aria-hidden="true"
                >
                  {{ rightMatchLabel(index) }}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <footer class="matching-pairs__actions">
        <p class="matching-pairs__status" aria-live="polite">
          {{ statusLabel }}
        </p>

        <div class="matching-pairs__buttons">
          <button
            type="button"
            class="matching-pairs__clear"
            :disabled="disabled || matchedCount === 0"
            @click="clearMatches"
          >
            Limpar
          </button>

          <button
            type="button"
            class="matching-pairs__submit"
            :disabled="disabled || !canSubmit"
            @click="submitAnswer"
          >
            Confirmar
          </button>
        </div>
      </footer>
    </template>
  </section>
</template>

<style scoped>
.matching-pairs {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  color: var(--color-ink);
}

.matching-pairs__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.matching-pairs__type {
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

.matching-pairs__type svg {
  width: 14px;
  height: 14px;
}

.matching-pairs__prompt {
  margin: 0;
  font-size: clamp(1.15rem, 2.4vw, 1.5rem);
  font-weight: 800;
  line-height: 1.4;
  color: var(--color-ink);
  text-wrap: balance;
}

.matching-pairs__hint {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-ink-muted);
}

.matching-pairs__board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(18px, 5vw, 56px);
  align-items: start;
}

.matching-pairs__board::before {
  position: absolute;
  top: 44px;
  bottom: 0;
  left: 50%;
  width: 2px;
  content: '';
  background: var(--color-border-soft);
  transform: translateX(-50%);
}

.matching-pairs__column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.matching-pairs__column-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.matching-pairs__column-title span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border: 2px solid var(--color-cyan);
  border-radius: var(--radius-pill);
}

.matching-pairs__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.matching-pairs__row {
  min-width: 0;
}

.matching-pairs__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 58px;
  padding: 13px 16px;
  font: inherit;
  font-size: 0.96rem;
  line-height: 1.45;
  color: var(--color-ink);
  text-align: left;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease, opacity 160ms ease;
}

.matching-pairs__item:not(:disabled):hover {
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan);
  transform: translateY(-2px);
}

.matching-pairs__item:not(:disabled):active {
  background: var(--color-cyan);
  transform: translateY(1px);
}

.matching-pairs__item:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.matching-pairs__item.is-selected {
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan-strong);
}

.matching-pairs__item.is-matched {
  background: var(--color-mint-soft);
  border-color: var(--color-mint);
}

.matching-pairs__item.is-selected.is-matched {
  border-color: var(--color-cyan-strong);
}

.matching-pairs__marker {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border: 2px solid var(--color-cyan);
  border-radius: var(--radius-pill);
}

.matching-pairs__item.is-selected .matching-pairs__marker {
  color: var(--color-cyan-ink);
  background: var(--color-cyan);
  border-color: var(--color-cyan-strong);
}

.matching-pairs__item.is-matched .matching-pairs__marker {
  color: var(--color-mint-strong);
  background: var(--color-surface);
  border-color: var(--color-mint);
}

.matching-pairs__label {
  flex: 1 1 auto;
  min-width: 0;
}

.matching-pairs__check {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--color-mint-strong);
  background: var(--color-surface);
  border: 2px solid var(--color-mint);
  border-radius: var(--radius-pill);
}

.matching-pairs__badge {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--color-mint-strong);
  background: var(--color-surface);
  border: 2px solid var(--color-mint);
  border-radius: var(--radius-pill);
}

.matching-pairs__item:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  border-color: var(--color-border-soft);
  transform: none;
}

.matching-pairs__item.is-selected:disabled,
.matching-pairs__item.is-matched:disabled {
  opacity: 0.75;
}

.matching-pairs__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 4px;
}

.matching-pairs__status {
  flex: 1 1 220px;
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.55;
  color: var(--color-ink-muted);
}

.matching-pairs__buttons {
  display: flex;
  gap: 10px;
}

.matching-pairs__clear,
.matching-pairs__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 12px 22px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease, opacity 160ms ease;
}

.matching-pairs__clear {
  color: var(--color-ink-soft);
  background: var(--color-surface);
  border: 2px solid var(--color-border);
}

.matching-pairs__clear:not(:disabled):hover {
  color: var(--color-coral-strong);
  background: var(--color-coral-soft);
  border-color: var(--color-coral);
  transform: translateY(-1px);
}

.matching-pairs__clear:not(:disabled):active {
  background: var(--color-coral);
  transform: translateY(1px);
}

.matching-pairs__submit {
  color: var(--color-primary-ink);
  background: var(--color-primary);
  border: 2px solid var(--color-primary-border);
}

.matching-pairs__submit:not(:disabled):hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-active);
  transform: translateY(-1px);
}

.matching-pairs__submit:not(:disabled):active {
  background: var(--color-primary-active);
  transform: translateY(1px);
}

.matching-pairs__clear:focus-visible,
.matching-pairs__submit:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.matching-pairs__clear:disabled,
.matching-pairs__submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  color: var(--color-ink-faint);
  background: var(--color-surface-soft);
  border-color: var(--color-border-soft);
}

.matching-pairs__empty {
  margin: 0;
  padding: 18px;
  font-size: 0.95rem;
  color: var(--color-ink-muted);
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-card);
}

@media (max-width: 720px) {
  .matching-pairs__board {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .matching-pairs__board::before {
    display: none;
  }

  .matching-pairs__actions {
    align-items: stretch;
  }

  .matching-pairs__buttons {
    width: 100%;
  }

  .matching-pairs__clear,
  .matching-pairs__submit {
    flex: 1 1 0;
  }
}

@media (max-width: 480px) {
  .matching-pairs {
    gap: 18px;
  }

  .matching-pairs__item {
    min-height: 54px;
    padding: 12px 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .matching-pairs__item,
  .matching-pairs__clear,
  .matching-pairs__submit {
    transition: none;
  }

  .matching-pairs__item:not(:disabled):hover,
  .matching-pairs__item:not(:disabled):active,
  .matching-pairs__clear:not(:disabled):hover,
  .matching-pairs__clear:not(:disabled):active,
  .matching-pairs__submit:not(:disabled):hover,
  .matching-pairs__submit:not(:disabled):active {
    transform: none;
  }
}
</style>