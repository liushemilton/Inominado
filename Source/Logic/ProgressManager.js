/**
 * Regras de progresso e adaptação.
 *
 * Este módulo é puro: não depende de Vue, de `localStorage` ou de dados da
 * aplicação. Ele recebe o estado persistido de uma fase e devolve um novo
 * estado, sem mutar a entrada.
 *
 * O progresso é organizado em três níveis:
 *
 * ```js
 * phases[phaseId] = {
 *   subtopics[subtopicId] = {
 *     questions[questionId] = {
 *       mastery, attempts, correct, wrong, nextReviewAt, ...
 *     },
 *   },
 * }
 * ```
 *
 * A "maestria" (`mastery`) vai de 0 a 100 e combina acertos, dificuldade e
 * cobertura das questões do subtópico. Ela alimenta o desbloqueio sequencial
 * dos subtópicos e a escolha de dificuldade feita pelo `QuestionSelector`.
 */

export const PROGRESS_SCHEMA_VERSION = 1

export const MIN_MASTERY = 0
export const MAX_MASTERY = 100

export const MIN_DIFFICULTY = 1
export const MAX_DIFFICULTY = 5

export const MINUTE_MS = 60 * 1000
export const DAY_MS = 24 * 60 * MINUTE_MS

/**
 * Intervalos de revisão (em milissegundos) usados após acertos consecutivos.
 * O índice 0 representa "revisar imediatamente".
 */
export const DEFAULT_REVIEW_INTERVALS_MS = Object.freeze([
  0,
  10 * MINUTE_MS,
  DAY_MS,
  3 * DAY_MS,
  7 * DAY_MS,
  14 * DAY_MS,
  30 * DAY_MS,
])

/**
 * Configuração padrão do modelo adaptativo.
 *
 * - `masteryThreshold`: maestria mínima para concluir um subtópico.
 * - `minAttemptsForMastery`: tentativas mínimas antes de concluir.
 * - `expectedQuestionsPerSubtopic`: cobertura esperada; `0` infere pelo banco.
 * - `correctGain`: ganho base de maestria por acerto.
 * - `difficultyGain`: ganho extra por dificuldade da questão.
 * - `wrongLoss`: perda de maestria por erro.
 * - `wrongRetryMs`: intervalo até a próxima revisão após um erro.
 */
export const DEFAULT_ADAPTIVE_CONFIG = Object.freeze({
  masteryThreshold: 80,
  minAttemptsForMastery: 3,
  expectedQuestionsPerSubtopic: 0,
  reviewIntervals: DEFAULT_REVIEW_INTERVALS_MS,
  correctGain: 0.4,
  difficultyGain: 0.1,
  wrongLoss: 0.5,
  wrongRetryMs: 5 * MINUTE_MS,
  easeDefault: 2.3,
  easeMin: 1.3,
  easeMax: 2.8,
  easeGain: 0.1,
  easeLoss: 0.2,
})

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function toKey(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value !== 'string') return null

  const key = value.trim()

  return key === '' ? null : key
}

/**
 * @param {unknown} value
 * @param {number} [fallback]
 * @returns {number}
 */
export function toSafeNumber(value, fallback = 0) {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

/**
 * @param {unknown} value
 * @param {number} [fallback]
 * @returns {number}
 */
export function toNonNegativeNumber(value, fallback = 0) {
  return Math.max(0, toSafeNumber(value, fallback))
}

/**
 * @param {unknown} value
 * @param {number} [fallback]
 * @returns {number}
 */
export function toNonNegativeInteger(value, fallback = 0) {
  return Math.floor(toNonNegativeNumber(value, fallback))
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
export function toTimestamp(value) {
  const number = Number(value)

  return Number.isFinite(number) && number > 0 ? Math.floor(number) : null
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * @param {unknown} value
 * @param {number} [fallback]
 * @returns {number}
 */
export function normalizeDifficulty(value, fallback = 3) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'facil' || normalized === 'fácil' || normalized === 'easy') {
      return 1
    }

    if (normalized === 'medio' || normalized === 'médio' || normalized === 'medium') {
      return 3
    }

    if (
      normalized === 'dificil' ||
      normalized === 'difícil' ||
      normalized === 'hard'
    ) {
      return 5
    }
  }

  const number = Math.round(toSafeNumber(value, fallback))

  return clamp(number, MIN_DIFFICULTY, MAX_DIFFICULTY)
}

