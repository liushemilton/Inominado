<script setup>
import { computed, reactive } from 'vue'

import ChainBuilder from '../Components/Exercises/ChainBuilder.vue'
import FillBlanks from '../Components/Exercises/FillBlanks.vue'
import FunctionalGroupFinder from '../Components/Exercises/FunctionalGroupFinder.vue'
import MatchingPairs from '../Components/Exercises/MatchingPairs.vue'
import MultipleChoise from '../Components/Exercises/MultipleChoise.vue'
import NomenclatureErrorSpotter from '../Components/Exercises/NomenclatureErrorSpotter.vue'
import PropertyRanking from '../Components/Exercises/PropertyRanking.vue'
import ReactionPathSelector from '../Components/Exercises/ReactionPathSelector.vue'
import TrueOrFalse from '../Components/Exercises/TrueOrFalse.vue'
import FeedbackBox from '../Components/Game/FeedbackBox.vue'
import { TEST_EXERCISES } from '../Data/ExercisesTest/index.js'
import { checkAnswer } from '../Logic/AswerChecker.js'

const emit = defineEmits(['back'])

const COMPONENTS = Object.freeze({
  ChainBuilder,
  FillBlanks,
  FunctionalGroupFinder,
  MatchingPairs,
  MultipleChoise,
  NomenclatureErrorSpotter,
  PropertyRanking,
  ReactionPathSelector,
  TrueOrFalse,
})

const attempts = reactive({})
const feedbacks = reactive({})

const groups = computed(() => {
  const grouped = new Map()

  for (const exercise of TEST_EXERCISES) {
    if (!grouped.has(exercise.group)) grouped.set(exercise.group, [])

    grouped.get(exercise.group).push(exercise)
  }

  return Array.from(grouped, ([title, exercises]) => ({ title, exercises }))
})

const answeredCount = computed(() => Object.keys(feedbacks).length)

function componentFor(exercise) {
  return COMPONENTS[exercise.component] ?? null
}

function attemptFor(exercise) {
  return attempts[exercise.id] ?? 0
}

function feedbackFor(exercise) {
  return feedbacks[exercise.id] ?? null
}

function hasAnswered(exercise) {
  return feedbackFor(exercise) !== null
}

function handleSubmit(exercise, answer) {
  const correctAnswer =
    exercise.question.correctAnswer ?? exercise.question.pairs
  let isCorrect = false

  try {
    isCorrect = checkAnswer(answer, correctAnswer, exercise.checkerType)
  } catch (error) {
    console.error(
      `[TestAreaView] Não foi possível validar "${exercise.id}":`,
      error,
    )
  }

  feedbacks[exercise.id] = {
    status: isCorrect ? 'correct' : 'incorrect',
    isCorrect,
    message: isCorrect ? 'Resposta correta!' : 'Resposta incorreta.',
    explanation: exercise.question.explanation ?? '',
    answer,
    correctAnswer,
  }
}

function resetExercise(exercise) {
  attempts[exercise.id] = attemptFor(exercise) + 1
  delete feedbacks[exercise.id]
}

function formatScalar(value) {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Verdadeiro' : 'Falso'

  if (value && typeof value === 'object') {
    return String(value.text ?? value.label ?? value.value ?? value.id ?? '—')
  }

  return String(value)
}

function formatAnswer(value) {
  if (value === undefined || value === null || value === '') return '—'

  if (Array.isArray(value)) {
    return value.map((item) => formatAnswer(item)).join(' · ')
  }

  if (typeof value === 'object') {
    if ('left' in value && 'right' in value) {
      return `${formatScalar(value.left)} → ${formatScalar(value.right)}`
    }

    return Object.values(value).map((item) => formatScalar(item)).join(' · ')
  }

  return formatScalar(value)
}

function answerLabel(exercise, value) {
  const options = exercise.question.options

  if (!Array.isArray(options) || Array.isArray(value)) {
    return formatAnswer(value)
  }

  const match = options.find((option) => {
    const candidate =
      option && typeof option === 'object'
        ? (option.id ?? option.value ?? option.key)
        : option

    return String(candidate) === String(value)
  })

  if (!match || typeof match !== 'object') return formatAnswer(value)

  const id = match.id ?? match.value ?? ''
  const text = match.text ?? match.label ?? ''

  return [id, text].filter(Boolean).join(' — ')
}
</script>

