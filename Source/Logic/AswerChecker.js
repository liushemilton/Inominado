/**
 * Validação de respostas dos exercícios.
 *
 * Tipos canônicos:
 * - "MultipleChoise"  (mantido com a grafia usada no projeto)
 * - "TrueOrFalse"
 * - "FillBlanks"
 * - "MatchingPairs"
 *
 * O módulo é puro: não altera as respostas recebidas e não depende de Vue.
 */

/** @typedef {'MultipleChoise' | 'TrueOrFalse' | 'FillBlanks' | 'MatchingPairs'} ExerciseType */

export const EXERCISE_TYPES = Object.freeze({
  MULTIPLE_CHOICE: 'MultipleChoise',
  TRUE_OR_FALSE: 'TrueOrFalse',
  FILL_BLANKS: 'FillBlanks',
  MATCHING_PAIRS: 'MatchingPairs',
})

const TRUE_VALUES = new Set([
  'true',
  't',
  '1',
  'yes',
  'y',
  'sim',
  's',
  'verdadeiro',
  'v',
])

const FALSE_VALUES = new Set(['false', 'f', '0', 'no', 'n', 'nao', 'falso'])

/**
 * Normaliza um texto para comparação:
 * remove acentos, converte para minúsculas, troca pontuação por espaço
 * e colapsa espaços repetidos.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extrai o valor comparável de uma alternativa.
 * Aceita tanto valores primitivos (id, índice, texto) quanto objetos
 * como `{ id: 'a', text: '...' }`.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function resolveChoiceValue(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if ('id' in value) return value.id
    if ('value' in value) return value.value
    if ('key' in value) return value.key
    if ('label' in value) return value.label
    if ('text' in value) return value.text
  }

  return value
}

/**
 * Compara dois valores de alternativa.
 *
 * @param {unknown} userValue
 * @param {unknown} correctValue
 * @returns {boolean}
 */
function choiceValuesMatch(userValue, correctValue) {
  const left = resolveChoiceValue(userValue)
  const right = resolveChoiceValue(correctValue)

  if (left === right) return true
  if (left == null || right == null) return false

  // Objetos sem id/value/key/label/text não têm uma representação segura.
  if (typeof left === 'object' || typeof right === 'object') return false

  return normalizeText(left) === normalizeText(right)
}

/**
 * Compara duas listas como multiconjuntos (a ordem não importa,
 * mas itens repetidos são considerados).
 *
 * @param {unknown[]} userValues
 * @param {unknown[]} correctValues
 * @returns {boolean}
 */
function unorderedValuesMatch(userValues, correctValues) {
  if (userValues.length !== correctValues.length) return false

  const remaining = correctValues.map((value) =>
    normalizeText(resolveChoiceValue(value)),
  )

  for (const userValue of userValues) {
    const key = normalizeText(resolveChoiceValue(userValue))
    const index = remaining.indexOf(key)

    if (index === -1) return false
    remaining.splice(index, 1)
  }

  return remaining.length === 0
}

/**
 * MultipleChoise:
 * - Resposta única: compara id, índice, texto ou objeto de alternativa.
 * - Múltiplas respostas: se qualquer lado for array, compara como conjunto.
 *
 * @param {unknown} userAnswer
 * @param {unknown} correctAnswer
 * @returns {boolean}
 */
function checkMultipleChoice(userAnswer, correctAnswer) {
  if (Array.isArray(userAnswer) || Array.isArray(correctAnswer)) {
    const userValues = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
    const correctValues = Array.isArray(correctAnswer)
      ? correctAnswer
      : [correctAnswer]

    return unorderedValuesMatch(userValues, correctValues)
  }

  return choiceValuesMatch(userAnswer, correctAnswer)
}

/**
 * Converte diferentes representações de booleano em `true`/`false`.
 * Retorna `null` quando o valor não é reconhecido.
 *
 * @param {unknown} value
 * @returns {boolean | null}
 */
function parseBoolean(value) {
  if (typeof value === 'boolean') return value

  if (typeof value === 'number') {
    if (value === 1) return true
    if (value === 0) return false
    return null
  }

  if (value && typeof value === 'object' && 'value' in value) {
    return parseBoolean(value.value)
  }

  if (typeof value === 'string') {
    const normalized = normalizeText(value)

    if (TRUE_VALUES.has(normalized)) return true
    if (FALSE_VALUES.has(normalized)) return false
  }

  return null
}

/**
 * TrueOrFalse:
 * aceita booleanos, 0/1 e textos como "true", "false", "sim", "não".
 *
 * @param {unknown} userAnswer
 * @param {unknown} correctAnswer
 * @returns {boolean}
 */
function checkTrueOrFalse(userAnswer, correctAnswer) {
  const userValue = parseBoolean(userAnswer)
  const correctValue = parseBoolean(correctAnswer)

  return userValue !== null && correctValue !== null && userValue === correctValue
}

/**
 * Converte uma resposta de FillBlanks em uma lista de lacunas.
 * Arrays representam uma lacuna por posição; objetos usam os valores.
 *
 * @param {unknown} value
 * @returns {unknown[]}
 */
function toFillBlanksValues(value) {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return Object.values(value)

  return [value]
}

