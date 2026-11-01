/**
 * Banco de questões de associação de pares.
 *
 * Estrutura padrão de uma questão:
 *
 * ```js
 * {
 *   id: 'q4',                  // identificador único da questão
 *   type: 'MatchingPairs',     // grafia canônica usada pelo projeto
 *   prompt: 'Ligue...',        // instrução exibida ao jogador
 *   pairs: [                   // itens das colunas A e B
 *     { left: 'Vue', right: 'Framework de UI' },
 *   ],
 *   correctAnswer: [           // opcional: assume o valor de `pairs`
 *     { left: 'Vue', right: 'Framework de UI' },
 *   ],
 *   explanation: '...',        // feedback exibido após a resposta
 *   points: 100,               // opcional: pontuação base
 *   timeLimit: 30,             // opcional: limite em segundos
 * }
 * ```
 *
 * Quando `correctAnswer` é omitido, o `useGame` usa `pairs` como gabarito.
 * Os pares também podem ser declarados como arrays (`['Vue', 'Framework']`)
 * ou como um objeto (`{ Vue: 'Framework' }`).
 */

export const matchingPairsQuestions = [
  {
    id: 'q4',
    type: 'MatchingPairs',
    prompt: 'Ligue cada ferramenta à sua função:',
    pairs: [
      { left: 'Vue', right: 'Framework de UI' },
      { left: 'Vite', right: 'Servidor de desenvolvimento' },
      { left: 'Pinia', right: 'Gerenciamento de estado' },
    ],
    explanation: 'Cada ferramenta tem um papel no ecossistema.',
  },
]

export default matchingPairsQuestions
