import Popup from '../../components/Popup.svelte';
import './index.css';
import { mount } from "svelte";

function hydrate() {
    mount(Popup, {
            target: document.getElementById('app')
        });
}

document.addEventListener('DOMContentLoaded', hydrate);
