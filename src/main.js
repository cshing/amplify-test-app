import Vue from 'vue'
import App from './App.vue'
import {
  applyPolyfills,
  defineCustomElements,
} from '@aws-amplify/ui-components/loader'
import Amplify from 'aws-amplify';
import aws_exports from './aws-exports';

Amplify.configure(aws_exports);

applyPolyfills().then(() => {
  defineCustomElements(window);
});

Vue.config.ignoredElements = [/amplify-\w*/];

new Vue({
  render: h => h(App),
}).$mount('#app')
