// import { createApp } from 'https://cdn.jsdelivr.net/npm/vue@3.0.5/dist/vue.esm-browser.js'
import { createApp } from 'vue';

const HelloVueApp = {
  data() {
    return {
      message: 'Hello Vue!!'
    }
  }
}

createApp(HelloVueApp).mount('#hello-vue')
