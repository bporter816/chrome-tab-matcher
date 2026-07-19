import Options from "../../components/Options.svelte";
import type { Data } from "../../types";
import "./index.css";
import { mount } from "svelte";

async function hydrate() {
    const data = (await chrome.storage.sync.get({ rules: [] })) as Data;
    const tabGroups = await chrome.tabGroups.query({});

    const target = document.getElementById("app");
    if (!target) {
        throw new Error("#app element not found");
    }

    mount(Options, {
        target,
        props: {
            data,
            tabGroups,
        },
    });
}

hydrate();
