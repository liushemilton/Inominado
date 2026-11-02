/**
 * Seleção adaptativa de questões.
 *
 * O módulo é puro e determinístico quando recebe um `rng` injetado. Ele não
 * conhece Vue, persistência ou o formato da partida: apenas recebe a lista de
 * questões e o estado de progresso e devolve a ordem mais adequada.
 *
 * A prioridade de uma questão cresce quando ela:
 *
 * - nunca foi respondida;
 * - está fraca (baixa maestria ou muitos erros);
 * - está atrasada para revisão (`nextReviewAt <= now`);
 * - combina com a dificuldade recomendada para o subtópico.
 *
 * E diminui quando foi respondida há pouco tempo, evitando repetições na
 * mesma sessão.
 */

import {
  DEFAULT_ADAPTIVE_CONFIG,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  computeAdaptiveDifficulty,
  normalizeDifficulty,
  toKey,
  toNonNegativeInteger,
  toNonNegativeNumber,
  toSafeNumber,
  toTimestamp,
} from './ProgressManager.js'

export const MINUTE_MS = 60 * 1000
export const HOUR_MS = 60 * MINUTE_MS
export const DAY_MS = 24 * HOUR_MS

/**
 * @typedef {Object} SelectionOptions
 * @property {number} [limit] Máximo de questões retornadas.
 * @property {number} [unseenBoost] Bônus para questões nunca respondidas.
 * @property {number} [weakBoost] Bônus para questões com baixa maestria.
 * @property {number} [dueBoost] Bônus para questões atrasadas.
 * @property {number} [wrongBoost] Bônus para questões erradas recentemente.
 * @property {number} [difficultyWeight] Peso da proximidade de dificuldade.
 * @property {number | string | null} [difficulty] Dificuldade-alvo (1 a 5).
 * @property {number | string} [minDifficulty] Menor dificuldade permitida.
 * @property {number | string} [maxDifficulty] Maior dificuldade permitida.
 * @property {number} [difficultyTolerance] Margem aceita em torno do alvo.
 * @property {boolean} [difficultyFallback=true] Usa a dificuldade mais próxima
 *   quando não há questões exatamente no nível pedido.
 * @property {boolean} [filterByTargetDifficulty=false] Usa
 *   `context.targetDifficulty` como filtro quando `difficulty` não é informado.
 * @property {number} [recentPenalty] Multiplicador para questões vistas há pouco.
 * @property {number} [recentWindowMs] Janela considerada "recente".
 * @property {number} [priorityWeight] Peso do campo `question.weight`.
 * @property {boolean} [shuffle] Se `false`, devolve as mais bem ranqueadas.
 * @property {boolean} [onlyDue] Retorna apenas questões prontas para revisão.
 * @property {boolean} [onlyUnseen] Retorna apenas questões nunca respondidas.
 * @property {string | string[]} [subtopicId] Filtra por subtópico.
 * @property {string[]} [excludeIds] IDs que não devem ser retornados.
 * @property {string[]} [types] Tipos de exercício permitidos.
 * @property {number} [now] Timestamp atual.
 * @property {() => number} [rng] Gerador aleatório (testes).
 */

/** @type {Readonly<SelectionOptions>} */
export const DEFAULT_SELECTION_OPTIONS = Object.freeze({
  limit: 10,
  unseenBoost: 2.5,
  weakBoost: 2,
  dueBoost: 2.5,
  wrongBoost: 1,
  difficultyWeight: 1.25,
  difficulty: null,
  minDifficulty: MIN_DIFFICULTY,
  maxDifficulty: MAX_DIFFICULTY,
  difficultyTolerance: 0,
  difficultyFallback: true,
  filterByTargetDifficulty: false,
  recentPenalty: 0.35,
  recentWindowMs: 10 * MINUTE_MS,
  priorityWeight: 1,
  shuffle: true,
  onlyDue: false,
  onlyUnseen: false,
})

/**
 * @param {unknown} options
 * @returns {object}
 */
