/**
 * Adaptador do banco de questões (versão modularizada).
 *
 * Cada categoria possui seu próprio arquivo JSON na pasta `QuestionBank/`.
 * Este módulo importa todos eles, unifica as questões e mantém a mesma 
 * interface esperada pelo jogo.
 */

import {
  EXERCISE_TYPES,
  normalizeExerciseType,
} from '../../Logic/AswerChecker.js'
import {
  normalizeDifficulty,
  toKey,
} from '../../Logic/ProgressManager.js'

// Importação dos arquivos modulares por categoria
import octetRule from './QuestionBank/OctetRule.json' with { type: 'json' }
import carbonCharacteristics from './QuestionBank/CarbonCharacteristics.json' with { type: 'json' }
import carbonHybridization from './QuestionBank/CarbonHybridization.json' with { type: 'json' }
import hydrocarbons from './QuestionBank/Hydrocarbons.json' with { type: 'json' }
import oxygenatedFunctions from './QuestionBank/OxygenatedFunctions.json' with { type: 'json' }
import nitrogenatedFunctions from './QuestionBank/NitrogenatedFunctions.json' with { type: 'json' }
import sulfonatedFunctions from './QuestionBank/SulfonatedFunctions.json' with { type: 'json' }
import organicHalides from './QuestionBank/OrganicHalides.json' with { type: 'json' }
import naturalPolymers from './QuestionBank/NaturalPolymers.json' with { type: 'json' }
import syntheticPolymers from './QuestionBank/SyntheticPolymers.json' with { type: 'json' }
import chemicalReactivity from './QuestionBank/ChemicalReactivity.json' with { type: 'json' }

const allBanks = [
  octetRule,
  carbonCharacteristics,
  carbonHybridization,
  hydrocarbons,
  oxygenatedFunctions,
  nitrogenatedFunctions,
  sulfonatedFunctions,
  organicHalides,
  naturalPolymers,
  syntheticPolymers,
  chemicalReactivity,
]

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Converte um valor textual em string sem espaços nas extremidades.
 *
 * @param {unknown} value
 * @param {string} [fallback]
 * @returns {string}
 */
function asText(value, fallback = '') {
  if (value === undefined || value === null) return fallback

  if (isPlainObject(value)) {
    return asText(
      value.texto ??
        value.text ??
        value.label ??
        value.value ??
        value.titulo ??
        value.title,
      fallback,
    )
  }

  return String(value).trim()
}

/**
 * Normaliza uma alternativa de múltipla escolha.
 *
 * @param {unknown} raw
 * @param {number} index
 * @returns {{ id: string, text: string, label: string } | null}
 */
export function normalizeAlternative(raw, index = 0) {
  if (!isPlainObject(raw)) {
    const text = asText(raw)

    if (!text) return null

    const id = String.fromCharCode(65 + index)

    return { id, text, label: text }
  }

  const id =
    toKey(raw.id) ??
    toKey(raw.value) ??
    toKey(raw.key) ??
    String.fromCharCode(65 + index)
  const text = asText(raw.texto ?? raw.text ?? raw.label ?? raw.value)

  if (!text) return null

  return { id, text, label: text }
}

/**
 * Normaliza um par do exercício de associação.
 *
 * Aceita `item`/`correspondencia` (formato do banco) e os nomes usados pelo
 * componente (`left`/`right`, `term`/`definition`, etc.).
 *
 * @param {unknown} raw
 * @param {number} index
 * @returns {{ id: string, left: string, right: string } | null}
 */
export function normalizePair(raw, index = 0) {
  const source = isPlainObject(raw) ? raw : {}
  const leftValue =
    source.item ??
    source.left ??
    source.term ??
    source.question ??
    source.source ??
    source.key ??
    source.from
  const rightValue =
    source.correspondencia ??
    source.correspondence ??
    source.right ??
    source.definition ??
    source.answer ??
    source.target ??
    source.value ??
    source.to

  if (leftValue === undefined || rightValue === undefined) return null

  const left = asText(leftValue)
  const right = asText(rightValue)

  if (!left || !right) return null

  return {
    id: toKey(source.id) ?? `P${index + 1}`,
    left,
    right,
  }
}

