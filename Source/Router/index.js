/**
 * Rotas principais da aplicação.
 *
 * Mapa de navegação:
 *
 * - `roadmap`      → `/`                                        (RoadmapView)
 * - `game`         → `/nivel/:levelId/fase/:phaseId`            (GameView)
 * - `explanation`  → `/nivel/:levelId/fase/:phaseId/questao/:questionIndex/explicacao`
 *                                                               (ExplanationView)
 * - `result`       → `/nivel/:levelId/fase/:phaseId/resultado`  (ResultView)
 *
 * `levelId` e `phaseId` são obrigatórios: as views recebem os dados já
 * resolvidos pelo catálogo em `Source/Data/Levels/index.js`, nunca apenas IDs.
 * Os guards abaixo invalidam rotas com IDs desconhecidos (ou sem sessão
 * correspondente) antes que qualquer view seja montada, redirecionando para
 * uma rota válida em vez de renderizar uma tela vazia/quebrada.
 */

import { createRouter, createWebHistory } from 'vue-router'

import { resolvePhase } from '../Data/Levels/index.js'
import { ROUTE_NAMES } from './names.js'
import ExplanationRoute from './views/ExplanationRoute.vue'
import GameRoute from './views/GameRoute.vue'
import ResultRoute from './views/ResultRoute.vue'
import RoadmapRoute from './views/RoadmapRoute.vue'
import { lastAnswer, lastResult, sameId } from './session.js'

export { ROUTE_NAMES }

/**
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {true | import('vue-router').RouteLocationRaw}
 */
function requirePhase(to) {
  if (resolvePhase(to.params.levelId, to.params.phaseId)) return true

  return { name: ROUTE_NAMES.roadmap, replace: true }
}

/**
 * @param {unknown} stored
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {boolean}
 */
function matchesPhase(stored, to) {
  return Boolean(
    stored &&
      sameId(stored.levelId, to.params.levelId) &&
      sameId(stored.phaseId, to.params.phaseId),
  )
}

/**
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {true | import('vue-router').RouteLocationRaw}
 */
function requireAnswer(to) {
  const phaseCheck = requirePhase(to)

  if (phaseCheck !== true) return phaseCheck

  const answer = lastAnswer.value

  if (
    matchesPhase(answer, to) &&
    sameId(answer.questionIndex, to.params.questionIndex)
  ) {
    return true
  }

  // Sem resposta para esta questão: volta para a partida da fase.
  return {
    name: ROUTE_NAMES.game,
    params: { levelId: to.params.levelId, phaseId: to.params.phaseId },
    replace: true,
  }
}

/**
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {true | import('vue-router').RouteLocationRaw}
 */
function requireResult(to) {
  const phaseCheck = requirePhase(to)

  if (phaseCheck !== true) return phaseCheck

  if (matchesPhase(lastResult.value, to)) return true

  // Sem resultado armazenado (ex.: link direto): recomeça a fase.
  return {
    name: ROUTE_NAMES.game,
    params: { levelId: to.params.levelId, phaseId: to.params.phaseId },
    replace: true,
  }
}

export const routes = [
  {
    path: '/',
    alias: ['/roadmap'],
    name: ROUTE_NAMES.roadmap,
    component: RoadmapRoute,
  },
  {
    path: '/nivel/:levelId/fase/:phaseId/resultado',
    name: ROUTE_NAMES.result,
    component: ResultRoute,
    props: true,
    beforeEnter: requireResult,
  },
  {
    path: '/nivel/:levelId/fase/:phaseId/questao/:questionIndex(\\d+)/explicacao',
    name: ROUTE_NAMES.explanation,
    component: ExplanationRoute,
    props: (route) => ({
      levelId: route.params.levelId,
      phaseId: route.params.phaseId,
      questionIndex: Number(route.params.questionIndex),
    }),
    beforeEnter: requireAnswer,
  },
  {
    path: '/nivel/:levelId/fase/:phaseId',
    name: ROUTE_NAMES.game,
    component: GameRoute,
    props: true,
    beforeEnter: requirePhase,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: ROUTE_NAMES.roadmap },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router
