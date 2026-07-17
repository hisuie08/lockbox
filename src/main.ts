import { createApp } from "vue";
import "./index.css";
import "vue-sonner/style.css";
import App from "./App.vue";

const base = import.meta.env.BASE_URL;

await navigator.serviceWorker.register(`${base}sw.js`);
await navigator.serviceWorker.ready;
createApp(App).mount("#root");