/**
 * @param {unknown} options
 * @returns {object}
 */
export function resolveAdaptiveConfig(options = {}) {
  const source = isPlainObject(options) ? options : {}
  const intervals = Array.isArray(source.reviewIntervals)
    ? source.reviewIntervals
        .map((value) => toNonNegativeInteger(value))
        .filter((value, index, list) => index === 0 || value > 0)
    : null

  return {
    ...DEFAULT_ADAPTIVE_CONFIG,
    ...source,
    masteryThreshold: clamp(
      toSafeNumber(source.masteryThreshold, DEFAULT_ADAPTIVE_CONFIG.masteryThreshold),
      MIN_MASTERY,
      MAX_MASTERY,
    ),
    minAttemptsForMastery: toNonNegativeInteger(
      source.minAttemptsForMastery,
      DEFAULT_ADAPTIVE_CONFIG.minAttemptsForMastery,
    ),
    expectedQuestionsPerSubtopic: toNonNegativeInteger(
      source.expectedQuestionsPerSubtopic,
      DEFAULT_ADAPTIVE_CONFIG.expectedQuestionsPerSubtopic,
    ),
    reviewIntervals:
      intervals && intervals.length > 0
        ? intervals
        : DEFAULT_ADAPTIVE_CONFIG.reviewIntervals,
    correctGain: clamp(toSafeNumber(source.correctGain, DEFAULT_ADAPTIVE_CONFIG.correctGain), 0, 1),
    difficultyGain: clamp(
      toSafeNumber(source.difficultyGain, DEFAULT_ADAPTIVE_CONFIG.difficultyGain),
      0,
      1,
    ),
    wrongLoss: clamp(toSafeNumber(source.wrongLoss, DEFAULT_ADAPTIVE_CONFIG.wrongLoss), 0, 1),
    wrongRetryMs: toNonNegativeInteger(
      source.wrongRetryMs,
      DEFAULT_ADAPTIVE_CONFIG.wrongRetryMs,
    ),
    easeDefault: toSafeNumber(source.easeDefault, DEFAULT_ADAPTIVE_CONFIG.easeDefault),
    easeMin: toSafeNumber(source.easeMin, DEFAULT_ADAPTIVE_CONFIG.easeMin),
    easeMax: toSafeNumber(source.easeMax, DEFAULT_ADAPTIVE_CONFIG.easeMax),
    easeGain: toNonNegativeNumber(source.easeGain, DEFAULT_ADAPTIVE_CONFIG.easeGain),
    easeLoss: toNonNegativeNumber(source.easeLoss, DEFAULT_ADAPTIVE_CONFIG.easeLoss),
  }
}

/**
 * Estado inicial de uma questão.
 *
 * @returns {object}
 */
export function createEmptyQuestionState() {
  return {
    id: '',
    attempts: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    bestStreak: 0,
    lastResult: null,
    lastSeenAt: null,
    lastCorrectAt: null,
    nextReviewAt: null,
    intervalIndex: 0,
    intervalMs: 0,
    ease: DEFAULT_ADAPTIVE_CONFIG.easeDefault,
    difficulty: 3,
    mastery: 0,
  }
}

/**
 * Estado inicial de um subtópico.
 *
 * @returns {object}
 */
export function createEmptySubtopicState() {
  return {
    id: '',
    attempts: 0,
    correct: 0,
    wrong: 0,
    answeredCount: 0,
    streak: 0,
    bestStreak: 0,
    lastSeenAt: null,
    lastCorrectAt: null,
    nextReviewAt: null,
    mastery: 0,
    difficulty: MIN_DIFFICULTY,
    completed: false,
    completedAt: null,
    questions: {},
  }
}

