/**
 * Composable de aprendizado adaptativo.
 *
 * Liga três peças já existentes:
 *
 * - `useProgress`: estado reativo, persistência e progresso por subtópico;
 * - `QuestionSelector`: ordenação e sorteio ponderado das questões;
 * - `AswerChecker`: correção das respostas.
 *
 * O composable é uma camada de lógica: não renderiza nada e não substitui o
 * `useGame`. O fluxo esperado é:
 *
 * ```js
 * const adaptive = useAdaptiveLearning({ levels })
 *
 * const session = adaptive.buildSession({
 *   levelId: 'nivel-quimica-organica',
 *   phaseId: 'topico-01',
 * })
 *
 * // ... o jogador responde ...
 *
 * adaptive.recordAttempt({
 *   levelId: 'nivel-quimica-organica',
 *   phaseId: 'topico-01',
 *   question,
 *   userAnswer,
 * })
 * ```
 */

import { computed, ref, unref } from 'vue'

import {
  EXERCISE_TYPES,
  checkAnswer,
  normalizeExerciseType,
} from '../Logic/AswerChecker.js'
import {
  getQuestionPoolStats,
  getQuestionId,
  getQuestionSubtopicId,
  getQuestionSubtopicIds,
  createQuestionSelector,
} from '../Logic/QuestionSelector.js'
import {
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  computeAdaptiveDifficulty,
  normalizeDifficulty,
  resolveAdaptiveConfig,
  toKey,
  toNonNegativeInteger,
  toNonNegativeNumber,
} from '../Logic/ProgressManager.js'
import { useProgress } from './useProgress.js'

/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function sameId(a, b) {
  return a !== undefined && a !== null && b !== undefined && b !== null
    ? String(a) === String(b)
    : false
}

/**
 * @param {unknown} phases
 * @returns {object[]}
 */
function toPhaseArray(phases) {
  if (Array.isArray(phases)) return phases.filter(Boolean)
  if (!phases || typeof phases !== 'object') return []

  return Object.entries(phases).map(([id, phase]) => ({
    ...phase,
    id: phase?.id ?? id,
  }))
}

/**
 * Resolve a resposta correta, incluindo o fallback de `MatchingPairs`.
 *
 * @param {object | null} question
 * @returns {unknown}
 */
function resolveCorrectAnswer(question) {
  if (!question) return undefined
  if (question.correctAnswer !== undefined) return question.correctAnswer

  if (
    normalizeExerciseType(question.type) === EXERCISE_TYPES.MATCHING_PAIRS &&
    Array.isArray(question.pairs)
  ) {
    return question.pairs
  }

  return undefined
}

/**
 * @param {object | null} question
 * @param {unknown} userAnswer
 * @returns {boolean}
 */
function isAnswerCorrect(question, userAnswer) {
  if (!question) return false

  try {
    return checkAnswer(
      userAnswer,
      resolveCorrectAnswer(question),
      question.type,
    )
  } catch {
    return false
  }
}

/**
 * @param {object[]} questions
 * @param {string} subtopicId
 * @returns {object[]}
 */
function filterBySubtopic(questions, subtopicId) {
  if (!subtopicId) return questions

  return questions.filter((question) => {
    return getQuestionSubtopicIds(question).includes(subtopicId)
  })
}

/**
 * Cria um controlador adaptativo independente.
 *
 * @param {Object} [options]
 * @param {object[]} [options.levels] Catálogo de níveis.
 * @param {object} [options.progressStore] Store pronto (testes/SSR).
 * @param {Storage | null} [options.storage] Armazenamento injetável.
 * @param {string} [options.storageKey] Chave de persistência.
 * @param {() => number} [options.now] Relógio injetável.
 * @param {object} [options.adaptive] Sobrescreve a configuração adaptativa.
 * @param {object} [options.selection] Sobrescreve a seleção de questões.
 * @returns {object}
 */
