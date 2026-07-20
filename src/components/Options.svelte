<script lang="ts">
import Sortable from "sortablejs";
import type { Data } from "../types";
import { RuleType } from "../types";
import Button from "./Button.svelte";
import Dropdown from "./Dropdown.svelte";
import IconInput from "./IconInput.svelte";
import Input from "./Input.svelte";

interface Props {
    data: Data;
    tabGroups: chrome.tabGroups.TabGroup[];
}

let { data: initialData, tabGroups }: Props = $props();
// svelte-ignore state_referenced_locally -- intentionally seeding local state once from the initial prop
let data = $state(initialData);

function makeSortableList<T>(getItems: () => T[]) {
    return function sortableList(node: HTMLElement) {
        const sortable = Sortable.create(node, {
            animation: 150,
            filter: ".nodrag",
            forceFallback: true,
            preventOnFilter: false,
            onUpdate: (evt: Sortable.SortableEvent) => {
                if (evt.oldIndex === undefined || evt.newIndex === undefined) {
                    return;
                }
                const items = getItems();
                const el: T = items.splice(evt.oldIndex, 1)[0];
                items.splice(evt.newIndex, 0, el);
            },
        });

        return {
            destroy() {
                sortable.destroy();
            },
        };
    };
}

const sortableRuleList = makeSortableList(() => data.rules);
const sortableConsolidateRuleList = makeSortableList(() => data.consolidateRules);

chrome.runtime.onMessage.addListener((request, _send, _sendResponse) => {
    if (request.type === "updateGroups") {
        tabGroups = request.tabGroups;
    }
});

function addRule() {
    data.rules.push({ id: crypto.randomUUID(), type: RuleType.TabUrl, matchStr: "", tabGroup: "" });
}

function deleteRule(index: number) {
    data.rules.splice(index, 1);
}

function addConsolidateRule() {
    data.consolidateRules.push({ id: crypto.randomUUID(), matchStr: "", replaceStr: "" });
}

function deleteConsolidateRule(index: number) {
    data.consolidateRules.splice(index, 1);
}

function save(d: Data) {
    // chrome.storage.sync.set can't serialize a Svelte $state proxy (arrays inside it get
    // stored as plain objects), so snapshot it into plain data first
    chrome.storage.sync.set($state.snapshot(d), () => {
        console.log("Saved options");
    });
}

function refresh() {
    chrome.runtime.sendMessage({ type: "refresh" });
}

// save the data to chrome storage whenever it changes
$effect(() => {
    save(data);
});
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
    <p class="text-sm text-black dark:text-white py-1">
        "page content matches" rules check the page's visible text as of when it finished loading, so text added
        afterward (e.g. by client-side JavaScript) may not be seen until the page is refreshed or reloaded.
    </p>
    <div class="flex justify-center py-2">
        <div class="px-2">
            <Button onclick={addRule} label="Add rule">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </Button>
        </div>
        <div class="px-2">
            <Button onclick={refresh} label="Refresh groupings">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12c0-1.232.046-2.453.138-3.662a4.006 4.006 0 013.7-3.7 48.678 48.678 0 017.324 0 4.006 4.006 0 013.7 3.7c.017.22.032.441.046.662M4.5 12l-3-3m3 3l3-3m12 3c0 1.232-.046 2.453-.138 3.662a4.006 4.006 0 01-3.7 3.7 48.657 48.657 0 01-7.324 0 4.006 4.006 0 01-3.7-3.7c-.017-.22-.032-.441-.046-.662M19.5 12l-3 3m3-3l3 3" />
                </svg>
            </Button>
        </div>
    </div>
    <div class="shadow-md overflow-hidden sm:rounded-md">
        <ul use:sortableRuleList class="divide-y divide-gray-300 dark:divide-neutral-800">
        {#each data.rules as rule, index (rule.id)}
            <li class="py-4 px-4 flex items-center bg-pane dark:bg-pane-dark">
                <div class="flex-none pr-1 text-sm text-black dark:text-white">{index + 1}: if</div>
                <div class="grow px-1">
                    <Dropdown options={[RuleType.TabUrl, RuleType.TabTitle, RuleType.PageBody]} bind:selected={rule.type} />
                </div>
                <div class="grow px-1">
                    <Input placeholder="regex" bind:value={rule.matchStr} />
                </div>
                <div class="flex-none px-1 text-sm text-black dark:text-white">add to</div>
                <div class="grow px-1">
                    <IconInput placeholder="tab group" bind:value={rule.tabGroup} {tabGroups} />
                </div>
                <button type="button" onclick={() => deleteRule(index)} class="flex-none pl-3 text-sm font-medium text-accent dark:text-accent-pale hover:text-accent-hover dark:hover:text-accent-palehover">Delete</button>
            </li>
        {/each}
        </ul>
    </div>

    <h1 class="text-2xl text-black dark:text-white mt-6">Consolidate duplicate tabs</h1>
    <p class="text-sm text-black dark:text-white py-1">
        When enabled, opening or navigating to a URL that's already open in another tab will close the new tab and
        switch to the existing one instead.
    </p>
    <p class="text-sm text-black dark:text-white py-1">
        By default, two tabs are considered duplicates only if their URLs match exactly. You can add patterns below
        to treat similar URLs as duplicates too &mdash; for example, a GitHub pull request and its "/files" or
        "/commits" tab. Each pattern is a regex matched against the URL; if it matches, the URL is rewritten using the
        replacement (which may reference capture groups, e.g. "$1") before being compared. Patterns are evaluated
        top-to-bottom and the first match is used.
    </p>
    <div class="flex justify-center py-2">
        <label class="flex items-center gap-2 text-sm text-black dark:text-white">
            <input type="checkbox" bind:checked={data.consolidateEnabled} class="nodrag form-checkbox rounded-sm text-accent dark:text-accent-pale" />
            Enable tab consolidation
        </label>
    </div>
    <div class="flex justify-center py-2">
        <div class="px-2">
            <Button onclick={addConsolidateRule} label="Add pattern">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </Button>
        </div>
    </div>
    <div class="shadow-md overflow-hidden sm:rounded-md">
        <ul use:sortableConsolidateRuleList class="divide-y divide-gray-300 dark:divide-neutral-800">
        {#each data.consolidateRules as rule, index (rule.id)}
            <li class="py-4 px-4 flex items-center bg-pane dark:bg-pane-dark">
                <div class="flex-none pr-1 text-sm text-black dark:text-white">{index + 1}: if URL matches</div>
                <div class="grow px-1">
                    <Input placeholder="regex" bind:value={rule.matchStr} />
                </div>
                <div class="flex-none px-1 text-sm text-black dark:text-white">replace with</div>
                <div class="grow px-1">
                    <Input placeholder="replacement" bind:value={rule.replaceStr} />
                </div>
                <button type="button" onclick={() => deleteConsolidateRule(index)} class="flex-none pl-3 text-sm font-medium text-accent dark:text-accent-pale hover:text-accent-hover dark:hover:text-accent-palehover">Delete</button>
            </li>
        {/each}
        </ul>
    </div>
</div>