/**
 * Normaliza o estado de uma questão.
 *
 * @param {unknown} raw
 * @param {unknown} [id]
 * @returns {object}
 */
export function normalizeQuestionState(raw, id) {
  const source = isPlainObject(raw) ? raw : {}
  const resolvedId = toKey(source.id) ?? toKey(id) ?? ''

  const correct = toNonNegativeInteger(source.correct ?? source.correctCount)
  const wrong = toNonNegativeInteger(source.wrong ?? source.wrongCount)
  const attempts = Math.max(toNonNegativeInteger(source.attempts), correct + wrong)

  const streak = Math.min(toNonNegativeInteger(source.streak), attempts)
  const bestStreak = Math.max(streak, toNonNegativeInteger(source.bestStreak))

  const intervalIndex = toNonNegativeInteger(source.intervalIndex)
  const lastResult =
    typeof source.lastResult === 'boolean' ? source.lastResult : null

  return {
    id: resolvedId,
    attempts,
    correct,
    wrong,
    streak,
    bestStreak,
    lastResult,
    lastSeenAt: toTimestamp(source.lastSeenAt),
    lastCorrectAt: toTimestamp(source.lastCorrectAt),
    nextReviewAt: toTimestamp(source.nextReviewAt),
    intervalIndex,
    intervalMs: toNonNegativeInteger(source.intervalMs),
    ease: clamp(
      toSafeNumber(source.ease, DEFAULT_ADAPTIVE_CONFIG.easeDefault),
      DEFAULT_ADAPTIVE_CONFIG.easeMin,
      DEFAULT_ADAPTIVE_CONFIG.easeMax,
    ),
    difficulty: normalizeDifficulty(source.difficulty),
    mastery: clamp(toSafeNumber(source.mastery), MIN_MASTERY, MAX_MASTERY),
  }
}

/**
 * Soma as estatísticas das questões de um subtópico.
 *
 * @param {object} questions
 * @returns {{ attempts: number, correct: number, wrong: number, answeredCount: number }}
 */
function summarizeQuestionStates(questions) {
  let attempts = 0
  let correct = 0
  let wrong = 0
  let answeredCount = 0

  for (const question of Object.values(questions)) {
    const questionAttempts = toNonNegativeInteger(question?.attempts)

    attempts += questionAttempts
    correct += toNonNegativeInteger(question?.correct)
    wrong += toNonNegativeInteger(question?.wrong)

    if (questionAttempts > 0) answeredCount += 1
  }

  return { attempts, correct, wrong, answeredCount }
}

/**
 * Menor `nextReviewAt` entre as questões respondidas.
 *
 * @param {object} questions
 * @returns {number | null}
 */
function nextReviewFromQuestions(questions) {
  let next = null

  for (const question of Object.values(questions)) {
    if (toNonNegativeInteger(question?.attempts) === 0) continue

    const value = toTimestamp(question?.nextReviewAt)

    if (value === null) continue
    if (next === null || value < next) next = value
  }

  return next
}

/**
 * Calcula a maestria de um subtópico a partir das questões.
 *
 * A média é ponderada por tentativas e reduzida pela cobertura das questões
 * conhecidas. Quando `expectedQuestionCount` não é informado, considera que
 * todas as questões rastreadas foram cobertas.
 *
 * @param {object} subtopicState
 * @param {object} [options]
 * @param {number} [options.expectedQuestionCount]
 * @returns {number}
 */
export function computeSubtopicMastery(subtopicState, options = {}) {
  const state = isPlainObject(subtopicState) ? subtopicState : {}
  const questions = isPlainObject(state.questions) ? state.questions : {}
  const answered = Object.values(questions).filter((question) => {
    return toNonNegativeInteger(question?.attempts) > 0
  })

  if (answered.length === 0) {
    return clamp(toSafeNumber(state.mastery), MIN_MASTERY, MAX_MASTERY)
  }

  let weightedMastery = 0
  let totalWeight = 0

  for (const question of answered) {
    const attempts = toNonNegativeInteger(question?.attempts)
    const weight = 1 + Math.min(attempts, 3) * 0.25

    weightedMastery += clamp(toSafeNumber(question?.mastery), 0, 100) * weight
    totalWeight += weight
  }

  const average = totalWeight > 0 ? weightedMastery / totalWeight : 0
  const expected = toNonNegativeInteger(options.expectedQuestionCount)
  const coverage = expected > 0 ? Math.min(1, answered.length / expected) : 1

  return Math.round(clamp(average * coverage, MIN_MASTERY, MAX_MASTERY))
}

