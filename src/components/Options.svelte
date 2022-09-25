<script lang="ts">
    import Button from './Button.svelte';
    import Dropdown from './Dropdown.svelte';
    import Input from './Input.svelte';
    import IconInput from './IconInput.svelte';
    import { onMount } from 'svelte';
    import type { Data, Rule } from '../types';
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
                filter: ".nodrag",
                forceFallback: true,
                preventOnFilter: false,
                onUpdate: (evt: Sortable.SortableEvent) => {
                    // sortable doesn't communicate the state update back to svelte, so we need to manually trigger
                    // a state update using assignment
                    const el: Rule = data.rules.splice(evt.oldIndex, 1)[0];
                    data.rules.splice(evt.newIndex, 0, el);
                    data.rules = data.rules;
                },
            }
        );

        chrome.runtime.onMessage.addListener((request, _send, _sendResponse) => {
            if (request.type === 'updateGroups') {
                tabGroups = request.tabGroups;
            }
        });
    });

    function addRule() {
        data.rules = [...data.rules, { id: uuidv4(), type: RuleType.TabUrl, matchStr: '', tabGroup: '' }];
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

<div class="container mx-auto px-4">
    <h1 class="text-2xl text-black dark:text-white mt-2">Rules</h1>
    <p class="text-sm text-black dark:text-white py-1">
        Rules are evaluated top-to-bottom, and the tab is grouped with the first matching rule.
        You can drag and drop the rules to reorder them.
    </p>
    <p class="text-sm text-black dark:text-white py-1">
        Tabs are grouped when a page loads or when you manually refresh the groupings. This means you can manually
        move tabs and they will not be automatically regrouped until one of these conditions is met.
    </p>
    <p class="text-sm text-black dark:text-white py-1">
        Tabs that have been manually grouped with a group name not found in any rules will not be moved.
    </p>
    <p class="text-sm text-black dark:text-white py-1">If a tab group with the given name does not exist, one will be created.</p>
    <div class="flex justify-center py-2">
        <div class="px-2">
            <Button on:click={addRule} label="Add rule">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </Button>
        </div>
        <div class="px-2">
            <Button on:click={refresh} label="Refresh groupings">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12c0-1.232.046-2.453.138-3.662a4.006 4.006 0 013.7-3.7 48.678 48.678 0 017.324 0 4.006 4.006 0 013.7 3.7c.017.22.032.441.046.662M4.5 12l-3-3m3 3l3-3m12 3c0 1.232-.046 2.453-.138 3.662a4.006 4.006 0 01-3.7 3.7 48.657 48.657 0 01-7.324 0 4.006 4.006 0 01-3.7-3.7c-.017-.22-.032-.441-.046-.662M19.5 12l-3 3m3-3l3 3" />
                </svg>
            </Button>
        </div>
    </div>
    <div class="shadow-md overflow-hidden sm:rounded-md">
        <ul bind:this={list} class="divide-y divide-gray-300 dark:divide-neutral-800">
        {#each data.rules as rule, index (rule.id)}
            <li class="py-4 px-4 flex items-center bg-pane dark:bg-pane-dark">
                <div class="flex-none pr-1 text-sm text-black dark:text-white">{index + 1}: if</div>
                <div class="grow px-1">
                    <Dropdown options={[RuleType.TabUrl, RuleType.TabTitle]} bind:selected={rule.type} />
                </div>
                <div class="grow px-1">
                    <Input placeholder="regex" bind:value={rule.matchStr} />
                </div>
                <div class="flex-none px-1 text-sm text-black dark:text-white">add to</div>
                <div class="grow px-1">
                    <IconInput placeholder="tab group" bind:value={rule.tabGroup} tabGroups={tabGroups} />
                </div>
                <button on:click={() => deleteRule(index)} class="flex-none pl-3 text-sm font-medium text-accent dark:text-accent-pale hover:text-accent-hover dark:hover:text-accent-palehover">Delete</button>
            </li>
        {/each}
        </ul>
    </div>
</div>
