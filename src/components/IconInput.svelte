<script lang="ts">
interface Props {
    placeholder: string;
    value: string;
    tabGroups: chrome.tabGroups.TabGroup[];
}

let { placeholder, value = $bindable(), tabGroups }: Props = $props();

function updateColor(tabGroups: chrome.tabGroups.TabGroup[], value: string) {
    for (let i = 0; i < tabGroups.length; i++) {
        if (value === tabGroups[i].title) {
            return tabGroups[i].color;
        }
    }
    return null;
}

let color: chrome.tabGroups.ColorEnum | null = $derived(
    updateColor(tabGroups, value),
);
let classColor: chrome.tabGroups.ColorEnum | "grey" = $derived(
    color === null ? "grey" : color,
);
</script>

<div>
    <div class="mt-1 relative rounded-md shadow-xs">
        <div class="absolute inset-y-0 left-0 pl-3 flex justify-center items-center pointer-events-none">
            {#if color === null}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 stroke-black dark:stroke-white" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {:else}
            <span class="bg-chrome{color} dark:bg-chrome{color}-pale h-4 w-4 rounded-full" aria-hidden="true"></span>
            {/if}
        </div>
        <input type="input" bind:value class="nodrag form-input bg-input dark:bg-input-dark text-black dark:text-white shadow-xs focus:ring-chrome{classColor} focus:border-chrome{classColor} dark:focus:ring-chrome{classColor}-pale dark:focus:border-chrome{classColor}-pale block w-full pl-9 sm:text-sm border-gray-300 dark:border-neutral-800 rounded-md" placeholder={placeholder} />
    </div>
</div>