/**
 * Normaliza o estado de um subtópico.
 *
 * @param {unknown} raw
 * @param {unknown} [id]
 * @returns {object}
 */
export function normalizeSubtopicState(raw, id) {
  const source = isPlainObject(raw) ? raw : {}
  const resolvedId = toKey(source.id) ?? toKey(id) ?? ''

  const questions = {}

  if (isPlainObject(source.questions)) {
    for (const [questionId, question] of Object.entries(source.questions)) {
      const key = toKey(questionId) ?? toKey(question?.id)

      if (key) questions[key] = normalizeQuestionState(question, key)
    }
  }

  const summary = summarizeQuestionStates(questions)
  const attempts = Math.max(toNonNegativeInteger(source.attempts), summary.attempts)
  const correct = Math.max(toNonNegativeInteger(source.correct), summary.correct)
  const wrong = Math.max(toNonNegativeInteger(source.wrong), summary.wrong)

  const state = {
    id: resolvedId,
    attempts,
    correct,
    wrong,
    answeredCount: Math.max(
      toNonNegativeInteger(source.answeredCount),
      summary.answeredCount,
    ),
    streak: Math.min(toNonNegativeInteger(source.streak), attempts),
    bestStreak: 0,
    lastSeenAt: toTimestamp(source.lastSeenAt),
    lastCorrectAt: toTimestamp(source.lastCorrectAt),
    nextReviewAt:
      toTimestamp(source.nextReviewAt) ?? nextReviewFromQuestions(questions),
    mastery: 0,
    difficulty: normalizeDifficulty(source.difficulty),
    completed: source.completed === true,
    completedAt: toTimestamp(source.completedAt),
    questions,
  }

  state.bestStreak = Math.max(
    state.streak,
    toNonNegativeInteger(source.bestStreak),
  )

  state.mastery =
    source.mastery === undefined || source.mastery === null
      ? computeSubtopicMastery(state)
      : clamp(toSafeNumber(source.mastery), MIN_MASTERY, MAX_MASTERY)

  if (source.difficulty === undefined || source.difficulty === null) {
    state.difficulty = computeAdaptiveDifficulty(
      state.mastery,
      state.attempts > 0 ? state.correct / state.attempts : 0,
    )
  }

  return state
}

/**
 * Normaliza um mapa de subtópicos.
 *
 * @param {unknown} raw
 * @returns {Record<string, object>}
 */
export function normalizeSubtopicMap(raw) {
  const source = isPlainObject(raw) ? raw : {}
  const result = {}

  for (const [subtopicId, subtopic] of Object.entries(source)) {
    const key = toKey(subtopicId) ?? toKey(subtopic?.id)

    if (key) result[key] = normalizeSubtopicState(subtopic, key)
  }

  return result
}

/**
 * Calcula a nova maestria de uma questão após uma resposta.
 *
 * @param {number} previousMastery
 * @param {boolean} isCorrect
 * @param {number} difficulty
 * @param {object} [config]
 * @returns {number}
 */
export function computeQuestionMastery(
  previousMastery,
  isCorrect,
  difficulty,
  config = {},
) {
  const rules = resolveAdaptiveConfig(config)
  const previous = clamp(toSafeNumber(previousMastery), MIN_MASTERY, MAX_MASTERY)
  const level = normalizeDifficulty(difficulty)
  const difficultyFactor = (level - MIN_DIFFICULTY) / (MAX_DIFFICULTY - MIN_DIFFICULTY)

  const alpha = isCorrect
    ? clamp(rules.correctGain + difficultyFactor * rules.difficultyGain, 0, 0.95)
    : clamp(rules.wrongLoss, 0, 0.95)

  const target = isCorrect ? MAX_MASTERY : MIN_MASTERY
  const nextMastery = previous + (target - previous) * alpha

  return Math.round(clamp(nextMastery, MIN_MASTERY, MAX_MASTERY))
}

