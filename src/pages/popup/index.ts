import Popup from '../../components/Popup.svelte';

function hydrate() {
    new Popup({
        target: document.getElementById('app')
    });
}

document.addEventListener('DOMContentLoaded', hydrate);
