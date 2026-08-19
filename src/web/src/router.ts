import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from './views/DashboardView.vue'
import LoginView from './views/LoginView.vue'
import PasswordView from './views/PasswordView.vue'
import ProjectsView from './views/ProjectsView.vue'
import ProjectFormView from './views/ProjectFormView.vue'
import ProjectDetailView from './views/ProjectDetailView.vue'
import FinanceView from './views/FinanceView.vue'
import SearchView from './views/SearchView.vue'
import SettingsView from './views/SettingsView.vue'
import ImportView from './views/ImportView.vue'
import NotFoundView from './views/NotFoundView.vue'
import { session } from './api'
const router = createRouter({ history: createWebHistory(), routes: [
  { path: '/login', component: LoginView, meta: { public: true } }, { path: '/account/change-initial-password', component: PasswordView, meta: { public: true } },
  { path: '/', component: DashboardView }, { path: '/projects', component: ProjectsView }, { path: '/projects/new', component: ProjectFormView }, { path: '/projects/:id/edit', component: ProjectFormView }, { path: '/projects/:id', component: ProjectDetailView },
  { path: '/finance', component: FinanceView }, { path: '/search', component: SearchView }, { path: '/settings', component: SettingsView }, { path: '/imports/history', component: ImportView }, { path: '/:pathMatch(.*)*', component: NotFoundView }
] })
router.beforeEach(to => { if (!to.meta.public && !session.token) return '/login' })
export default router
