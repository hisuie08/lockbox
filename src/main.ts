import { createApp } from "vue";
import "./index.css";
import "vue-sonner/style.css";
import App from "./App.vue";
await navigator.serviceWorker.register("/sw.js");
await navigator.serviceWorker.ready;
createApp(App).mount("#root");
