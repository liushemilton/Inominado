/**
 * Cálculo de pontuação do jogo.
 *
 * A pontuação é composta por:
 * - pontos-base por acerto;
 * - bônus de combo (sequência de acertos);
 * - bônus de tempo restante;
 * - bônus de precisão ao final;
 * - penalidade opcional por erro.
 *
 * O módulo é puro e não depende de Vue.
 */

/**
 * @typedef {Object} ScoringConfig
 * @property {number} basePoints Pontos por resposta correta.
 * @property {number} comboStep Incremento percentual por acerto consecutivo (0.2 = +20%).
 * @property {number} maxComboMultiplier Multiplicador máximo do combo.
 * @property {number} timeBonusPerSecond Pontos por segundo restante.
 * @property {number} maxTimeBonus Limite do bônus de tempo.
 * @property {number} accuracyBonus Bônus máximo ao acertar 100% das questões.
 * @property {number} wrongAnswerPenalty Pontos descontados por erro.
 */

/** @type {Readonly<ScoringConfig>} */
export const DEFAULT_SCORING = Object.freeze({
  basePoints: 100,
  comboStep: 0.2,
  maxComboMultiplier: 2.5,
  timeBonusPerSecond: 2,
  maxTimeBonus: 300,
  accuracyBonus: 250,
  wrongAnswerPenalty: 0,
})

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function toNonNegativeNumber(value, fallback = 0) {
  const number = Number(value)

  if (!Number.isFinite(number)) return fallback

  return Math.max(0, number)
}

/**
 * Combina a configuração padrão com a configuração informada.
 *
 * @param {Partial<ScoringConfig>} [config]
 * @returns {ScoringConfig}
 */
function resolveConfig(config = {}) {
  return { ...DEFAULT_SCORING, ...config }
}

/**
 * Multiplicador de combo para uma sequência de acertos.
 * A primeira resposta correta usa multiplicador 1.
 *
 * @param {number} streak Quantidade de acertos consecutivos.
 * @param {Partial<ScoringConfig>} [config]
 * @returns {number}
 */
export function getComboMultiplier(streak, config = {}) {
  const rules = resolveConfig(config)
  const safeStreak = Math.max(1, Math.floor(toNonNegativeNumber(streak, 1)))
  const step = toNonNegativeNumber(rules.comboStep)

  return Math.min(1 + (safeStreak - 1) * step, rules.maxComboMultiplier)
}

/**
 * Bônus de tempo para os segundos restantes.
 *
 * @param {number} secondsRemaining
 * @param {Partial<ScoringConfig>} [config]
 * @returns {number}
 */
export function getTimeBonus(secondsRemaining, config = {}) {
  const rules = resolveConfig(config)
  const seconds = toNonNegativeNumber(secondsRemaining)
  const perSecond = toNonNegativeNumber(rules.timeBonusPerSecond)

  return Math.round(Math.min(seconds * perSecond, rules.maxTimeBonus))
}

/**
 * Calcula os pontos de uma única resposta.
 *
 * Respostas erradas retornam o valor negativo da penalidade
 * (normalmente 0). O chamador decide se deve limitar o placar a zero.
 *
 * @param {Object} params
 * @param {boolean} [params.isCorrect=false]
 * @param {number} [params.streak=1] Sequência após esta resposta.
 * @param {number} [params.timeRemaining=0] Segundos restantes na questão.
 * @param {number} [params.basePoints] Pontos-base específicos da questão.
 * @param {Partial<ScoringConfig>} [params.config]
 * @returns {number}
 */
export function calculateAnswerScore({
  isCorrect = false,
  streak = 1,
  timeRemaining = 0,
  basePoints,
  config = {},
} = {}) {
  const rules = resolveConfig(config)

  if (!isCorrect) {
    const penalty = toNonNegativeNumber(rules.wrongAnswerPenalty)

    return penalty > 0 ? -penalty : 0
  }

  const points = toNonNegativeNumber(basePoints, rules.basePoints)
  const multiplier = getComboMultiplier(streak, rules)
  const timeBonus = getTimeBonus(timeRemaining, rules)

  return Math.round(points * multiplier + timeBonus)
}