/**
 * Dificuldade recomendada a partir da maestria e da precisão.
 *
 * @param {number} mastery
 * @param {number} [accuracy] 0 a 1.
 * @returns {number} 1 a 5.
 */
export function computeAdaptiveDifficulty(mastery, accuracy = 0) {
  const value = clamp(toSafeNumber(mastery), MIN_MASTERY, MAX_MASTERY)

  let difficulty = 1

  if (value >= 85) difficulty = 5
  else if (value >= 65) difficulty = 4
  else if (value >= 45) difficulty = 3
  else if (value >= 25) difficulty = 2

  if (toSafeNumber(accuracy) < 0.5 && difficulty > 1) difficulty -= 1

  return clamp(difficulty, MIN_DIFFICULTY, MAX_DIFFICULTY)
}

/**
 * @param {object} answer
 * @returns {boolean}
 */
function resolveIsCorrect(answer) {
  if (typeof answer?.isCorrect === 'boolean') return answer.isCorrect
  if (typeof answer?.correct === 'boolean') return answer.correct

  return false
}

/**
 * Aplica uma resposta ao estado de uma questão.
 *
 * @param {unknown} state
 * @param {object} answer
 * @param {object} [config]
 * @returns {object}
 */
export function applyAnswerToQuestionState(state, answer = {}, config = {}) {
  const rules = resolveAdaptiveConfig(config)
  const source = normalizeQuestionState(state, answer.questionId)
  const isCorrect = resolveIsCorrect(answer)
  const at = toTimestamp(answer.at) ?? Date.now()
  const difficulty = normalizeDifficulty(
    answer.difficulty ?? source.difficulty,
  )

  const attempts = source.attempts + 1
  const correct = source.correct + (isCorrect ? 1 : 0)
  const wrong = source.wrong + (isCorrect ? 0 : 1)
  const streak = isCorrect ? source.streak + 1 : 0

  let ease = source.ease
  let intervalIndex = source.intervalIndex
  let intervalMs = source.intervalMs
  let nextReviewAt

  if (isCorrect) {
    ease = clamp(ease + rules.easeGain, rules.easeMin, rules.easeMax)
    intervalIndex = Math.min(
      source.intervalIndex + 1,
      rules.reviewIntervals.length - 1,
    )
    intervalMs = toNonNegativeInteger(rules.reviewIntervals[intervalIndex])
    nextReviewAt = at + intervalMs
  } else {
    ease = clamp(ease - rules.easeLoss, rules.easeMin, rules.easeMax)
    intervalIndex = 0
    intervalMs = 0
    nextReviewAt = at + rules.wrongRetryMs
  }

  const mastery = computeQuestionMastery(
    source.mastery,
    isCorrect,
    difficulty,
    rules,
  )

  return {
    id: source.id,
    attempts,
    correct,
    wrong,
    streak,
    bestStreak: Math.max(source.bestStreak, streak),
    lastResult: isCorrect,
    lastSeenAt: at,
    lastCorrectAt: isCorrect ? at : source.lastCorrectAt,
    nextReviewAt,
    intervalIndex,
    intervalMs,
    ease,
    difficulty,
    mastery,
  }
}

/**
 * Aplica uma resposta ao estado de um subtópico.
 *
 * @param {unknown} state
 * @param {object} answer
 * @param {object} [config]
 * @returns {{ subtopic: object, question: object, isCorrect: boolean }}
 */
