import Popup from "../../components/Popup.svelte";
import "./index.css";
import { mount } from "svelte";

const target = document.getElementById("app");
if (!target) {
    throw new Error("#app element not found");
}

mount(Popup, { target });
