import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { TRAILS } from './index.js'

describe('trilha de estudos de Química Orgânica', () => {
  it('expõe 11 tópicos, todos com subtópicos', () => {
    const trail = TRAILS[0]

    assert.equal(trail.title, 'Química Orgânica')
    assert.equal(trail.topics.length, 11)

    for (const topic of trail.topics) {
      assert.ok(topic.id)
      assert.ok(topic.title)
      assert.ok(topic.subtopics.length > 0)
    }
  })

  it('mantém ids únicos em toda a hierarquia', () => {
    const ids = []

    for (const trail of TRAILS) {
      for (const topic of trail.topics) {
        ids.push(topic.id)

        for (const subtopic of topic.subtopics) {
          ids.push(subtopic.id)

          for (const child of subtopic.children ?? []) {
            ids.push(child.id)
          }
        }
      }
    }

    assert.equal(new Set(ids).size, ids.length)
  })

  it('preserva as subdivisões internas dos subtópicos', () => {
    const hidrocarbonetos = TRAILS[0].topics.find(
      (topic) => topic.title === 'Hidrocarbonetos',
    )
    const classificacao = hidrocarbonetos.subtopics.find((subtopic) =>
      subtopic.title.startsWith('Classificação das cadeias'),
    )

    assert.equal(classificacao.children.length, 4)
  })

  it('segue a ordem do roteiro, do octeto à reatividade', () => {
    const topics = TRAILS[0].topics

    assert.equal(topics[0].title, 'Regra do octeto')
    assert.equal(topics.at(-1).title, 'Reatividade dos compostos orgânicos')
  })
})