/**
 * Converte uma questão do banco para o formato usado pelo jogo.
 *
 * @param {unknown} raw
 * @param {number} [index]
 * @returns {object}
 */
export function normalizeQuestion(raw, index = 0) {
  const source = isPlainObject(raw) ? raw : {}
  const id = toKey(source.id) ?? `questao-${index + 1}`
  const type = normalizeExerciseType(source.tipo ?? source.type)
  const prompt = asText(
    source.enunciado ??
      source.prompt ??
      source.question ??
      source.statement ??
      source.text,
  )
  const explanation = asText(source.explicacao ?? source.explanation)
  const category = asText(source.categoria ?? source.category)
  const difficulty = normalizeDifficulty(
    source.dificuldade ?? source.difficulty ?? source.level,
  )
  const rawSubtopicIds = [
    ...(Array.isArray(source.subtopicIds) ? source.subtopicIds : []),
    source.subtopicId ?? source.subtopic ?? source.topicId,
  ]
  const subtopicIds = Array.from(
    new Set(rawSubtopicIds.map(toKey).filter(Boolean)),
  )

  const question = {
    id,
    type,
    prompt,
    statement: prompt,
    difficulty,
    category,
    explanation,
    subtopicIds,
    ...(subtopicIds.length === 1 ? { subtopicId: subtopicIds[0] } : {}),
  }

  if (type === EXERCISE_TYPES.MATCHING_PAIRS) {
    const rawPairs = Array.isArray(source.pares)
      ? source.pares
      : Array.isArray(source.pairs)
        ? source.pairs
        : []
    const pairs = rawPairs
      .map((pair, pairIndex) => normalizePair(pair, pairIndex))
      .filter((pair) => pair !== null)

    return {
      ...question,
      pairs,
      correctAnswer: pairs,
    }
  }

  const rawOptions =
    source.alternativas ??
    source.alternatives ??
    source.options ??
    source.choices
  const options = Array.isArray(rawOptions)
    ? rawOptions
        .map((option, optionIndex) => normalizeAlternative(option, optionIndex))
        .filter((option) => option !== null)
    : []

  if (options.length > 0) {
    return {
      ...question,
      options,
      alternatives: options,
      correctAnswer: source.resposta ?? source.correctAnswer,
    }
  }

  return {
    ...question,
    correctAnswer: source.resposta ?? source.correctAnswer,
  }
}

/**
 * Questões já normalizadas, unindo todos os arquivos do banco.
 *
 * @type {ReadonlyArray<object>}
 */
export const QUESTIONS = Object.freeze(
  allBanks
    .flatMap((bank) => (Array.isArray(bank.questoes) ? bank.questoes : []))
    .map((question, index) => normalizeQuestion(question, index)),
)

/**
 * Categorias na ordem em que aparecem nos bancos importados.
 *
 * @type {ReadonlyArray<string>}
 */
export const QUESTION_CATEGORIES = Object.freeze(
  Array.from(
    new Set(
      QUESTIONS.map((question) => question.category).filter((category) => {
        return category !== ''
      }),
    ),
  ),
)

/**
 * Metadados gerais do banco (baseados no primeiro arquivo).
 */
const baseMeta = octetRule || allBanks[0] || {}
export const QUESTION_BANK_META = Object.freeze({
  version: asText(baseMeta.versao),
  language: asText(baseMeta.idioma),
  subject: asText(baseMeta.disciplina),
  area: asText(baseMeta.area),
  description: asText(baseMeta.descricao),
  total: QUESTIONS.length,
})

/**
 * Remove acentos e normaliza caixa para comparar categorias.
 *
 * @param {unknown} value
 * @returns {string}
 */
function categoryKey(value) {
  return asText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Questões de uma categoria (tópico) do banco.
 *
 * @param {unknown} category
 * @returns {object[]}
 */
export function getQuestionsByCategory(category) {
  const key = categoryKey(category)

  if (!key) return []

  return QUESTIONS.filter((question) => {
    return categoryKey(question.category) === key
  })
}

/**
 * Resumo das categorias com a quantidade de questões.
 *
 * @returns {Array<{ title: string, count: number }>}
 */
export function getQuestionBankCategories() {
  return QUESTION_CATEGORIES.map((title) => ({
    title,
    count: getQuestionsByCategory(title).length,
  }))
}

export default QUESTIONS