export function applyAnswerToSubtopicState(state, answer = {}, config = {}) {
  const rules = resolveAdaptiveConfig(config)
  const source = normalizeSubtopicState(state, answer.subtopicId)
  const questionId = toKey(answer.questionId) ?? toKey(answer.id) ?? 'questao'
  const at = toTimestamp(answer.at) ?? Date.now()
  const isCorrect = resolveIsCorrect(answer)

  const question = applyAnswerToQuestionState(
    source.questions[questionId],
    { ...answer, questionId, at, isCorrect },
    rules,
  )

  const questions = { ...source.questions, [questionId]: question }
  const summary = summarizeQuestionStates(questions)
  const streak = isCorrect ? source.streak + 1 : 0

  const mastery = computeSubtopicMastery(
    { ...source, questions },
    {
      ...rules,
      expectedQuestionCount:
        answer.expectedQuestionCount ??
        rules.expectedQuestionCount ??
        rules.expectedQuestionsPerSubtopic,
    },
  )

  const accuracy = summary.attempts > 0 ? summary.correct / summary.attempts : 0
  const mastered = mastery >= rules.masteryThreshold
    && summary.attempts >= rules.minAttemptsForMastery

  const completed = source.completed === true || mastered
  const completedAt = source.completedAt
    ?? (completed ? at : null)

  const subtopic = normalizeSubtopicState(
    {
      id: source.id || questionId,
      attempts: summary.attempts,
      correct: summary.correct,
      wrong: summary.wrong,
      answeredCount: summary.answeredCount,
      streak,
      bestStreak: Math.max(source.bestStreak, streak),
      lastSeenAt: at,
      lastCorrectAt: isCorrect ? at : source.lastCorrectAt,
      nextReviewAt: nextReviewFromQuestions(questions),
      mastery,
      difficulty: computeAdaptiveDifficulty(mastery, accuracy),
      completed,
      completedAt,
      questions,
    },
    source.id || answer.subtopicId,
  )

  return { subtopic, question, isCorrect }
}

/**
 * Aplica uma resposta ao estado de uma fase, atualizando o subtópico
 * correspondente e os agregados da fase.
 *
 * @param {unknown} phaseState
 * @param {object} answer
 * @param {object} [config]
 * @returns {{ phase: object, subtopic: object, question: object, isCorrect: boolean }}
 */
export function applyAnswerToPhaseState(phaseState, answer = {}, config = {}) {
  const source = isPlainObject(phaseState) ? phaseState : {}
  const rules = resolveAdaptiveConfig(config)
  const subtopics = normalizeSubtopicMap(source.subtopics)

  const subtopicId =
    toKey(answer.subtopicId) ?? toKey(answer.subtopic) ?? toKey(answer.topicId) ?? 'geral'
  const base = subtopics[subtopicId] ?? normalizeSubtopicState(null, subtopicId)

  const result = applyAnswerToSubtopicState(
    base,
    { ...answer, subtopicId },
    {
      ...rules,
      expectedQuestionCount:
        answer.expectedQuestionCount ??
        rules.expectedQuestionCount ??
        rules.expectedQuestionsPerSubtopic,
    },
  )

  subtopics[subtopicId] = result.subtopic

  const states = Object.values(subtopics)
  const answeredCount = states.reduce((total, item) => total + item.attempts, 0)
  const mastery =
    states.length > 0
      ? Math.round(
          states.reduce((total, item) => total + item.mastery, 0) / states.length,
        )
      : 0

  const lastSeenAt = toTimestamp(result.subtopic.lastSeenAt)

  return {
    phase: {
      ...source,
      subtopics,
      answeredCount,
      mastery,
      lastSeenAt: lastSeenAt ?? toTimestamp(source.lastSeenAt),
    },
    ...result,
  }
}

/**
 * IDs dos subtópicos de uma fase, na ordem de desbloqueio.
 *
 * @param {object | null} phaseDefinition
 * @param {object | null} phaseState
 * @returns {string[]}
 */
