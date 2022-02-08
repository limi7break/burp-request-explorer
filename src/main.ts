import 'normalize.css'
import './app.postcss'
import App from './App.svelte'

import 'simplebar'
import 'simplebar/dist/simplebar.css'

const app = new App({
    target: document.getElementById('app'),
})

export default app