export function resolveSelectionOptions(options = {}) {
  const source = options && typeof options === 'object' ? options : {}

  return {
    ...DEFAULT_SELECTION_OPTIONS,
    ...source,
    limit: Math.max(0, toNonNegativeInteger(source.limit, DEFAULT_SELECTION_OPTIONS.limit)),
    unseenBoost: toNonNegativeNumber(source.unseenBoost, DEFAULT_SELECTION_OPTIONS.unseenBoost),
    weakBoost: toNonNegativeNumber(source.weakBoost, DEFAULT_SELECTION_OPTIONS.weakBoost),
    dueBoost: toNonNegativeNumber(source.dueBoost, DEFAULT_SELECTION_OPTIONS.dueBoost),
    wrongBoost: toNonNegativeNumber(source.wrongBoost, DEFAULT_SELECTION_OPTIONS.wrongBoost),
    difficultyWeight: toNonNegativeNumber(
      source.difficultyWeight,
      DEFAULT_SELECTION_OPTIONS.difficultyWeight,
    ),
    difficulty:
      source.difficulty === undefined ||
      source.difficulty === null ||
      source.difficulty === ''
        ? null
        : normalizeDifficulty(source.difficulty),
    minDifficulty: Math.min(
      normalizeDifficulty(source.minDifficulty, MIN_DIFFICULTY),
      normalizeDifficulty(source.maxDifficulty, MAX_DIFFICULTY),
    ),
    maxDifficulty: Math.max(
      normalizeDifficulty(source.minDifficulty, MIN_DIFFICULTY),
      normalizeDifficulty(source.maxDifficulty, MAX_DIFFICULTY),
    ),
    difficultyTolerance: toNonNegativeInteger(
      source.difficultyTolerance,
      DEFAULT_SELECTION_OPTIONS.difficultyTolerance,
    ),
    difficultyFallback: source.difficultyFallback !== false,
    filterByTargetDifficulty: source.filterByTargetDifficulty === true,
    recentPenalty: Math.max(
      0.01,
      toSafeNumber(source.recentPenalty, DEFAULT_SELECTION_OPTIONS.recentPenalty),
    ),
    recentWindowMs: toNonNegativeInteger(
      source.recentWindowMs,
      DEFAULT_SELECTION_OPTIONS.recentWindowMs,
    ),
    priorityWeight: toNonNegativeNumber(
      source.priorityWeight,
      DEFAULT_SELECTION_OPTIONS.priorityWeight,
    ),
    shuffle: source.shuffle !== false,
    onlyDue: source.onlyDue === true,
    onlyUnseen: source.onlyUnseen === true,
  }
}

/**
 * @param {unknown} question
 * @param {number} [index]
 * @returns {string}
 */
export function getQuestionId(question, index = 0) {
  const source = question && typeof question === 'object' ? question : {}

  return (
    toKey(source.id) ??
    toKey(source.questionId) ??
    toKey(source.key) ??
    String(index)
  )
}

/**
 * @param {unknown} question
 * @returns {string}
 */
export function getQuestionSubtopicId(question) {
  return getQuestionSubtopicIds(question)[0] ?? ''
}

/**
 * Retorna todos os subtópicos aos quais a questão foi associada.
 * Mantém compatibilidade com bancos antigos que usam apenas `subtopicId`.
 *
 * @param {unknown} question
 * @returns {string[]}
 */
export function getQuestionSubtopicIds(question) {
  const source = question && typeof question === 'object' ? question : {}
  const rawIds = [
    ...(Array.isArray(source.subtopicIds) ? source.subtopicIds : []),
    source.subtopicId ?? source.subtopic ?? source.topicId,
  ]

  return Array.from(new Set(rawIds.map(toKey).filter(Boolean)))
}

/**
 * @param {unknown} question
 * @returns {number}
 */
export function getQuestionDifficulty(question) {
  const source = question && typeof question === 'object' ? question : {}

  return normalizeDifficulty(
    source.dificuldade ?? source.difficulty ?? source.level ?? source.hardness,
  )
}

/**
 * Filtra questões pela dificuldade-alvo.
 *
 * Quando não existe questão no nível pedido (ou dentro da tolerância), usa a
 * dificuldade mais próxima disponível. Isso evita sessões vazias em bancos que
 * só possuem, por exemplo, questões fáceis e médias.
 *
 * @param {unknown[]} questions
 * @param {unknown} target
 * @param {Object} [options]
 * @param {number} [options.tolerance=0]
 * @param {boolean} [options.fallback=true]
 * @returns {object[]}
 */
