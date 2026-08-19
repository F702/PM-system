<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { session } from '../api'
const route = useRoute(), router = useRouter(); const bare = computed(() => ['/login', '/account/change-initial-password'].includes(route.path))
const nav = [{ label: '驾驶舱', to: '/' }, { label: '项目', to: '/projects' }, { label: '经营', to: '/finance' }, { label: '设置', to: '/settings' }]
function logout() { session.clear(); router.push('/login') }
</script>
<template>
  <main v-if="bare"><slot /></main>
  <main v-else class="app-shell"><header class="topbar"><RouterLink class="brand" to="/">PM.</RouterLink><nav><RouterLink v-for="item in nav" :key="item.to" :to="item.to" class="nav-link">{{ item.label }}</RouterLink></nav><div class="top-spacer" /><RouterLink to="/search" class="top-search">⌘K　搜索</RouterLink><RouterLink to="/projects/new" class="button primary mini">＋ 新建项目</RouterLink><button class="avatar" title="退出登录" @click="logout">AD</button></header><section class="page"><slot /></section><nav class="mobile-nav"><RouterLink v-for="item in nav" :key="item.to" :to="item.to">{{ item.label }}</RouterLink></nav></main>
</template>