/**
 * FillBlanks:
 * compara cada lacuna usando `normalizeText`.
 *
 * Formatos aceitos:
 * - `"resposta"`
 * - `["lacuna1", "lacuna2"]`
 * - `{ 0: "lacuna1", 1: "lacuna2" }`
 *
 * Para uma lacuna com várias respostas aceitas, use um array aninhado:
 * `correctAnswer: [["azul", "blue"]]`.
 *
 * @param {unknown} userAnswer
 * @param {unknown} correctAnswer
 * @returns {boolean}
 */
function checkFillBlanks(userAnswer, correctAnswer) {
  const userValues = toFillBlanksValues(userAnswer)
  const correctValues = toFillBlanksValues(correctAnswer)

  if (userValues.length !== correctValues.length) return false

  return correctValues.every((expected, index) => {
    const actual = userValues[index]

    if (Array.isArray(expected)) {
      return expected.some(
        (alternative) => normalizeText(alternative) === normalizeText(actual),
      )
    }

    return normalizeText(actual) === normalizeText(expected)
  })
}

/**
 * Converte um par em `[esquerda, direita]`.
 * Aceita arrays e objetos com nomes comuns de propriedades.
 *
 * @param {unknown} pair
 * @returns {[unknown, unknown] | null}
 */
function toPair(pair) {
  if (Array.isArray(pair)) {
    return pair.length >= 2 ? [pair[0], pair[1]] : null
  }

  if (pair && typeof pair === 'object') {
    const left =
      pair.left ??
      pair.leftId ??
      pair.term ??
      pair.question ??
      pair.source ??
      pair.key ??
      pair.from

    const right =
      pair.right ??
      pair.rightId ??
      pair.definition ??
      pair.answer ??
      pair.target ??
      pair.value ??
      pair.to

    if (left !== undefined && right !== undefined) {
      return [left, right]
    }
  }

  return null
}

/**
 * Converte a resposta de MatchingPairs em uma lista de pares.
 *
 * Formatos aceitos:
 * - `[{ left: 'A', right: '1' }]`
 * - `[['A', '1'], ['B', '2']]`
 * - `{ A: '1', B: '2' }`
 * - `new Map([['A', '1']])`
 *
 * @param {unknown} value
 * @returns {Array<[unknown, unknown]>}
 */
function toPairList(value) {
  if (Array.isArray(value)) {
    return value.map(toPair).filter((pair) => pair !== null)
  }

  if (value instanceof Map) {
    return Array.from(value.entries())
  }

  if (value && typeof value === 'object') {
    return Object.entries(value)
  }

  return []
}

/**
 * Cria uma chave estável para um par, independente da ordem dos pares
 * e de acentos/maiúsculas.
 *
 * @param {[unknown, unknown]} pair
 * @returns {string}
 */
function pairKey([left, right]) {
  return JSON.stringify([normalizeText(left), normalizeText(right)])
}

/**
 * MatchingPairs:
 * verifica se cada par informado existe na resposta correta,
 * sem aceitar pares repetidos. A ordem dos pares não importa.
 *
 * @param {unknown} userAnswer
 * @param {unknown} correctAnswer
 * @returns {boolean}
 */
function checkMatchingPairs(userAnswer, correctAnswer) {
  const userPairs = toPairList(userAnswer)
  const correctPairs = toPairList(correctAnswer)

  if (correctPairs.length === 0 || userPairs.length !== correctPairs.length) {
    return false
  }

  const remaining = correctPairs.map(pairKey)

  for (const pair of userPairs) {
    const key = pairKey(pair)
    const index = remaining.indexOf(key)

    if (index === -1) return false
    remaining.splice(index, 1)
  }

  return remaining.length === 0
}

/**
 * Valida a resposta do usuário de acordo com o tipo do exercício.
 *
 * @param {unknown} userAnswer Resposta produzida pelo componente.
 * @param {unknown} correctAnswer Resposta correta definida nos dados.
 * @param {ExerciseType | string} exerciseType Tipo do exercício.
 * @returns {boolean}
 * @throws {Error} Quando o tipo de exercício não é suportado.
 */
export function checkAnswer(userAnswer, correctAnswer, exerciseType) {
  switch (exerciseType) {
    case EXERCISE_TYPES.MULTIPLE_CHOICE:
    case 'MultipleChoice': // alias para a grafia correta
      return checkMultipleChoice(userAnswer, correctAnswer)

    case EXERCISE_TYPES.TRUE_OR_FALSE:
      return checkTrueOrFalse(userAnswer, correctAnswer)

    case EXERCISE_TYPES.FILL_BLANKS:
      return checkFillBlanks(userAnswer, correctAnswer)

    case EXERCISE_TYPES.MATCHING_PAIRS:
      return checkMatchingPairs(userAnswer, correctAnswer)

    default:
      throw new Error(`Tipo de exercício não suportado: "${exerciseType}"`)
  }
}

/**
 * Atalho para validar uma questão completa.
 *
 * @param {object | null | undefined} question
 * @param {unknown} userAnswer
 * @returns {boolean}
 */
export function checkQuestionAnswer(question, userAnswer) {
  if (!question) return false

  return checkAnswer(userAnswer, question.correctAnswer, question.type)
}

export default checkAnswer