/**
 * Calcula a pontuação final da partida.
 *
 * Quando `answers` é informado, o cálculo é exato: cada resposta contribui
 * com seus próprios pontos-base, combo e tempo restante. Caso contrário,
 * a função usa os totais agregados (`correctAnswers`, `totalQuestions`,
 * `bestStreak`, `timeSpentSeconds` e `timeLimitSeconds`).
 *
 * @param {Object} [params]
 * @param {Array<{
 *   isCorrect?: boolean,
 *   streak?: number,
 *   basePoints?: number,
 *   timeRemaining?: number
 * }>} [params.answers] Histórico de respostas da partida.
 * @param {number} [params.correctAnswers] Total de acertos (modo agregado).
 * @param {number} [params.totalQuestions] Total de questões (modo agregado).
 * @param {number} [params.bestStreak] Melhor sequência de acertos (modo agregado).
 * @param {number} [params.timeSpentSeconds] Tempo gasto (modo agregado).
 * @param {number} [params.timeLimitSeconds] Tempo limite total (modo agregado).
 * @param {Partial<ScoringConfig>} [params.config]
 * @returns {{
 *   total: number,
 *   base: number,
 *   combo: number,
 *   timeBonus: number,
 *   accuracyBonus: number,
 *   penalty: number,
 *   correctAnswers: number,
 *   totalQuestions: number,
 *   bestStreak: number,
 *   accuracy: number,
 *   accuracyPercent: number
 * }}
 */
export function calculateFinalScore({
  answers = [],
  correctAnswers = 0,
  totalQuestions = 0,
  bestStreak = 0,
  timeSpentSeconds = 0,
  timeLimitSeconds = 0,
  config = {},
} = {}) {
  const rules = resolveConfig(config)
  const answerList = Array.isArray(answers) ? answers : []
  const hasAnswerHistory = answerList.length > 0

  let base = 0
  let combo = 0
  let timeBonus = 0
  let penalty = 0
  let correct = 0
  let computedBestStreak = 0
  let currentStreak = 0

  if (hasAnswerHistory) {
    for (const answer of answerList) {
      const isCorrect = Boolean(answer?.isCorrect)
      const answerBase = toNonNegativeNumber(
        answer?.basePoints,
        rules.basePoints,
      )

      if (isCorrect) {
        currentStreak = Math.max(
          1,
          Math.floor(toNonNegativeNumber(answer?.streak, currentStreak + 1)),
        )

        const multiplier = getComboMultiplier(currentStreak, rules)

        correct += 1
        computedBestStreak = Math.max(computedBestStreak, currentStreak)
        base += answerBase
        combo += answerBase * (multiplier - 1)
        timeBonus += getTimeBonus(answer?.timeRemaining, rules)
      } else {
        currentStreak = 0
        penalty += toNonNegativeNumber(rules.wrongAnswerPenalty)
      }
    }
  } else {
    correct = Math.min(
      Math.floor(toNonNegativeNumber(totalQuestions)),
      Math.floor(toNonNegativeNumber(correctAnswers)),
    )

    const total = Math.floor(toNonNegativeNumber(totalQuestions))
    const streak = Math.floor(toNonNegativeNumber(bestStreak))
    const remainingTime =
      toNonNegativeNumber(timeLimitSeconds) -
      toNonNegativeNumber(timeSpentSeconds)

    base = correct * rules.basePoints
    combo = correct > 0 ? base * (getComboMultiplier(streak || 1, rules) - 1) : 0
    timeBonus = getTimeBonus(remainingTime, rules)
    penalty = (total - correct) * toNonNegativeNumber(rules.wrongAnswerPenalty)
    computedBestStreak = streak
  }

  const resolvedTotal = Math.max(
    answerList.length,
    Math.floor(toNonNegativeNumber(totalQuestions, answerList.length)),
  )

  const accuracy = resolvedTotal > 0 ? Math.min(1, correct / resolvedTotal) : 0
  const accuracyBonus = Math.round(
    accuracy * toNonNegativeNumber(rules.accuracyBonus),
  )

  const total = Math.max(
    0,
    Math.round(base + combo + timeBonus + accuracyBonus - penalty),
  )

  return {
    total,
    base: Math.round(base),
    combo: Math.round(combo),
    timeBonus: Math.round(timeBonus),
    accuracyBonus,
    penalty: Math.round(penalty),
    correctAnswers: correct,
    totalQuestions: resolvedTotal,
    bestStreak: computedBestStreak,
    accuracy,
    accuracyPercent: Math.round(accuracy * 100),
  }
}

/** Alias mais curto para o cálculo da pontuação final. */
export { calculateFinalScore as calculateScore }

export default calculateFinalScore
