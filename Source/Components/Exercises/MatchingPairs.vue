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
      <span class="matching-pairs__type">Associe os pares</span>

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
  --neon: #00f0ff;
  --neon-soft: rgba(0, 240, 255, 0.1);
  --neon-glow: rgba(0, 240, 255, 0.4);
  --magenta: #ff2d78;
  --magenta-glow: rgba(255, 45, 120, 0.35);
  --green: #2bffc6;
  --green-glow: rgba(43, 255, 198, 0.32);
  --surface: #12131c;
  --text: #eafcff;
  --muted: rgba(234, 252, 255, 0.62);

  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  color: var(--text);
}

.matching-pairs__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.matching-pairs__type {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--neon);
  text-shadow: 0 0 10px var(--neon-glow);
}

.matching-pairs__prompt {
  margin: 0;
  font-size: clamp(1.15rem, 2.4vw, 1.45rem);
  font-weight: 700;
  line-height: 1.45;
  color: var(--text);
  text-wrap: balance;
}

.matching-pairs__hint {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--muted);
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
  top: 42px;
  bottom: 0;
  left: 50%;
  width: 1px;
  content: '';
  background: linear-gradient(
    180deg,
    transparent,
    rgba(0, 240, 255, 0.28),
    transparent
  );
  transform: translateX(-50%);
}

.matching-pairs__column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.matching-pairs__column-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.matching-pairs__column-title span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 0.72rem;
  color: var(--neon);
  background: var(--neon-soft);
  border: 1px solid rgba(0, 240, 255, 0.4);
  border-radius: 50%;
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
  min-height: 56px;
  padding: 13px 15px;
  box-sizing: border-box;
  font: inherit;
  font-size: 0.98rem;
  line-height: 1.4;
  color: var(--text);
  text-align: left;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    var(--surface);
  border: 1px solid rgba(0, 240, 255, 0.28);
  border-radius: 12px;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background-color 180ms ease,
    transform 180ms ease,
    opacity 180ms ease;
}

.matching-pairs__item:not(:disabled):hover {
  border-color: var(--neon);
  background:
    linear-gradient(180deg, rgba(0, 240, 255, 0.08), transparent),
    var(--surface);
  box-shadow: 0 0 15px var(--neon-glow);
  transform: translateY(-1px);
}

.matching-pairs__item.is-right.is-target:not(:disabled):hover {
  border-color: var(--magenta);
  background:
    linear-gradient(180deg, rgba(255, 45, 120, 0.1), transparent),
    var(--surface);
  box-shadow: 0 0 15px var(--magenta-glow);
}

.matching-pairs__item:not(:disabled):active {
  transform: translateY(0);
  box-shadow: 0 0 8px var(--neon-glow);
}

.matching-pairs__item:focus-visible {
  outline: 2px solid var(--neon);
  outline-offset: 3px;
}

.matching-pairs__item.is-selected {
  border-color: var(--neon);
  background:
    linear-gradient(90deg, rgba(0, 240, 255, 0.2), rgba(0, 240, 255, 0.04)),
    var(--surface);
  box-shadow:
    0 0 18px var(--neon-glow),
    inset 0 0 18px rgba(0, 240, 255, 0.12);
}

.matching-pairs__item.is-matched {
  border-color: rgba(43, 255, 198, 0.55);
  background:
    linear-gradient(90deg, rgba(43, 255, 198, 0.1), transparent 70%),
    var(--surface);
}

.matching-pairs__item.is-selected.is-matched {
  border-color: var(--neon);
  box-shadow:
    0 0 18px var(--neon-glow),
    inset 0 0 18px rgba(0, 240, 255, 0.12);
}

.matching-pairs__marker {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--neon);
  background: var(--neon-soft);
  border: 1px solid rgba(0, 240, 255, 0.4);
  border-radius: 50%;
}

.matching-pairs__item.is-selected .matching-pairs__marker {
  color: #041014;
  background: var(--neon);
  border-color: var(--neon);
  box-shadow: 0 0 12px var(--neon-glow);
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
  width: 24px;
  height: 24px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--green);
  background: rgba(43, 255, 198, 0.12);
  border: 1px solid rgba(43, 255, 198, 0.5);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--green-glow);
}

.matching-pairs__badge {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 7px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--green);
  background: rgba(43, 255, 198, 0.12);
  border: 1px solid rgba(43, 255, 198, 0.5);
  border-radius: 999px;
  box-shadow: 0 0 10px var(--green-glow);
}

.matching-pairs__item:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  border-color: rgba(0, 240, 255, 0.12);
  box-shadow: none;
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
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--muted);
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
  min-width: 112px;
  padding: 12px 20px;
  box-sizing: border-box;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease,
    opacity 180ms ease;
}

.matching-pairs__clear {
  color: var(--muted);
  background: transparent;
  border: 1px solid rgba(234, 252, 255, 0.2);
}

.matching-pairs__clear:not(:disabled):hover {
  color: #ffffff;
  border-color: var(--magenta);
  box-shadow: 0 0 14px var(--magenta-glow);
  transform: translateY(-1px);
}

.matching-pairs__submit {
  color: #041014;
  background: var(--neon);
  border: 1px solid var(--neon);
  box-shadow: 0 0 18px var(--neon-glow);
}

.matching-pairs__submit:not(:disabled):hover {
  background: #7dfcff;
  box-shadow: 0 0 26px var(--neon-glow);
  transform: translateY(-1px);
}

.matching-pairs__clear:focus-visible,
.matching-pairs__submit:focus-visible {
  outline: 2px solid var(--neon);
  outline-offset: 3px;
}

.matching-pairs__clear:disabled,
.matching-pairs__submit:disabled {
  cursor: not-allowed;
  opacity: 0.4;
  box-shadow: none;
  transform: none;
}

.matching-pairs__empty {
  margin: 0;
  padding: 18px;
  font-size: 0.95rem;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(0, 240, 255, 0.24);
  border-radius: 12px;
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
    min-height: 52px;
    padding: 12px 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .matching-pairs__item,
  .matching-pairs__clear,
  .matching-pairs__submit {
    transition: none;
  }

  .matching-pairs__item:not(:disabled):hover,
  .matching-pairs__clear:not(:disabled):hover,
  .matching-pairs__submit:not(:disabled):hover {
    transform: none;
  }
}
</style>