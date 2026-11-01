/**
 * Catálogo de níveis da aplicação.
 *
 * O router usa este catálogo para transformar os parâmetros de rota
 * (`:levelId` e `:phaseId`) nos dados que as views esperam receber.
 */

import Level01 from './Level01.js'

export const DEFAULT_LIVES = 3

export const LEVELS = Object.freeze([Level01])

/**
 * @param {unknown} levelId
 * @returns {object | null}
 */
export function findLevel(levelId) {
  if (levelId === undefined || levelId === null) return null

  const key = String(levelId)

  return LEVELS.find((level) => String(level?.id) === key) ?? null
}

/**
 * Aceita tanto array quanto objeto indexado por id.
 *
 * @param {unknown} phases
 * @returns {object[]}
 */
export function toPhaseArray(phases) {
  if (Array.isArray(phases)) return phases.filter(Boolean)
  if (!phases || typeof phases !== 'object') return []

  return Object.entries(phases).map(([id, phase]) => ({
    ...phase,
    id: phase?.id ?? id,
  }))
}

/**
 * @param {object | null} level
 * @param {unknown} phaseId
 * @returns {object | null}
 */
export function findPhase(level, phaseId) {
  if (!level || phaseId === undefined || phaseId === null) return null

  const key = String(phaseId)

  return toPhaseArray(level.phases).find((phase) => String(phase?.id) === key) ?? null
}

/**
 * Resolve o par nível/fase a partir dos IDs usados na rota.
 *
 * Níveis sem fases cadastradas recebem uma fase única (mesma regra usada
 * pelo `RoadmapView`), para que a rota continue válida.
 *
 * @param {unknown} levelId
 * @param {unknown} phaseId
 * @returns {{ level: object, phase: object } | null}
 */
export function resolvePhase(levelId, phaseId) {
  const level = findLevel(levelId)

  if (!level) return null

  const phase = findPhase(level, phaseId)

  if (phase) return { level, phase }

  const hasPhases = toPhaseArray(level.phases).length > 0

  if (!hasPhases && String(phaseId) === `${level.id}-fase-unica`) {
    return {
      level,
      phase: {
        id: `${level.id}-fase-unica`,
        title: level.title,
        questions: Array.isArray(level.questions) ? level.questions : [],
      },
    }
  }

  return null
}

export default LEVELS