export function getPhaseSubtopicIds(phaseDefinition, phaseState) {
  const stateIds = Object.keys(
    isPlainObject(phaseState?.subtopics) ? phaseState.subtopics : {},
  )
  const definitionSubtopics = Array.isArray(phaseDefinition?.subtopics)
    ? phaseDefinition.subtopics
    : null

  if (definitionSubtopics && definitionSubtopics.length > 0) {
    const ids = definitionSubtopics
      .map((subtopic) => toKey(subtopic?.id))
      .filter(Boolean)

    for (const id of stateIds) {
      if (!ids.includes(id)) ids.push(id)
    }

    return ids
  }

  return stateIds
}

/**
 * Estado normalizado de um subtópico dentro de uma fase.
 *
 * @param {unknown} phaseState
 * @param {unknown} subtopicId
 * @returns {object}
 */
export function getSubtopicStateFromPhase(phaseState, subtopicId) {
  const key = toKey(subtopicId)
  const states = isPlainObject(phaseState?.subtopics)
    ? phaseState.subtopics
    : {}

  return normalizeSubtopicState(key ? states[key] : null, key)
}

/**
 * Estado normalizado de uma questão dentro de um subtópico.
 *
 * @param {unknown} phaseState
 * @param {unknown} subtopicId
 * @param {unknown} questionId
 * @returns {object}
 */
export function getQuestionStateFromPhase(
  phaseState,
  subtopicId,
  questionId,
) {
  const subtopic = getSubtopicStateFromPhase(phaseState, subtopicId)
  const key = toKey(questionId)

  return normalizeQuestionState(key ? subtopic.questions[key] : null, key)
}

/**
 * @param {object | null} phaseState
 * @returns {number}
 */
export function getPhaseMastery(phaseState, phaseDefinition = null) {
  const ids = getPhaseSubtopicIds(phaseDefinition, phaseState)

  if (ids.length === 0) {
    return clamp(toSafeNumber(phaseState?.mastery), MIN_MASTERY, MAX_MASTERY)
  }

  let total = 0

  for (const id of ids) {
    total += getSubtopicStateFromPhase(phaseState, id).mastery
  }

  return Math.round(clamp(total / ids.length, MIN_MASTERY, MAX_MASTERY))
}

/**
 * Um subtópico está dominado quando atinge a maestria mínima após o número
 * mínimo de tentativas, ou quando já foi marcado como concluído.
 *
 * @param {object | null} subtopicState
 * @param {object} [config]
 * @returns {boolean}
 */
export function isSubtopicMastered(subtopicState, config = {}) {
  const rules = resolveAdaptiveConfig(config)
  const state = isPlainObject(subtopicState) ? subtopicState : {}

  if (state.completed === true) return true

  return (
    toSafeNumber(state.mastery) >= rules.masteryThreshold &&
    toNonNegativeInteger(state.attempts) >= rules.minAttemptsForMastery
  )
}

/**
 * Status de um subtópico.
 *
 * @param {object | null} phaseDefinition
 * @param {object | null} phaseState
 * @param {unknown} subtopicId
 * @param {object} [options]
 * @param {boolean} [options.phaseUnlocked=true]
 * @returns {'locked' | 'available' | 'in-progress' | 'completed'}
 */
export function getSubtopicStatus(
  phaseDefinition,
  phaseState,
  subtopicId,
  options = {},
) {
  const rules = resolveAdaptiveConfig(options)
  const key = toKey(subtopicId)

  if (!key) return 'locked'
  if (options.phaseUnlocked === false) return 'locked'

  const ids = getPhaseSubtopicIds(phaseDefinition, phaseState)
  const index = ids.indexOf(key)
  const state = getSubtopicStateFromPhase(phaseState, key)

  if (index > 0) {
    const previous = getSubtopicStateFromPhase(phaseState, ids[index - 1])

    if (!isSubtopicMastered(previous, rules)) return 'locked'
  }

  if (isSubtopicMastered(state, rules)) return 'completed'
  if (toNonNegativeInteger(state.attempts) > 0) return 'in-progress'

  return 'available'
}

/**
 * @param {object | null} phaseDefinition
 * @param {object | null} phaseState
 * @param {unknown} subtopicId
 * @param {object} [options]
 * @returns {boolean}
 */
