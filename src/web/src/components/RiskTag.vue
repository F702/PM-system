<script setup lang="ts">defineProps<{ level?: 'danger'|'warning'|'success'; text: string }>()</script><template><span class="risk-tag" :class="level || 'warning'">{{ text }}</span></template>
