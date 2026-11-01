/**
 * Nível de Química Orgânica.
 *
 * A trilha de estudos (`Source/Data/Trails`) é convertida em um nível
 * jogável: cada tópico do roteiro vira uma fase (subnível) e os subtópicos
 * ficam disponíveis para a criação das questões.
 *
 * As questões serão adicionadas posteriormente; por enquanto cada fase
 * expõe `questions` vazio para manter o mesmo formato aceito pelo jogo.
 */
import { TRAILS } from '../Trails/index.js'

const trail = TRAILS[0]

/**
 * Resume a quantidade de subtópicos de um tópico para exibição na fase.
 *
 * @param {object} topic
 * @returns {string}
 */
function describeTopic(topic) {
  const subtopics = Array.isArray(topic?.subtopics) ? topic.subtopics : []
  const count = subtopics.length

  return count === 1
    ? '1 subtópico neste módulo.'
    : `${count} subtópicos neste módulo.`
}

export const LevelQuimica = {
  id: 'nivel-quimica-organica',
  order: 1,
  title: trail.title,
  description: trail.description,
  phases: trail.topics.map((topic) => ({
    id: topic.id,
    order: topic.order,
    title: topic.title,
    description: describeTopic(topic),
    subtopics: topic.subtopics,
    questions: [],
  })),
}

export default LevelQuimica