export function filterQuestionsByDifficulty(questions, target, options = {}) {
  const list = Array.isArray(questions) ? questions.filter(Boolean) : []

  if (
    target === undefined ||
    target === null ||
    target === '' ||
    list.length === 0
  ) {
    return list
  }

  const targetDifficulty = normalizeDifficulty(target)
  const tolerance = toNonNegativeInteger(options.tolerance)
  const withinTolerance = list.filter((question) => {
    return Math.abs(getQuestionDifficulty(question) - targetDifficulty) <= tolerance
  })

  if (withinTolerance.length > 0 || options.fallback === false) {
    return withinTolerance
  }

  const distances = list.map((question) => {
    return Math.abs(getQuestionDifficulty(question) - targetDifficulty)
  })
  const nearestDistance = Math.min(...distances)

  return list.filter((_question, index) => distances[index] === nearestDistance)
}

/**
 * Alvo de dificuldade efetivo para uma seleção.
 *
 * @param {object} rules
 * @param {object} context
 * @returns {number | null}
 */
function resolveDifficultyTarget(rules, context) {
  if (rules.difficulty !== null) return rules.difficulty
  if (rules.filterByTargetDifficulty !== true) return null

  const target = context?.targetDifficulty

  return target === undefined || target === null || target === ''
    ? null
    : normalizeDifficulty(target)
}

/**
 * Normaliza a precisão de uma questão (0 a 1).
 *
 * @param {object} state
 * @returns {number}
 */
function questionAccuracy(state) {
  const attempts = toNonNegativeInteger(state?.attempts)

  if (attempts === 0) return 0

  return Math.min(1, toNonNegativeInteger(state?.correct) / attempts)
}

/**
 * Filtra as questões antes do ranqueamento.
 *
 * @param {unknown[]} questions
 * @param {object} [context]
 * @param {object} [options]
 * @returns {object[]}
 */
export function filterQuestions(questions, context = {}, options = {}) {
  const list = Array.isArray(questions) ? questions.filter(Boolean) : []
  const rules = resolveSelectionOptions(options)
  const questionStates =
    context?.questionStates && typeof context.questionStates === 'object'
      ? context.questionStates
      : {}
  const now = toTimestamp(context?.now) ?? Date.now()

  const subtopicFilter = rules.subtopicId ?? rules.subtopicIds
  const subtopicIds = Array.isArray(subtopicFilter)
    ? subtopicFilter.map((value) => toKey(value)).filter(Boolean)
    : toKey(subtopicFilter)
      ? [toKey(subtopicFilter)]
      : null
  const excludeIds = new Set(
    (Array.isArray(rules.excludeIds) ? rules.excludeIds : [])
      .map((value) => toKey(value))
      .filter(Boolean),
  )
  const types = Array.isArray(rules.types)
    ? new Set(rules.types.map((value) => String(value)))
    : null

  const filtered = list.filter((question, index) => {
    const id = getQuestionId(question, index)
    const questionSubtopicIds = getQuestionSubtopicIds(question)
    const state = questionStates[id] ?? {}
    const attempts = toNonNegativeInteger(state.attempts)

    if (excludeIds.has(id)) return false
    if (
      subtopicIds &&
      !questionSubtopicIds.some((subtopicId) => subtopicIds.includes(subtopicId))
    ) {
      return false
    }
    if (types && !types.has(String(question?.type ?? ''))) return false

    const difficulty = getQuestionDifficulty(question)

    if (difficulty < rules.minDifficulty || difficulty > rules.maxDifficulty) {
      return false
    }

    if (rules.onlyUnseen === true && attempts > 0) return false

    if (rules.onlyDue === true) {
      if (attempts === 0) return false

      const nextReviewAt = toTimestamp(state.nextReviewAt)

      if (nextReviewAt === null || nextReviewAt > now) return false
    }

    return true
  })

  return filterQuestionsByDifficulty(
    filtered,
    resolveDifficultyTarget(rules, context),
    {
      tolerance: rules.difficultyTolerance,
      fallback: rules.difficultyFallback,
    },
  )
}

/**
 * Calcula a prioridade de uma questão.
 *
 * @param {object} question
 * @param {number} index
 * @param {object} context
 * @param {object} [options]
 * @returns {number}
 */
