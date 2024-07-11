import { createWebHistory, createRouter } from 'vue-router'
import instanceAnimation from './gif/instanceAnimation.gif'

export const routes = [
  { babelName: '', ishidden: true, path: '/', component: () => import('../views/home/index.vue') },
  { babelName: '动画实例', path: '/instanceAnimation', component: () => import('../views/instanceAnimation/index.vue'),img:instanceAnimation },
  { babelName: '火球', path:'/fireBall',component:()=>import ('../views/fireBall/index.vue')}
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router