<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { session } from '../api'
const route = useRoute(), router = useRouter(); const bare = computed(() => ['/login', '/register'].includes(route.path))
const nav = [{ label: '驾驶舱', to: '/' }, { label: '项目', to: '/projects' }, { label: '经营', to: '/finance' }, { label: '设置', to: '/settings' }]
async function logout() { await session.logout(); router.push('/login') }
</script>
<template>
  <main v-if="bare"><slot /></main>
  <main v-else class="app-shell"><header class="topbar"><RouterLink class="brand" to="/">PM.</RouterLink><nav><RouterLink v-for="item in nav" :key="item.to" :to="item.to" class="nav-link">{{ item.label }}</RouterLink></nav><div class="top-spacer" /><RouterLink to="/search" class="top-search">⌘K　搜索</RouterLink><RouterLink v-if="!session.isDemo" to="/projects/new" class="button primary mini">＋ 新建项目</RouterLink><span v-else class="demo-pill">演示只读</span><button class="avatar" :title="`退出 ${session.user.value?.username || ''}`" @click="logout">{{(session.user.value?.username || '?').slice(0,2).toUpperCase()}}</button></header><section class="page"><div v-if="session.isDemo" class="notice">演示账户仅供浏览，所有演示数据均独立且不可修改。</div><slot /></section><nav class="mobile-nav"><RouterLink v-for="item in nav" :key="item.to" :to="item.to">{{ item.label }}</RouterLink></nav></main>
</template>