export function scoreQuestion(question, index, context = {}, options = {}) {
  const rules = resolveSelectionOptions(options)
  const questionStates =
    context?.questionStates && typeof context.questionStates === 'object'
      ? context.questionStates
      : {}
  const subtopicStates =
    context?.subtopicStates && typeof context.subtopicStates === 'object'
      ? context.subtopicStates
      : {}

  const id = getQuestionId(question, index)
  const subtopicId =
    toKey(context?.subtopicId) ?? getQuestionSubtopicId(question)
  const state = questionStates[id] ?? {}
  const subtopicState = subtopicStates[subtopicId] ?? {}
  const now = toTimestamp(context?.now) ?? Date.now()
  const attempts = toNonNegativeInteger(state.attempts)

  let score = 1

  if (attempts === 0) {
    score += rules.unseenBoost
  } else {
    const mastery = Math.min(
      100,
      toNonNegativeNumber(state.mastery),
    )
    const accuracy = questionAccuracy(state)

    score += (1 - mastery / 100) * rules.weakBoost
    score += (1 - accuracy) * rules.weakBoost * 0.5

    if (state.lastResult === false) score += rules.wrongBoost

    const nextReviewAt = toTimestamp(state.nextReviewAt)

    if (nextReviewAt !== null && nextReviewAt <= now) {
      const overdue = Math.min(1, (now - nextReviewAt) / DAY_MS)

      score += rules.dueBoost + overdue * rules.dueBoost
    }

    const lastSeenAt = toTimestamp(state.lastSeenAt)

    if (lastSeenAt !== null && now - lastSeenAt < rules.recentWindowMs) {
      score *= rules.recentPenalty
    }
  }

  const targetDifficulty =
    toNonNegativeNumber(context?.targetDifficulty) ||
    toNonNegativeNumber(subtopicState.difficulty) ||
    computeAdaptiveDifficulty(
      toNonNegativeNumber(subtopicState.mastery),
      subtopicState.attempts > 0
        ? toNonNegativeNumber(subtopicState.correct) / subtopicState.attempts
        : 0,
    )

  const difficulty = getQuestionDifficulty(question)
  const distance = Math.abs(difficulty - targetDifficulty)

  score += Math.max(0, rules.difficultyWeight - distance * 0.65)

  const questionWeight = toNonNegativeNumber(
    question?.weight ?? question?.priority,
    1,
  )

  score *= 1 + questionWeight * rules.priorityWeight

  return Math.max(0.01, score)
}

/**
 * Ranqueia as questões por prioridade (maior primeiro).
 *
 * @param {unknown[]} questions
 * @param {object} [context]
 * @param {object} [options]
 * @returns {Array<{ question: object, id: string, score: number, index: number }>}
 */
export function rankQuestions(questions, context = {}, options = {}) {
  const filtered = filterQuestions(questions, context, options)

  return filtered
    .map((question, index) => ({
      question,
      id: getQuestionId(question, index),
      score: scoreQuestion(question, index, context, options),
      index,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score

      return left.id.localeCompare(right.id)
    })
}

/**
 * Sorteio ponderado sem reposição.
 *
 * @param {Array<{ question: object, score: number }>} ranked
 * @param {number} limit
 * @param {() => number} [rng]
 * @returns {object[]}
 */
function weightedSample(ranked, limit, rng = Math.random) {
  const pool = ranked.slice()
  const picked = []
  const count = Math.min(Math.max(0, limit), pool.length)

  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((sum, item) => sum + Math.max(0, item.score), 0)

    if (total <= 0) {
      picked.push(pool.shift())
      continue
    }

    let target = Math.min(Math.max(rng(), 0), 0.999999) * total
    let chosen = pool.length - 1

    for (let index = 0; index < pool.length; index += 1) {
      target -= Math.max(0, pool[index].score)

      if (target <= 0) {
        chosen = index
        break
      }
    }

    picked.push(pool.splice(chosen, 1)[0])
  }

  return picked.map((item) => item.question)
}

/**
 * Seleciona questões para uma sessão.
 *
 * @param {unknown[]} questions
 * @param {object} [context]
 * @param {SelectionOptions} [options]
 * @returns {object[]}
 */
