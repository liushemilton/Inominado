import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  LEVELS,
  findLevel,
  findPhase,
  resolvePhase,
  toPhaseArray,
} from './index.js'

describe('resolução de parâmetros de rota', () => {
  it('resolve nível e fase existentes com as questões da fase', () => {
    const resolved = resolvePhase('nivel-01', 'fase-01')

    assert.ok(resolved)
    assert.equal(resolved.level.id, 'nivel-01')
    assert.equal(resolved.phase.id, 'fase-01')
    assert.ok(resolved.phase.questions.length > 0)
  })

  it('retorna null para nível ou fase inexistente', () => {
    assert.equal(resolvePhase('nivel-99', 'fase-01'), null)
    assert.equal(resolvePhase('nivel-01', 'fase-99'), null)
    assert.equal(resolvePhase(undefined, 'fase-01'), null)
  })

  it('expõe o catálogo de níveis usado pelo router', () => {
    assert.ok(LEVELS.length > 0)
    assert.equal(findLevel('nivel-01'), LEVELS[0])
    assert.equal(findLevel('nivel-99'), null)
  })

  it('encontra fases por id e aceita fases em formato de objeto', () => {
    const level = LEVELS[0]
    const phase = findPhase(level, 'fase-02')

    assert.equal(phase?.id, 'fase-02')

    const asObject = toPhaseArray({
      'fase-01': { title: 'Uma' },
      'fase-02': { id: 'fase-02', title: 'Duas' },
    })

    assert.deepEqual(
      asObject.map((item) => item.id),
      ['fase-01', 'fase-02'],
    )
  })
})