export function isSubtopicUnlocked(
  phaseDefinition,
  phaseState,
  subtopicId,
  options = {},
) {
  return (
    getSubtopicStatus(phaseDefinition, phaseState, subtopicId, options) !==
    'locked'
  )
}

/**
 * Resumo de um subtópico com o estado e as métricas derivadas.
 *
 * @param {object | null} phaseState
 * @param {object | null} phaseDefinition
 * @param {unknown} subtopicId
 * @param {object} [options]
 * @returns {object | null}
 */
export function getSubtopicSnapshot(
  phaseState,
  phaseDefinition,
  subtopicId,
  options = {},
) {
  const key = toKey(subtopicId)

  if (!key) return null

  const rules = resolveAdaptiveConfig(options)
  const definition = Array.isArray(phaseDefinition?.subtopics)
    ? phaseDefinition.subtopics.find((item) => toKey(item?.id) === key) ?? null
    : null
  const state = getSubtopicStateFromPhase(phaseState, key)
  const status = getSubtopicStatus(phaseDefinition, phaseState, key, options)
  const accuracy = state.attempts > 0 ? state.correct / state.attempts : 0

  return {
    ...state,
    title: definition?.title ?? state.id,
    status,
    unlocked: status !== 'locked',
    mastered: isSubtopicMastered(state, rules),
    accuracy,
    accuracyPercent: Math.round(accuracy * 100),
    difficulty: computeAdaptiveDifficulty(state.mastery, accuracy),
    questionCount: Object.keys(state.questions).length,
    children: Array.isArray(definition?.children) ? definition.children : [],
  }
}

/**
 * Resumo de todos os subtópicos de uma fase.
 *
 * @param {object | null} phaseDefinition
 * @param {object | null} phaseState
 * @param {object} [options]
 * @returns {object[]}
 */
export function summarizePhaseSubtopics(
  phaseDefinition,
  phaseState,
  options = {},
) {
  const ids = getPhaseSubtopicIds(phaseDefinition, phaseState)

  return ids
    .map((id) => getSubtopicSnapshot(phaseState, phaseDefinition, id, options))
    .filter(Boolean)
}

/**
 * Escolhe o próximo subtópico recomendado: o primeiro disponível/em andamento
 * que ainda não foi concluído. Se todos estiverem concluídos, retorna o de
 * menor maestria entre os desbloqueados.
 *
 * @param {object | null} phaseDefinition
 * @param {object | null} phaseState
 * @param {object} [options]
 * @returns {object | null}
 */
export function selectRecommendedSubtopic(
  phaseDefinition,
  phaseState,
  options = {},
) {
  const summaries = summarizePhaseSubtopics(
    phaseDefinition,
    phaseState,
    options,
  )

  const pending = summaries.find((subtopic) => {
    return (
      subtopic.status === 'in-progress' || subtopic.status === 'available'
    )
  })

  if (pending) return pending

  const unlocked = summaries.filter((subtopic) => subtopic.unlocked)

  if (unlocked.length === 0) return null

  return unlocked.reduce((weakest, subtopic) => {
    return subtopic.mastery < weakest.mastery ? subtopic : weakest
  }, unlocked[0])
}

export default {
  DEFAULT_ADAPTIVE_CONFIG,
  DEFAULT_REVIEW_INTERVALS_MS,
  PROGRESS_SCHEMA_VERSION,
  applyAnswerToPhaseState,
  applyAnswerToQuestionState,
  applyAnswerToSubtopicState,
  computeAdaptiveDifficulty,
  computeQuestionMastery,
  computeSubtopicMastery,
  createEmptyQuestionState,
  createEmptySubtopicState,
  getPhaseMastery,
  getPhaseSubtopicIds,
  getQuestionStateFromPhase,
  getSubtopicSnapshot,
  getSubtopicStateFromPhase,
  getSubtopicStatus,
  isSubtopicMastered,
  isSubtopicUnlocked,
  normalizeQuestionState,
  normalizeSubtopicMap,
  normalizeSubtopicState,
  resolveAdaptiveConfig,
  selectRecommendedSubtopic,
  summarizePhaseSubtopics,
}