export function selectQuestions(questions, context = {}, options = {}) {
  const rules = resolveSelectionOptions(options)
  const ranked = rankQuestions(questions, context, rules)

  if (ranked.length === 0) return []

  const limit = rules.limit > 0 ? Math.min(rules.limit, ranked.length) : ranked.length

  if (rules.shuffle === false) {
    return ranked.slice(0, limit).map((item) => item.question)
  }

  const rng = typeof options.rng === 'function' ? options.rng : Math.random

  return weightedSample(ranked, limit, rng)
}

/**
 * Seleciona apenas a próxima questão.
 *
 * @param {unknown[]} questions
 * @param {object} [context]
 * @param {SelectionOptions} [options]
 * @returns {object | null}
 */
export function selectNextQuestion(questions, context = {}, options = {}) {
  const selected = selectQuestions(questions, context, {
    ...options,
    limit: 1,
  })

  return selected[0] ?? null
}

/**
 * Seleciona questões que já estão prontas para revisão.
 *
 * @param {unknown[]} questions
 * @param {object} [context]
 * @param {SelectionOptions} [options]
 * @returns {object[]}
 */
export function selectReviewQuestions(questions, context = {}, options = {}) {
  return selectQuestions(questions, context, {
    ...options,
    onlyDue: true,
  })
}

/**
 * Seleciona questões nunca respondidas.
 *
 * @param {unknown[]} questions
 * @param {object} [context]
 * @param {SelectionOptions} [options]
 * @returns {object[]}
 */
export function selectNewQuestions(questions, context = {}, options = {}) {
  return selectQuestions(questions, context, {
    ...options,
    onlyUnseen: true,
  })
}

/**
 * Estatísticas de um conjunto de questões para um contexto de progresso.
 *
 * @param {unknown[]} questions
 * @param {object} [context]
 * @returns {{
 *   total: number,
 *   seen: number,
 *   unseen: number,
 *   due: number,
 *   weak: number,
 *   averageMastery: number
 * }}
 */
export function getQuestionPoolStats(questions, context = {}) {
  const list = Array.isArray(questions) ? questions.filter(Boolean) : []
  const questionStates =
    context?.questionStates && typeof context.questionStates === 'object'
      ? context.questionStates
      : {}
  const now = toTimestamp(context?.now) ?? Date.now()

  let seen = 0
  let due = 0
  let weak = 0
  let masteryTotal = 0

  list.forEach((question, index) => {
    const state = questionStates[getQuestionId(question, index)] ?? {}
    const attempts = toNonNegativeInteger(state.attempts)
    const mastery = toNonNegativeNumber(state.mastery)
    const nextReviewAt = toTimestamp(state.nextReviewAt)

    if (attempts > 0) {
      seen += 1
      masteryTotal += mastery

      if (mastery < DEFAULT_ADAPTIVE_CONFIG.masteryThreshold) weak += 1
      if (nextReviewAt !== null && nextReviewAt <= now) due += 1
    }
  })

  return {
    total: list.length,
    seen,
    unseen: list.length - seen,
    due,
    weak,
    averageMastery: seen > 0 ? Math.round(masteryTotal / seen) : 0,
  }
}

/**
 * Cria um seletor com opções padrão.
 *
 * @param {SelectionOptions} [defaults]
 * @returns {{
 *   selectQuestions: typeof selectQuestions,
 *   selectNextQuestion: typeof selectNextQuestion,
 *   selectReviewQuestions: typeof selectReviewQuestions,
 *   selectNewQuestions: typeof selectNewQuestions,
 *   rankQuestions: typeof rankQuestions,
 *   getQuestionPoolStats: typeof getQuestionPoolStats
 * }}
 */
export function createQuestionSelector(defaults = {}) {
  return {
    selectQuestions(questions, context = {}, options = {}) {
      return selectQuestions(questions, context, { ...defaults, ...options })
    },
    selectNextQuestion(questions, context = {}, options = {}) {
      return selectNextQuestion(questions, context, { ...defaults, ...options })
    },
    selectReviewQuestions(questions, context = {}, options = {}) {
      return selectReviewQuestions(questions, context, { ...defaults, ...options })
    },
    selectNewQuestions(questions, context = {}, options = {}) {
      return selectNewQuestions(questions, context, { ...defaults, ...options })
    },
    rankQuestions(questions, context = {}, options = {}) {
      return rankQuestions(questions, context, { ...defaults, ...options })
    },
    getQuestionPoolStats,
  }
}

export default selectQuestions
