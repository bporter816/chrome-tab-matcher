import Options from '../../components/Options.svelte';
import type { Data } from '../../types';
import './index.css';
import { mount } from "svelte";

async function hydrate() {
    let data = await chrome.storage.sync.get({ rules: [] } as Data) as Data;
    if (!data) {
        return;
    }

    let tabGroups = await chrome.tabGroups.query({});
    if (!tabGroups) {
        return;
    }

    mount(Options, {
            target: document.getElementById('app'),
            props: {
                data: data,
                tabGroups: tabGroups
            }
        });
}

document.addEventListener('DOMContentLoaded', hydrate);
