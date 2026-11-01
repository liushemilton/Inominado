/**
 * Composable responsável pelo estado de uma partida.
 *
 * Uso básico:
 *
 * ```js
 * const {
 *   currentQuestion,
 *   lives,
 *   score,
 *   feedback,
 *   isGameOver,
 *   submitAnswer,
 *   nextQuestion,
 * } = useGame({ questions, lives: 3 })
 *
 * submitAnswer('a')
 * nextQuestion()
 * ```
 *
 * Formato esperado de uma questão:
 * ```js
 * {
 *   id: 'q1',
 *   type: 'MultipleChoise',
 *   prompt: '...',
 *   correctAnswer: 'a',
 *   explanation: '...',
 *   points: 100,       // opcional
 *   timeLimit: 30,     // opcional, em segundos
 * }
 * ```
 */

import { computed, ref } from 'vue'

import {
  checkAnswer,
  EXERCISE_TYPES,
  normalizeExerciseType,
} from '../Logic/AswerChecker.js'
import {
  DEFAULT_SCORING,
  calculateAnswerScore,
  calculateFinalScore,
} from '../Logic/ScoreCalculator.js'

const DEFAULT_LIVES = 3

const DEFAULT_MESSAGES = Object.freeze({
  correct: 'Resposta correta!',
  incorrect: 'Resposta incorreta.',
})

/**
 * @typedef {'idle' | 'playing' | 'finished'} GameStatus
 * @typedef {'idle' | 'correct' | 'incorrect'} FeedbackStatus
 */

/**
 * @returns {{
 *   status: FeedbackStatus,
 *   isCorrect: boolean | null,
 *   message: string,
 *   points: number,
 *   explanation: string,
 *   correctAnswer: unknown,
 *   userAnswer: unknown
 * }}
 */
function createFeedback() {
  return {
    status: 'idle',
    isCorrect: null,
    message: '',
    points: 0,
    explanation: '',
    correctAnswer: null,
    userAnswer: null,
  }
}

/**
 * @param {unknown} questions
 * @returns {object[]}
 */
function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) return []

  return questions.filter(
    (question) => question && typeof question === 'object',
  )
}

/**
 * Resolve a resposta correta da questão.
 *
 * `MatchingPairs` pode declarar os pares em `pairs` (formato usado pelo
 * componente) em vez de repetir tudo em `correctAnswer`.
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
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function toPositiveInteger(value, fallback) {
  const number = Math.floor(Number(value))

  return Number.isFinite(number) && number > 0 ? number : fallback
}

/**
 * Cria o estado reativo da partida.
 *
 * @param {Object} [options]
 * @param {object[]} [options.questions] Questões iniciais.
 * @param {number} [options.lives=3] Vidas iniciais.
 * @param {Partial<import('../Logic/ScoreCalculator.js').ScoringConfig>} [options.scoring]
 * @param {{ correct?: string, incorrect?: string }} [options.messages]
 * @returns {object}
 */
