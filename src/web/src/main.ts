import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles.css'
import './kpi-overrides.css'
import App from './App.vue'
import router from './router'
createApp(App).use(router).use(ElementPlus).mount('#app')
