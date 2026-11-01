/**
 * Nomes das rotas principais.
 *
 * Ficam em um módulo separado para evitar dependência circular entre o
 * router (`index.js`) e as views de rota.
 */
export const ROUTE_NAMES = Object.freeze({
  roadmap: 'roadmap',
  trail: 'trail',
  game: 'game',
  explanation: 'explanation',
  result: 'result',
})

export default ROUTE_NAMES