export function createAdaptiveLearning(options = {}) {
  const progressStore =
    options.progressStore ??
    useProgress({
      levels: options.levels,
      storage: options.storage,
      storageKey: options.storageKey,
      key: options.key,
      now: options.now,
      sync: options.sync,
      logger: options.logger,
      masteryThreshold: options.masteryThreshold,
      minAttemptsForMastery: options.minAttemptsForMastery,
      expectedQuestionsPerSubtopic: options.expectedQuestionsPerSubtopic,
      reviewIntervals: options.reviewIntervals,
      correctGain: options.correctGain,
      difficultyGain: options.difficultyGain,
      wrongLoss: options.wrongLoss,
      wrongRetryMs: options.wrongRetryMs,
      levelUpStreak: options.levelUpStreak,
      levelDownStreak: options.levelDownStreak,
    })

  const adaptiveConfig = resolveAdaptiveConfig({
    ...(progressStore?.adaptiveConfig ?? {}),
    ...(options.adaptive ?? {}),
    ...(options.levelUpStreak === undefined
      ? {}
      : { levelUpStreak: options.levelUpStreak }),
    ...(options.levelDownStreak === undefined
      ? {}
      : { levelDownStreak: options.levelDownStreak }),
  })
  const selector = createQuestionSelector(options.selection ?? {})
  const getNow = typeof options.now === 'function' ? options.now : () => Date.now()

  // Estado da sessão atual. A dificuldade é independente da dificuldade
  // persistida no subtópico: começa nela, mas sobe/desce conforme a sequência
  // de acertos e erros desta partida.
  const sessionLevelId = ref('')
  const sessionPhaseId = ref('')
  const sessionSubtopicId = ref('')
  const sessionDifficulty = ref(MIN_DIFFICULTY)
  const correctStreak = ref(0)
  const wrongStreak = ref(0)
  const sessionAttempts = ref(0)
  const sessionCorrect = ref(0)
  const sessionWrong = ref(0)
  const lastDifficultyChange = ref(null)

  /**
   * @returns {object[]}
   */
  function getLevels() {
    if (Array.isArray(options.levels)) return options.levels

    const configured = unref(progressStore?.levels)

    return Array.isArray(configured) ? configured : []
  }

  /**
   * @param {unknown} levelId
   * @param {unknown} phaseId
   * @returns {{ level: object | null, phase: object | null }}
   */
  function resolvePhaseDefinition(levelId, phaseId) {
    const level = getLevels().find((item) => sameId(item?.id, levelId)) ?? null
    const phase = level
      ? toPhaseArray(level.phases).find((item) => sameId(item?.id, phaseId)) ??
        null
      : null

    return { level, phase }
  }

  /**
   * @param {object | null} level
   * @param {object | null} phase
   * @param {string} [subtopicId]
   * @returns {object[]}
   */
  function getQuestionPool(level, phase, subtopicId = '') {
    const phaseQuestions = Array.isArray(phase?.questions)
      ? phase.questions
      : Array.isArray(level?.questions)
        ? level.questions
        : []
    const questions = phaseQuestions.filter((question) => {
      return question && typeof question === 'object'
    })
    const filtered = filterBySubtopic(questions, subtopicId)

    // Mantém compatibilidade com fases antigas que ainda não têm nenhum
    // vínculo cadastrado. No banco mapeado, uma seleção sem questões fica vazia.
    const hasSubtopicMappings = questions.some((question) => {
      return getQuestionSubtopicIds(question).length > 0
    })

    return subtopicId && !hasSubtopicMappings ? questions : filtered
  }

  /**
   * @param {unknown} levelId
   * @param {unknown} phaseId
   * @param {unknown} subtopicId
   * @returns {object}
   */
  function getSubtopicState(levelId, phaseId, subtopicId) {
    const phaseState = progressStore.getPhaseProgress(levelId, phaseId)
    const states =
      phaseState?.subtopics && typeof phaseState.subtopics === 'object'
        ? phaseState.subtopics
        : {}
    const key = toKey(subtopicId)

    return key ? states[key] ?? null : null
  }

  /**
   * @param {unknown} levelId
   * @param {unknown} phaseId
   * @returns {Record<string, object>}
   */
  function getPhaseQuestionStates(levelId, phaseId) {
    const phaseState = progressStore.getPhaseProgress(levelId, phaseId)
    const states =
      phaseState?.subtopics && typeof phaseState.subtopics === 'object'
        ? phaseState.subtopics
        : {}
    const result = {}

    for (const subtopic of Object.values(states)) {
      if (!subtopic?.questions || typeof subtopic.questions !== 'object') {
        continue
      }

      Object.assign(result, subtopic.questions)
    }

    return result
  }

  /**
   * @param {unknown} levelId
   * @param {unknown} phaseId
   * @param {unknown} subtopicId
   * @param {number} [now]
   * @returns {object}
   */
  function buildContext(levelId, phaseId, subtopicId, now) {
    const phaseState = progressStore.getPhaseProgress(levelId, phaseId)
    const subtopicStates =
      phaseState?.subtopics && typeof phaseState.subtopics === 'object'
        ? phaseState.subtopics
        : {}
    const recommended =
      toKey(subtopicId) ??
      toKey(progressStore.getRecommendedSubtopic(levelId, phaseId)?.id) ??
      toKey(Object.keys(subtopicStates)[0]) ??
      ''
    const subtopicState = subtopicStates[recommended] ?? {}
    const attempts = toNonNegativeInteger(subtopicState.attempts)
    const correct = toNonNegativeInteger(subtopicState.correct)
    const accuracy = attempts > 0 ? correct / attempts : 0
    const targetDifficulty =
      subtopicState.difficulty ??
      computeAdaptiveDifficulty(
        toNonNegativeNumber(subtopicState.mastery),
        accuracy,
      )

    return {
      questionStates: subtopicState.questions ?? {},
      subtopicStates,
      subtopicState,
      targetDifficulty,
      now: now ?? getNow(),
      subtopicId: recommended,
    }
  }

  /**
   * Dificuldade inicial de uma sessão: parte da dificuldade persistida do
   * subtópico e, quando ainda não há histórico, da maestria/precisão atuais.
   *
   * @param {unknown} levelId
   * @param {unknown} phaseId
   * @param {unknown} subtopicId
   * @returns {number}
   */
  function resolveStartingDifficulty(levelId, phaseId, subtopicId) {
    const context = buildContext(levelId, phaseId, subtopicId)

    return normalizeDifficulty(context.targetDifficulty ?? MIN_DIFFICULTY)
  }

  /**
   * @param {unknown} value
   * @returns {number}
   */
  function resolveAttemptTime(value) {
    const number = Number(value)

    return Number.isFinite(number) && number > 0 ? Math.floor(number) : getNow()
  }

  /**
   * Altera a dificuldade da sessão respeitando os limites do modelo.
   *
   * @param {number} step
   * @param {number} at
   * @param {string} reason
   * @returns {object | null}
   */
  function changeDifficulty(step, at, reason) {
    const from = sessionDifficulty.value
    const to = Math.min(
      MAX_DIFFICULTY,
      Math.max(MIN_DIFFICULTY, from + step),
    )

    if (to === from) return null

    const change = {
      from,
      to,
      direction: to > from ? 'up' : 'down',
      reason,
      at,
    }

    sessionDifficulty.value = to
    lastDifficultyChange.value = change

    return change
  }

  /**
   * Inicia/limpa o estado da sessão.
   *
   * @param {Object} [params]
   * @param {unknown} [params.levelId]
   * @param {unknown} [params.phaseId]
   * @param {unknown} [params.subtopicId]
   * @param {number} [params.difficulty]
   * @returns {object}
   */
  function resetSession(params = {}) {
    const levelId = toKey(params.levelId) ?? ''
    const phaseId = toKey(params.phaseId) ?? ''
    const subtopicId = toKey(params.subtopicId) ?? ''

    sessionLevelId.value = levelId
    sessionPhaseId.value = phaseId
    sessionSubtopicId.value = subtopicId
    sessionDifficulty.value =
      params.difficulty === undefined || params.difficulty === null
        ? resolveStartingDifficulty(levelId, phaseId, subtopicId)
        : normalizeDifficulty(params.difficulty)
    correctStreak.value = 0
    wrongStreak.value = 0
    sessionAttempts.value = 0
    sessionCorrect.value = 0
    sessionWrong.value = 0
    lastDifficultyChange.value = null

    return getSessionState()
  }

  /**
   * Aplica uma resposta ao estado adaptativo da sessão.
   *
   * Sobe um nível após `levelUpStreak` acertos consecutivos e desce um nível
   * após `levelDownStreak` erros consecutivos. A sequência oposta é zerada a
   * cada resposta.
   *
   * @param {boolean} isCorrect
   * @param {number} [at]
   * @returns {object | null}
   */
  function applySessionAnswer(isCorrect, at) {
    const timestamp = resolveAttemptTime(at)

    sessionAttempts.value += 1

    if (isCorrect) {
      sessionCorrect.value += 1
      correctStreak.value += 1
      wrongStreak.value = 0

      if (correctStreak.value >= adaptiveConfig.levelUpStreak) {
        correctStreak.value = 0

        return changeDifficulty(1, timestamp, 'correct-streak')
      }

      return null
    }

    sessionWrong.value += 1
    wrongStreak.value += 1
    correctStreak.value = 0

    if (wrongStreak.value >= adaptiveConfig.levelDownStreak) {
      wrongStreak.value = 0

      return changeDifficulty(-1, timestamp, 'wrong-streak')
    }

    return null
  }

  /**
   * Retrato do estado adaptativo da sessão.
   *
   * @returns {object}
   */
  function getSessionState() {
    return {
      levelId: sessionLevelId.value,
      phaseId: sessionPhaseId.value,
      subtopicId: sessionSubtopicId.value,
      difficulty: sessionDifficulty.value,
      correctStreak: correctStreak.value,
      wrongStreak: wrongStreak.value,
      attempts: sessionAttempts.value,
      correct: sessionCorrect.value,
      wrong: sessionWrong.value,
      lastDifficultyChange: lastDifficultyChange.value,
      levelUpStreak: adaptiveConfig.levelUpStreak,
      levelDownStreak: adaptiveConfig.levelDownStreak,
    }
  }

  const sessionState = computed(() => getSessionState())

  /**
   * Seleciona questões de um subtópico.
   *
   * @param {Object} [params]
   * @param {unknown} [params.levelId]
   * @param {unknown} [params.phaseId]
   * @param {unknown} [params.subtopicId]
   * @param {object[]} [params.questions] Banco já resolvido.
   * @param {number} [params.difficulty] Dificuldade-alvo; padrão: a da sessão.
   * @param {number} [params.limit]
   * @param {number} [params.now]
   * @param {() => number} [params.rng]
   * @returns {object[]}
   */
  function selectQuestions(params = {}) {
    const {
      levelId,
      phaseId,
      subtopicId,
      questions,
      difficulty,
      now,
      ...overrides
    } = params
    let pool = Array.isArray(questions) ? questions : null

    if (!pool) {
      const { level, phase } = resolvePhaseDefinition(levelId, phaseId)

      pool = getQuestionPool(level, phase, toKey(subtopicId) ?? '')
    }

    const context = buildContext(levelId, phaseId, subtopicId, now)
    const hasSession = Boolean(sessionLevelId.value && sessionPhaseId.value)
    const targetDifficulty =
      difficulty ??
      (hasSession ? sessionDifficulty.value : context.targetDifficulty)
    const subtopicKey = toKey(subtopicId)
    // Só repassa o filtro quando o pool realmente tem questões desse
    // subtópico. Caso contrário, o fallback para a fase inteira seria
    // desfeito dentro do seletor.
    const hasSubtopicQuestions = subtopicKey
      ? pool.some((question) => getQuestionSubtopicIds(question).includes(subtopicKey))
      : false

    return selector.selectQuestions(pool, context, {
      ...overrides,
      difficulty: targetDifficulty,
      subtopicId: hasSubtopicQuestions ? subtopicKey : undefined,
    })
  }

  /**
   * Monta uma sessão completa: subtópico recomendado, questões e estatísticas.
   *
   * @param {Object} [params]
   * @param {unknown} [params.levelId]
   * @param {unknown} [params.phaseId]
   * @param {unknown} [params.subtopicId]
   * @param {object[]} [params.questions]
   * @param {number} [params.difficulty]
   * @param {number} [params.limit]
   * @returns {object}
   */
  function buildSession(params = {}) {
    const { levelId, phaseId } = params
    const { level, phase } = resolvePhaseDefinition(levelId, phaseId)
    const recommendation = progressStore.getRecommendedSubtopic(levelId, phaseId)
    const subtopicId = toKey(params.subtopicId) ?? toKey(recommendation?.id) ?? ''
    const pool = getQuestionPool(level, phase, subtopicId)
    const startingDifficulty = resetSession({
      levelId,
      phaseId,
      subtopicId,
      difficulty: params.difficulty,
    }).difficulty
    const questions = selectQuestions({
      ...params,
      levelId,
      phaseId,
      subtopicId,
      difficulty: startingDifficulty,
      questions: pool,
      limit: params.limit ?? 7,
    })
    const context = buildContext(levelId, phaseId, subtopicId)

    return {
      levelId,
      phaseId,
      subtopicId,
      difficulty: startingDifficulty,
      subtopic:
        subtopicId !== ''
          ? progressStore.getSubtopicProgress(levelId, phaseId, subtopicId)
          : null,
      recommendation,
      questions,
      poolStats: getQuestionPoolStats(pool, context),
      session: getSessionState(),
    }
  }

  /**
   * Registra uma resposta já avaliada.
   *
   * @param {Object} answer
   * @param {unknown} answer.levelId
   * @param {unknown} answer.phaseId
   * @param {unknown} [answer.subtopicId]
   * @param {unknown} [answer.questionId]
   * @param {object} [answer.question]
   * @param {boolean} answer.isCorrect
   * @param {number} [answer.at]
   * @param {number} [answer.difficulty]
   * @param {number} [answer.timeRemaining]
   * @param {number} [answer.expectedQuestionCount]
   * @returns {object | null}
   */
  function recordAnswer(answer = {}) {
    const levelKey = toKey(answer.levelId)
    const phaseKey = toKey(answer.phaseId)

    if (!levelKey || !phaseKey) return null

    const question = answer.question ?? null
    const subtopicId =
      toKey(answer.subtopicId) ??
      toKey(question ? getQuestionSubtopicId(question) : '') ??
      'geral'
    const questionId =
      toKey(answer.questionId) ??
      toKey(question ? getQuestionId(question) : '') ??
      ''
    const { level, phase } = resolvePhaseDefinition(levelKey, phaseKey)
    const expectedQuestionCount =
      toNonNegativeInteger(answer.expectedQuestionCount) ||
      getQuestionPool(level, phase, subtopicId).length

    const result = progressStore.recordAnswer(
      levelKey,
      phaseKey,
      {
        subtopicId,
        questionId,
        isCorrect: answer.isCorrect === true,
        at: answer.at,
        difficulty: answer.difficulty,
        timeRemaining: answer.timeRemaining,
      },
      { expectedQuestionCount },
    )

    if (!result) return null

    const difficultyChange = applySessionAnswer(
      answer.isCorrect === true,
      answer.at,
    )

    return {
      ...result,
      expectedQuestionCount,
      difficulty: sessionDifficulty.value,
      difficultyChange,
      session: getSessionState(),
      subtopicProgress: progressStore.getSubtopicProgress(
        levelKey,
        phaseKey,
        subtopicId,
      ),
      recommendation: progressStore.getRecommendedSubtopic(levelKey, phaseKey),
    }
  }

  /**
   * Corrige e registra uma tentativa.
   *
   * @param {Object} attempt
   * @param {unknown} attempt.levelId
   * @param {unknown} attempt.phaseId
   * @param {object} attempt.question
   * @param {unknown} attempt.userAnswer
   * @param {boolean} [attempt.isCorrect] Resultado já calculado pelo jogo.
   * @param {unknown} [attempt.subtopicId]
   * @param {number} [attempt.at]
   * @param {number} [attempt.difficulty]
   * @param {number} [attempt.timeRemaining]
   * @param {number} [attempt.expectedQuestionCount]
   * @returns {object | null}
   */
  function recordAttempt(attempt = {}) {
    const question = attempt.question ?? null
    const isCorrect =
      typeof attempt.isCorrect === 'boolean'
        ? attempt.isCorrect
        : isAnswerCorrect(question, attempt.userAnswer)

    return recordAnswer({
      ...attempt,
      question,
      questionId: question ? getQuestionId(question) : attempt.questionId,
      subtopicId:
        toKey(attempt.subtopicId) ??
        toKey(question ? getQuestionSubtopicId(question) : ''),
      difficulty:
        attempt.difficulty ??
        question?.difficulty ??
        question?.dificuldade ??
        question?.level,
      isCorrect,
    })
  }

  /**
   * Registra várias tentativas em sequência.
   *
   * @param {object} params
   * @param {unknown} params.levelId
   * @param {unknown} params.phaseId
   * @param {object[]} params.answers
   * @returns {object[]}
   */
  function recordAttempts(params = {}) {
    const answers = Array.isArray(params.answers) ? params.answers : []
    const results = []

    for (const answer of answers) {
      const result = answer?.question
        ? recordAttempt({ ...params, ...answer })
        : recordAnswer({ ...params, ...answer })

      if (result) results.push(result)
    }

    return results
  }

  /**
   * @param {unknown} levelId
   * @param {unknown} phaseId
   * @returns {object | null}
   */
  function getRecommendation(levelId, phaseId) {
    return progressStore.getRecommendedSubtopic(levelId, phaseId)
  }

  /**
   * @param {unknown} levelId
   * @param {number} [limit]
   * @returns {object[]}
   */
  function getWeakSubtopics(levelId, limit = 3) {
    return progressStore.getWeakSubtopics(levelId, limit)
  }

  /**
   * @param {object} params
   * @param {unknown} params.levelId
   * @param {unknown} params.phaseId
   * @param {number} [params.limit]
   * @param {number} [params.now]
   * @returns {object[]}
   */
  function getReviewQueue(params = {}) {
    const { levelId, phaseId, limit, now } = params
    const { level, phase } = resolvePhaseDefinition(levelId, phaseId)
    const pool = getQuestionPool(level, phase)
    const context = {
      ...buildContext(levelId, phaseId, '', now),
      questionStates: getPhaseQuestionStates(levelId, phaseId),
    }

    return selector.selectReviewQuestions(pool, context, { limit })
  }

  /**
   * @param {object} params
   * @param {unknown} params.levelId
   * @param {unknown} params.phaseId
   * @param {number} [params.now]
   * @returns {object}
   */
  function getStats(params = {}) {
    const { levelId, phaseId, now } = params
    const { level, phase } = resolvePhaseDefinition(levelId, phaseId)
    const subtopics = progressStore.getPhaseSubtopics(levelId, phaseId)
    const pool = getQuestionPool(level, phase)
    const context = {
      now: now ?? getNow(),
      questionStates: getPhaseQuestionStates(levelId, phaseId),
    }
    const attempts = subtopics.reduce((total, item) => {
      return total + toNonNegativeInteger(item.attempts)
    }, 0)
    const correct = subtopics.reduce((total, item) => {
      return total + toNonNegativeInteger(item.correct)
    }, 0)
    const wrong = subtopics.reduce((total, item) => {
      return total + toNonNegativeInteger(item.wrong)
    }, 0)
    const accuracy = attempts > 0 ? correct / attempts : 0
    const completed =
      subtopics.length > 0 &&
      subtopics.every((item) => item.status === 'completed')

    return {
      levelId,
      phaseId,
      mastery: progressStore.getPhaseMastery(levelId, phaseId),
      attempts,
      correct,
      wrong,
      accuracy,
      accuracyPercent: Math.round(accuracy * 100),
      completed,
      subtopics,
      pool: getQuestionPoolStats(pool, context),
      recommendation: progressStore.getRecommendedSubtopic(levelId, phaseId),
    }
  }

  return {
    progress: progressStore,
    adaptiveConfig,
    selector,

    // Estado adaptativo da sessão (refs reativas).
    sessionDifficulty,
    correctStreak,
    wrongStreak,
    sessionState,
    getSessionState,
    resetSession,
    setSessionDifficulty(value) {
      sessionDifficulty.value = normalizeDifficulty(value)

      return getSessionState()
    },

    getLevels,
    resolvePhaseDefinition,
    getQuestionPool,
    getSubtopicState,
    getPhaseQuestionStates,
    buildContext,

    selectQuestions,
    buildSession,
    recordAnswer,
    recordAttempt,
    recordAttempts,
    getRecommendation,
    getWeakSubtopics,
    getReviewQueue,
    getStats,

    getSubtopicProgress(levelId, phaseId, subtopicId) {
      return progressStore.getSubtopicProgress(levelId, phaseId, subtopicId)
    },
    getPhaseSubtopics(levelId, phaseId) {
      return progressStore.getPhaseSubtopics(levelId, phaseId)
    },
  }
}

/**
 * @param {Parameters<typeof createAdaptiveLearning>[0]} [options]
 * @returns {ReturnType<typeof createAdaptiveLearning>}
 */
export function useAdaptiveLearning(options = {}) {
  return createAdaptiveLearning(options)
}

export default useAdaptiveLearning
