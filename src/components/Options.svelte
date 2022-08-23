<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import type { Rule, Data } from '../types';
    import { RuleType } from '../types';
    import { v4 as uuidv4 } from 'uuid';
    import Sortable from 'sortablejs';

    export let data: Data;
    export let tabGroups: chrome.tabGroups.TabGroup[];

    let list: HTMLElement;

    // save the data to chrome storage whenever it changes
    $: {
        save(data);
    }

    onMount(async () => {
        Sortable.create(
            list,
            {
                animation: 150,
                filter: "input",
                preventOnFilter: false,
                onUpdate: (evt) => {
                    // sortable doesn't communicate the state update back to svelte, so we need to manually trigger
                    // a state update using assignment
                    const el = data.rules.splice(evt.oldIndex, 1)[0];
                    data.rules.splice(evt.newIndex, 0, el);
                    data.rules = data.rules;
                },
            }
        );

        chrome.tabGroups.onCreated.addListener((tabGroup) => {
            console.log('Created tab group');
            tabGroups = [...tabGroups, tabGroup];
        });

        chrome.tabGroups.onUpdated.addListener((tabGroup) => {
            console.log('Updated tab group');
            for (let i = 0; i < tabGroups.length; i++) {
                if (tabGroups[i].id === tabGroup.id) {
                    tabGroups[i] = tabGroup;
                    return;
                }
            }
        });

        chrome.tabGroups.onRemoved.addListener((tabGroup) => {
            console.log('Removed tab group');
            tabGroups = tabGroups.filter((el: chrome.tabGroups.TabGroup) => {
                return el.title !== tabGroup.title;
            });
        });
    });

    function addRule() {
        data.rules = [...data.rules, { id: uuidv4(), matchStr: '', type: RuleType.Url, tabGroup: '' }];
    }

    function deleteRule(index: number) {
        data.rules.splice(index, 1);
        data.rules = data.rules;
    }

    function save(d: Data) {
        chrome.storage.sync.set(d, () => {
            console.log('Saved options');
        });
    }

    function refresh() {
        chrome.runtime.sendMessage({ type: 'refresh' });
    }
</script>

<div>
    <p>
        Rules are evaluated top-to-bottom, and the tab is grouped with the first matching rule.
        You can drag and drop the rules to reorder them.
    </p>
    <p>
        Tabs are grouped when a page loads or when you manually refresh the groupings. This means you can manually
        move tabs and they will not be automatically regrouped until one of these conditions is met.
    </p>
    <p>If a tab group with the given name does not exist, one will be created.</p>
    <div bind:this={list}>
        {#each data.rules as rule, index (rule.id)}
        <div>
            {index + 1}: match url regex
            <input bind:value={rule.matchStr} />
            to tab group
            <input bind:value={rule.tabGroup} />
            <button on:click={() => deleteRule(index)}>Delete</button>
        </div>
        {/each}
    </div>
    <hr />
    <button on:click={addRule}>Add Rule</button>
    <hr />
    <button on:click={refresh}>Refresh Groupings</button>
    <hr />
    <pre><code>State:</code></pre>
    <pre><code>{JSON.stringify(data.rules, null, 2)}</code></pre>
    <pre><code>Tab Groups:</code></pre>
    <pre><code>{JSON.stringify(tabGroups, null, 2)}</code></pre>
</div>
