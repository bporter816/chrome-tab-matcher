import Popup from '../../components/Popup.svelte';
import './index.css';

function hydrate() {
    new Popup({
        target: document.getElementById('app')
    });
}

document.addEventListener('DOMContentLoaded', hydrate);
