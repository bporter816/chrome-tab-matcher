import Popup from "../../components/Popup.svelte";
import "./index.css";
import { mount } from "svelte";

mount(Popup, {
    target: document.getElementById("app"),
});
