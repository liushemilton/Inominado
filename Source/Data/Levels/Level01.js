/**
 * Nível 01 — Fundamentos de Vue.
 *
 * O nível é dividido em fases. Cada fase possui as questões que serão
 * entregues ao `GameView`. A ordem das fases também define a ordem de
 * desbloqueio usada pelo `RoadmapView`.
 *
 * As questões ficam em `Source/Data/Questions/`, separadas por tipo de
 * exercício, para servir de exemplo do formato padrão aceito pelo jogo.
 */
import { fillBlanksQuestions } from '../Questions/FillBlanks.js'
import { matchingPairsQuestions } from '../Questions/MatchingPairs.js'
import { multipleChoiseQuestions } from '../Questions/MultipleChoise.js'
import { trueOrFalseQuestions } from '../Questions/TrueOrFalse.js'

export const Level01 = {
  id: 'nivel-01',
  order: 1,
  title: 'Fundamentos de Vue',
  description:
    'Conceitos essenciais do framework: componentes, reatividade, templates e ferramentas do ecossistema.',
  phases: [
    {
      id: 'fase-01',
      order: 1,
      title: 'Primeiros conceitos',
      description: 'Reconheça a capital da França e o papel do Vue.js.',
      questions: [
        ...multipleChoiseQuestions,
        ...trueOrFalseQuestions,
      ],
    },
    {
      id: 'fase-02',
      order: 2,
      title: 'Preencha as lacunas',
      description: 'Complete a frase sobre reatividade e templates.',
      questions: fillBlanksQuestions,
    },
    {
      id: 'fase-03',
      order: 3,
      title: 'Associações',
      description: 'Ligue cada ferramenta do ecossistema à sua função.',
      questions: matchingPairsQuestions,
    },
  ],
}

export default Level01
