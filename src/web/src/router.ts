import { createRouter, createWebHistory } from 'vue-router'
const DashboardView = () => import('./views/DashboardView.vue')
const LoginView = () => import('./views/LoginView.vue')
const RegisterView = () => import('./views/RegisterView.vue')
const ProjectsView = () => import('./views/ProjectsView.vue')
const ProjectFormView = () => import('./views/ProjectFormView.vue')
const ProjectDetailView = () => import('./views/ProjectDetailView.vue')
const FinanceView = () => import('./views/FinanceView.vue')
const SearchView = () => import('./views/SearchView.vue')
const SettingsView = () => import('./views/SettingsView.vue')
const ImportView = () => import('./views/ImportView.vue')
const NotFoundView = () => import('./views/NotFoundView.vue')
import { session } from './api'
const router = createRouter({ history: createWebHistory(), routes: [
  { path: '/login', component: LoginView, meta: { public: true } }, { path: '/register', component: RegisterView, meta: { public: true } },
  { path: '/', component: DashboardView }, { path: '/projects', component: ProjectsView }, { path: '/projects/new', component: ProjectFormView, meta: { write: true } }, { path: '/projects/:id/edit', component: ProjectFormView, meta: { write: true } }, { path: '/projects/:id', component: ProjectDetailView },
  { path: '/finance', component: FinanceView }, { path: '/search', component: SearchView }, { path: '/settings', component: SettingsView }, { path: '/imports/history', component: ImportView, meta: { write: true } }, { path: '/:pathMatch(.*)*', component: NotFoundView }
] })
router.beforeEach(async to => { const user = await session.restore(); if (!to.meta.public && !user) return { path: '/login', query: { redirect: to.fullPath } }; if (to.meta.write && user?.role === 'DEMO') return '/projects'; if (to.meta.public && user && (to.path === '/login' || to.path === '/register')) return '/' })
export default router
