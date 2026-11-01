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
  it('resolve nível e fase existentes com os dados do tópico', () => {
    const resolved = resolvePhase('nivel-quimica-organica', 'topico-01')

    assert.ok(resolved)
    assert.equal(resolved.level.id, 'nivel-quimica-organica')
    assert.equal(resolved.phase.id, 'topico-01')
    assert.equal(resolved.phase.title, 'Regra do octeto')
    assert.ok(Array.isArray(resolved.phase.questions))
    assert.ok(resolved.phase.subtopics.length > 0)
  })

  it('retorna null para nível ou fase inexistente', () => {
    assert.equal(resolvePhase('nivel-99', 'topico-01'), null)
    assert.equal(resolvePhase('nivel-quimica-organica', 'topico-99'), null)
    assert.equal(resolvePhase(undefined, 'topico-01'), null)
  })

  it('expõe o catálogo com a trilha de Química Orgânica', () => {
    assert.ok(LEVELS.length > 0)
    assert.equal(findLevel('nivel-quimica-organica'), LEVELS[0])
    assert.equal(findLevel('nivel-99'), null)
    assert.equal(LEVELS[0].phases.length, 11)
  })

  it('mapeia cada tópico para uma fase com subtópicos e questões vazias', () => {
    for (const phase of LEVELS[0].phases) {
      assert.ok(phase.id)
      assert.ok(phase.title)
      assert.ok(phase.subtopics.length > 0)
      assert.deepEqual(phase.questions, [])
    }
  })

  it('encontra fases por id e aceita fases em formato de objeto', () => {
    const level = LEVELS[0]
    const phase = findPhase(level, 'topico-02')

    assert.equal(phase?.id, 'topico-02')
    assert.equal(phase?.title, 'Características do carbono')

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
