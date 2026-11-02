/**
 * Questões de exemplo da área de testes.
 *
 * Há uma questão para cada componente de exercício disponível em
 * `Source/Components/Exercises`. Os quatro tipos canônicos usam o próprio
 * tipo no `checkerType`; os componentes novos são validados como
 * `FillBlanks`, pois todos emitem texto ou listas de texto.
 */
import { EXERCISE_TYPES } from '../../Logic/AswerChecker.js'

const CANONICAL_GROUP = 'Tipos canônicos'
const EXTRA_GROUP = 'Novos exercícios'

/**
 * @typedef {Object} TestExercise
 * @property {string} id
 * @property {string} component Nome do componente em `Components/Exercises`.
 * @property {string} label Nome exibido no cabeçalho do cartão.
 * @property {string} group Grupo da área de testes.
 * @property {string} checkerType Tipo usado por `checkAnswer`.
 * @property {object} question Questão no formato esperado pelo componente.
 */

/** @type {ReadonlyArray<TestExercise>} */
export const TEST_EXERCISES = Object.freeze([
  {
    id: 'teste-multipla-escolha',
    component: 'MultipleChoise',
    label: 'Múltipla escolha',
    group: CANONICAL_GROUP,
    checkerType: EXERCISE_TYPES.MULTIPLE_CHOICE,
    question: {
      id: 'teste-multipla-escolha',
      type: EXERCISE_TYPES.MULTIPLE_CHOICE,
      prompt: 'Qual é o símbolo químico do carbono?',
      options: [
        { id: 'A', text: 'C' },
        { id: 'B', text: 'O' },
        { id: 'C', text: 'H' },
        { id: 'D', text: 'N' },
      ],
      correctAnswer: 'A',
      explanation:
        'O carbono é representado pelo símbolo C e possui quatro elétrons na camada de valência.',
    },
  },
  {
    id: 'teste-verdadeiro-falso',
    component: 'TrueOrFalse',
    label: 'Verdadeiro ou falso',
    group: CANONICAL_GROUP,
    checkerType: EXERCISE_TYPES.TRUE_OR_FALSE,
    question: {
      id: 'teste-verdadeiro-falso',
      type: EXERCISE_TYPES.TRUE_OR_FALSE,
      statement:
        'O carbono é tetravalente, ou seja, pode formar quatro ligações covalentes.',
      correctAnswer: true,
      explanation:
        'A tetravalência do carbono permite que ele forme quatro ligações covalentes.',
    },
  },
  {
    id: 'teste-completar-lacunas',
    component: 'FillBlanks',
    label: 'Completar lacunas',
    group: CANONICAL_GROUP,
    checkerType: EXERCISE_TYPES.FILL_BLANKS,
    question: {
      id: 'teste-completar-lacunas',
      type: EXERCISE_TYPES.FILL_BLANKS,
      prompt: 'Complete a frase sobre a tetravalência do carbono.',
      text: 'O carbono forma ___ ligações covalentes e pode se ligar a ___.',
      correctAnswer: ['quatro', 'outros carbonos'],
      explanation:
        'A tetravalência permite quatro ligações covalentes, inclusive com outros átomos de carbono.',
    },
  },
  {
    id: 'teste-combinar-pares',
    component: 'MatchingPairs',
    label: 'Combinar pares',
    group: CANONICAL_GROUP,
    checkerType: EXERCISE_TYPES.MATCHING_PAIRS,
    question: {
      id: 'teste-combinar-pares',
      type: EXERCISE_TYPES.MATCHING_PAIRS,
      prompt: 'Relacione cada hidrocarboneto ao tipo de ligação predominante.',
      pairs: [
        { id: 'P1', left: 'Alcano', right: 'Ligação simples' },
        { id: 'P2', left: 'Alceno', right: 'Ligação dupla' },
        { id: 'P3', left: 'Alcino', right: 'Ligação tripla' },
      ],
      correctAnswer: [
        { id: 'P1', left: 'Alcano', right: 'Ligação simples' },
        { id: 'P2', left: 'Alceno', right: 'Ligação dupla' },
        { id: 'P3', left: 'Alcino', right: 'Ligação tripla' },
      ],
      explanation:
        'A insaturação presente na cadeia define a classe do hidrocarboneto.',
    },
  },
  {
    id: 'teste-construir-cadeia',
    component: 'ChainBuilder',
    label: 'Construir cadeia',
    group: EXTRA_GROUP,
    checkerType: EXERCISE_TYPES.FILL_BLANKS,
    question: {
      id: 'teste-construir-cadeia',
      prompt: 'Monte a estrutura do etanol na ordem correta.',
      items: ['CH3', 'CH2', 'OH'],
      correctAnswer: ['CH3', 'CH2', 'OH'],
      explanation:
        'O etanol é formado por dois carbonos ligados entre si e a um grupo hidroxila.',
    },
  },
  {
    id: 'teste-grupo-funcional',
    component: 'FunctionalGroupFinder',
    label: 'Grupo funcional',
    group: EXTRA_GROUP,
    checkerType: EXERCISE_TYPES.FILL_BLANKS,
    question: {
      id: 'teste-grupo-funcional',
      prompt: 'Identifique o grupo funcional presente na estrutura.',
      molecule: 'CH3 — CH2 — OH',
      text: 'A estrutura apresenta o grupo funcional ___.',
      correctAnswer: 'álcool',
      explanation:
        'O grupo —OH ligado a um carbono saturado caracteriza a função álcool.',
    },
  },
  {
    id: 'teste-corrigir-nomenclatura',
    component: 'NomenclatureErrorSpotter',
    label: 'Correção de nomenclatura',
    group: EXTRA_GROUP,
    checkerType: EXERCISE_TYPES.FILL_BLANKS,
    question: {
      id: 'teste-corrigir-nomenclatura',
      prompt: 'Corrija o nome do composto apresentado.',
      wrongName: '3-metilbutano',
      molecule: 'CH3 — CH(CH3) — CH3',
      text: 'O nome IUPAC correto é ___.',
      correctAnswer: '2-metilbutano',
      explanation:
        'A numeração deve começar pela extremidade que deixa o substituinte com o menor número possível.',
    },
  },
  {
    id: 'teste-ranking-propriedades',
    component: 'PropertyRanking',
    label: 'Ranking de propriedades',
    group: EXTRA_GROUP,
    checkerType: EXERCISE_TYPES.FILL_BLANKS,
    question: {
      id: 'teste-ranking-propriedades',
      prompt: 'Ordene os compostos por ponto de ebulição crescente.',
      items: ['etano', 'propano', 'butano'],
      text: 'Ordem crescente: ___ < ___ < ___.',
      correctAnswer: ['etano', 'propano', 'butano'],
      explanation:
        'Quanto maior a cadeia carbônica, maior tende a ser o ponto de ebulição.',
    },
  },
  {
    id: 'teste-rota-reacional',
    component: 'ReactionPathSelector',
    label: 'Rota reacional',
    group: EXTRA_GROUP,
    checkerType: EXERCISE_TYPES.FILL_BLANKS,
    question: {
      id: 'teste-rota-reacional',
      prompt: 'Indique o mecanismo predominante da reação.',
      reaction: 'CH3Br + OH⁻ → CH3OH + Br⁻',
      text: 'A reação ocorre predominantemente por mecanismo ___.',
      correctAnswer: 'SN2',
      explanation:
        'Um substrato primário com nucleófilo forte favorece o mecanismo SN2.',
    },
  },
])

export default TEST_EXERCISES
