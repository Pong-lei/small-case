import { createWebHistory, createRouter } from 'vue-router'
import instanceAnimation from './gif/instanceAnimation.gif'
import fireBall from './gif/fireBall.gif'
import airFlow from './gif/airFlow.gif'

export const routes = [
  { babelName: '', ishidden: true, path: '/', component: () => import('../views/home/index.vue') },
  { babelName: '动画实例', path: '/instanceAnimation', component: () => import('../views/instanceAnimation/index.vue'),img:instanceAnimation },
  { babelName: '火球', path:'/fireBall',component:()=>import ('../views/fireBall/index.vue'),img:fireBall},
  { babelName: '气流',path:'/airFlow',component:()=>import('../views/airFlow/index.vue'),img:airFlow}
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router