<template>
  <main class="test-area">
    <div class="test-area__shell">
      <header class="test-area__header">
        <button type="button" class="test-area__back" @click="emit('back')">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Roadmap
        </button>

        <div class="test-area__heading">
          <span class="test-area__eyebrow">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M10 2v7.31L4.35 19.5a1 1 0 0 0 .86 1.5h13.58a1 1 0 0 0 .86-1.5L14 9.31V2h-4z" />
              <path d="M8 6h8" />
            </svg>
            Ambiente de testes
          </span>
          <h1 class="test-area__title">Área de testes dos exercícios</h1>
          <p class="test-area__subtitle">
            Uma questão de exemplo para cada tipo de exercício. Responda e
            confira o feedback para validar a renderização e a correção.
          </p>
        </div>

        <p class="test-area__progress" aria-live="polite">
          <strong>{{ answeredCount }}</strong> de
          <strong>{{ TEST_EXERCISES.length }}</strong> exercícios respondidos
        </p>
      </header>

      <section
        v-for="group in groups"
        :key="group.title"
        class="test-area__group"
        :aria-label="group.title"
      >
        <div class="test-area__group-heading">
          <h2 class="test-area__group-title">{{ group.title }}</h2>
          <span class="test-area__group-count">
            {{ group.exercises.length }}
            {{ group.exercises.length === 1 ? 'exercício' : 'exercícios' }}
          </span>
        </div>

        <article
          v-for="exercise in group.exercises"
          :key="exercise.id"
          class="test-area__card"
          :class="{
            'is-correct': feedbackFor(exercise)?.isCorrect === true,
            'is-incorrect': feedbackFor(exercise)?.isCorrect === false,
          }"
        >
          <header class="test-area__card-header">
            <div class="test-area__card-title-wrap">
              <span class="test-area__card-index" aria-hidden="true">
                {{ TEST_EXERCISES.indexOf(exercise) + 1 }}
              </span>
              <h3 class="test-area__card-title">{{ exercise.label }}</h3>
            </div>

            <code class="test-area__card-type">{{ exercise.component }}</code>
          </header>

          <component
            :is="componentFor(exercise)"
            v-if="componentFor(exercise)"
            :key="`${exercise.id}-${attemptFor(exercise)}`"
            :question="exercise.question"
            :disabled="hasAnswered(exercise)"
            @submit-answer="handleSubmit(exercise, $event)"
          />

          <p v-else class="test-area__missing">
            Componente não encontrado: <strong>{{ exercise.component }}</strong>
          </p>

          <div v-if="feedbackFor(exercise)" class="test-area__feedback">
            <FeedbackBox
              :status="feedbackFor(exercise).status"
              :message="feedbackFor(exercise).message"
              :explanation="feedbackFor(exercise).explanation"
            />

            <div class="test-area__answers">
              <p class="test-area__answer">
                <span>Sua resposta</span>
                <strong>
                  {{ answerLabel(exercise, feedbackFor(exercise).answer) }}
                </strong>
              </p>

              <p
                v-if="!feedbackFor(exercise).isCorrect"
                class="test-area__answer is-correct"
              >
                <span>Resposta correta</span>
                <strong>
                  {{
                    answerLabel(
                      exercise,
                      feedbackFor(exercise).correctAnswer,
                    )
                  }}
                </strong>
              </p>
            </div>

            <button
              type="button"
              class="test-area__retry"
              @click="resetExercise(exercise)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
              Tentar novamente
            </button>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>

<style scoped>
.test-area {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  padding: var(--page-padding);
  color: var(--color-ink);
  background: var(--color-bg);
}

.test-area__shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: var(--content-width);
}

.test-area__header {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: clamp(20px, 3vw, 30px);
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
}

.test-area__back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-ink-muted);
  cursor: pointer;
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, border-color 160ms ease,
    color 160ms ease, transform 160ms ease;
}

.test-area__back svg {
  width: 14px;
  height: 14px;
}

.test-area__back:hover {
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan);
  transform: translateY(-1px);
}

.test-area__heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-area__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 12px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-lilac-strong);
  background: var(--color-lilac-soft);
  border: 2px solid var(--color-lilac);
  border-radius: var(--radius-pill);
}

.test-area__eyebrow svg {
  width: 14px;
  height: 14px;
}

.test-area__title {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

.test-area__subtitle {
  max-width: 62ch;
  margin: 0;
  font-size: 0.94rem;
  line-height: 1.6;
  color: var(--color-ink-muted);
}

.test-area__progress {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-ink-muted);
}

.test-area__progress strong {
  font-family: var(--font-mono);
  color: var(--color-cyan-strong);
}

.test-area__group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.test-area__group-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 4px;
}

.test-area__group-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--color-ink);
}

.test-area__group-count {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.test-area__card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: clamp(18px, 2.6vw, 28px);
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
  transition: border-color 160ms ease;
}

.test-area__card.is-correct {
  border-color: var(--color-mint);
}

.test-area__card.is-incorrect {
  border-color: var(--color-coral);
}

.test-area__card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--color-border-soft);
}

.test-area__card-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.test-area__card-index {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border: 2px solid var(--color-cyan);
  border-radius: var(--radius-pill);
}

.test-area__card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-ink);
}

.test-area__card-type {
  padding: 5px 10px;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-ink-muted);
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-pill);
}

.test-area__missing {
  margin: 0;
  padding: 16px;
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-field);
}

.test-area__feedback {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 4px;
}

.test-area__answers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-area__answer {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  font-size: 0.86rem;
  color: var(--color-ink-muted);
}

.test-area__answer span {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.test-area__answer strong {
  color: var(--color-ink);
}

.test-area__answer.is-correct strong {
  color: var(--color-mint-strong);
}

.test-area__retry {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-ink-soft);
  cursor: pointer;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, border-color 160ms ease,
    color 160ms ease, transform 160ms ease;
}

.test-area__retry svg {
  width: 14px;
  height: 14px;
}

.test-area__retry:hover {
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan);
  transform: translateY(-1px);
}

.test-area__back:focus-visible,
.test-area__retry:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

@media (max-width: 600px) {
  .test-area {
    padding: 14px 12px 22px;
  }

  .test-area__shell {
    gap: 18px;
  }

  .test-area__header,
  .test-area__card {
    border-radius: 14px;
  }

  .test-area__card-header {
    align-items: flex-start;
  }

  .test-area__retry {
    width: 100%;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .test-area__back,
  .test-area__card,
  .test-area__retry {
    transition: none;
  }

  .test-area__back:hover,
  .test-area__retry:hover {
    transform: none;
  }
}
</style>
