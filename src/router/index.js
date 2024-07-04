import { createMemoryHistory, createRouter } from 'vue-router'

export const routes = [
  { babelName:'动画实例', path: '/instanceAnimation', component: () => import('../views/instanceAnimation/index.vue') },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

export default router