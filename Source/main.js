import { createApp } from 'vue'

import './Assets/Styles/Reset.css'
import './Assets/Styles/Variables.css'
import './Assets/Styles/Main.css'

import App from './App.vue'
import router from './Router/index.js'

createApp(App).use(router).mount('#app')
