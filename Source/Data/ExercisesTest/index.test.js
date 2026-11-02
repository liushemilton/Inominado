import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { describe, it } from 'node:test'

import { TEST_EXERCISES } from './index.js'

const COMPONENT_NAMES = readdirSync(
  new URL('../../Components/Exercises/', import.meta.url),
)
  .filter((file) => file.endsWith('.vue'))
  .map((file) => file.slice(0, -'.vue'.length))

describe('questões da área de testes', () => {
  it('cobre cada componente de exercício exatamente uma vez', () => {
    const names = TEST_EXERCISES.map((exercise) => exercise.component)

    assert.deepEqual([...names].sort(), [...COMPONENT_NAMES].sort())
    assert.equal(new Set(names).size, names.length)
  })

  it('declara resposta correta, tipo de correção e identificação', () => {
    for (const exercise of TEST_EXERCISES) {
      assert.ok(exercise.id)
      assert.ok(exercise.label)
      assert.ok(exercise.checkerType)
      assert.ok(exercise.question)
      assert.ok(
        exercise.question.correctAnswer !== undefined ||
          Array.isArray(exercise.question.pairs),
      )
    }
  })
})