export function useGame(options = {}) {
  const {
    questions: initialQuestions = [],
    lives: initialLives = DEFAULT_LIVES,
    scoring = {},
    messages = {},
  } = options

  const scoringConfig = { ...DEFAULT_SCORING, ...scoring }
  const feedbackMessages = { ...DEFAULT_MESSAGES, ...messages }
  const startingLives = toPositiveInteger(initialLives, DEFAULT_LIVES)

  const questions = ref(normalizeQuestions(initialQuestions))
  const currentIndex = ref(0)
  const lives = ref(startingLives)
  const maxLives = ref(startingLives)
  const score = ref(0)
  const correctCount = ref(0)
  const wrongCount = ref(0)
  const streak = ref(0)
  const bestStreak = ref(0)
  const answers = ref([])
  const feedback = ref(createFeedback())
  const status = ref(questions.value.length ? 'playing' : 'idle')
  const startedAt = ref(questions.value.length ? Date.now() : null)
  const finishedAt = ref(null)
  const questionStartedAt = ref(questions.value.length ? Date.now() : null)

  const totalQuestions = computed(() => questions.value.length)

  const currentQuestion = computed(() => {
    return questions.value[currentIndex.value] ?? null
  })

  const currentQuestionNumber = computed(() => {
    return totalQuestions.value === 0 ? 0 : currentIndex.value + 1
  })

  const answeredCount = computed(() => answers.value.length)

  const hasAnsweredCurrent = computed(() => {
    return feedback.value.status === 'correct' || feedback.value.status === 'incorrect'
  })

  const isLastQuestion = computed(() => {
    return totalQuestions.value > 0 && currentIndex.value >= totalQuestions.value - 1
  })

  const isGameOver = computed(() => {
    if (status.value === 'finished') return true
    if (status.value !== 'playing') return false

    return (
      lives.value <= 0 ||
      totalQuestions.value === 0 ||
      (isLastQuestion.value && hasAnsweredCurrent.value)
    )
  })

  const canSubmit = computed(() => {
    return (
      status.value === 'playing' &&
      Boolean(currentQuestion.value) &&
      lives.value > 0 &&
      !hasAnsweredCurrent.value
    )
  })

  const canAdvance = computed(() => {
    return (
      status.value === 'playing' &&
      lives.value > 0 &&
      hasAnsweredCurrent.value
    )
  })

  const progress = computed(() => {
    if (totalQuestions.value === 0) return 0

    return Math.min(
      100,
      Math.round((answeredCount.value / totalQuestions.value) * 100),
    )
  })

  const accuracy = computed(() => {
    if (answeredCount.value === 0) return 0

    return correctCount.value / answeredCount.value
  })

  const totalTimeLimit = computed(() => {
    return questions.value.reduce((total, question) => {
      return total + Math.max(0, Number(question.timeLimit) || 0)
    }, 0)
  })

  /**
   * Tempo decorrido desde o início da partida.
   * É recalculado quando o estado muda; para um contador em tempo real,
   * o componente pode chamar `getElapsedSeconds()` periodicamente.
   *
   * @returns {number}
   */
  function getElapsedSeconds() {
    if (!startedAt.value) return 0

    const end = finishedAt.value ?? Date.now()

    return Math.max(0, Math.round((end - startedAt.value) / 1000))
  }

  const elapsedSeconds = computed(() => getElapsedSeconds())

  const summary = computed(() => {
    return calculateFinalScore({
      answers: answers.value,
      totalQuestions: totalQuestions.value,
      timeSpentSeconds: elapsedSeconds.value,
      timeLimitSeconds: totalTimeLimit.value,
      config: scoringConfig,
    })
  })

  /**
   * Descobre quantos segundos restam na questão atual.
   *
   * @param {object | null} question
   * @param {unknown} explicitValue
   * @returns {number}
   */
  function resolveTimeRemaining(question, explicitValue) {
    const parsed = Number(explicitValue)

    if (
      explicitValue !== undefined &&
      explicitValue !== null &&
      Number.isFinite(parsed)
    ) {
      return Math.max(0, parsed)
    }

    const limit = Number(question?.timeLimit)

    if (Number.isFinite(limit) && limit > 0 && questionStartedAt.value) {
      const elapsed = (Date.now() - questionStartedAt.value) / 1000

      return Math.max(0, limit - elapsed)
    }

    return 0
  }

  /**
   * Finaliza a partida. Pode ser chamado manualmente pelo componente.
   *
   * @returns {void}
   */
  function finishGame() {
    if (status.value === 'finished') return

    status.value = 'finished'
    finishedAt.value = Date.now()
  }

  /**
   * Inicia ou reinicia a partida com uma lista de questões.
   *
   * @param {object[]} [nextQuestions] Nova lista; por padrão reutiliza a atual.
   * @param {Object} [gameOptions]
   * @param {number} [gameOptions.lives] Vidas da nova partida.
   * @returns {boolean} `true` se a partida começou com questões.
   */
  function startGame(nextQuestions = questions.value, gameOptions = {}) {
    const nextLives = toPositiveInteger(gameOptions.lives, maxLives.value)

    questions.value = normalizeQuestions(nextQuestions)
    currentIndex.value = 0
    lives.value = nextLives
    maxLives.value = nextLives
    score.value = 0
    correctCount.value = 0
    wrongCount.value = 0
    streak.value = 0
    bestStreak.value = 0
    answers.value = []
    feedback.value = createFeedback()
    finishedAt.value = null
    startedAt.value = questions.value.length ? Date.now() : null
    questionStartedAt.value = startedAt.value
    status.value = questions.value.length ? 'playing' : 'idle'

    return questions.value.length > 0
  }

  /**
   * Reinicia a partida atual mantendo as mesmas questões.
   *
   * @param {Object} [gameOptions]
   * @returns {boolean}
   */
  function restartGame(gameOptions = {}) {
    return startGame(questions.value, gameOptions)
  }

  /**
   * Envia a resposta da questão atual.
   *
   * A chamada é ignorada quando a questão já foi respondida, quando o jogo
   * terminou ou quando não há vidas. Nesses casos retorna `null`.
   *
   * @param {unknown} userAnswer
   * @param {Object} [submitOptions]
   * @param {number} [submitOptions.timeRemaining] Segundos restantes; se omitido,
   *   é calculado a partir de `question.timeLimit`.
   * @returns {object | null}
   */
  function submitAnswer(userAnswer, submitOptions = {}) {
    if (!canSubmit.value) return null

    const question = currentQuestion.value
    const correctAnswer = resolveCorrectAnswer(question)
    const timeRemaining = resolveTimeRemaining(
      question,
      submitOptions.timeRemaining,
    )

    let isCorrect = false

    try {
      isCorrect = checkAnswer(
        userAnswer,
        correctAnswer,
        question.type,
      )
    } catch (error) {
      // Um tipo inválido é um erro de dados: não deve derrubar a partida.
      console.error('[useGame] Não foi possível validar a resposta:', error)
      isCorrect = false
    }

    const nextStreak = isCorrect ? streak.value + 1 : 0
    const points = calculateAnswerScore({
      isCorrect,
      streak: isCorrect ? nextStreak : 1,
      timeRemaining,
      basePoints: question.points ?? question.basePoints,
      config: scoringConfig,
    })

    if (isCorrect) {
      streak.value = nextStreak
      bestStreak.value = Math.max(bestStreak.value, nextStreak)
      correctCount.value += 1
    } else {
      streak.value = 0
      wrongCount.value += 1
      lives.value = Math.max(0, lives.value - 1)
    }

    score.value = Math.max(0, score.value + points)

    const message = isCorrect
      ? question.correctMessage ?? feedbackMessages.correct
      : question.incorrectMessage ?? feedbackMessages.incorrect

    feedback.value = {
      status: isCorrect ? 'correct' : 'incorrect',
      isCorrect,
      message,
      points,
      explanation: question.explanation ?? '',
      correctAnswer,
      userAnswer,
    }

    answers.value.push({
      questionId: question.id ?? currentIndex.value,
      type: question.type,
      isCorrect,
      userAnswer,
      correctAnswer,
      streak: isCorrect ? nextStreak : 0,
      basePoints: question.points ?? question.basePoints,
      timeRemaining,
      points,
      answeredAt: Date.now(),
    })

    if (lives.value <= 0) {
      finishGame()
    }

    return feedback.value
  }

  /**
   * Avança para a próxima questão ou finaliza a partida.
   *
   * @returns {boolean} `true` se avançou; `false` se finalizou ou não pode avançar.
   */
  function nextQuestion() {
    if (status.value !== 'playing' || !hasAnsweredCurrent.value) return false

    if (lives.value <= 0) {
      finishGame()
      return false
    }

    if (isLastQuestion.value) {
      finishGame()
      return false
    }

    currentIndex.value += 1
    feedback.value = createFeedback()
    questionStartedAt.value = Date.now()

    return true
  }

  return {
    // Estado
    questions,
    currentIndex,
    currentQuestion,
    currentQuestionNumber,
    totalQuestions,
    lives,
    maxLives,
    score,
    correctCount,
    wrongCount,
    streak,
    bestStreak,
    answers,
    feedback,
    status,
    startedAt,
    finishedAt,

    // Derivados
    hasAnsweredCurrent,
    isLastQuestion,
    isGameOver,
    canSubmit,
    canAdvance,
    progress,
    accuracy,
    elapsedSeconds,
    summary,

    // Ações
    startGame,
    restartGame,
    submitAnswer,
    nextQuestion,
    finishGame,
    getElapsedSeconds,
  }
}

export default useGame
