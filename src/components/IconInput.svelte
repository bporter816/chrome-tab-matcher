<script lang="ts">
    export let placeholder: string;
    export let value: string;
    export let tabGroups: chrome.tabGroups.TabGroup[];

    let color: chrome.tabGroups.ColorEnum | null;
    let classColor: chrome.tabGroups.ColorEnum;

    function updateColor(tabGroups: chrome.tabGroups.TabGroup[], value: string) {
        for (let i = 0; i < tabGroups.length; i++) {
            if (value === tabGroups[i].title) {
                return tabGroups[i].color;
            }
        }
        return null;
    }

    $: {
        color = updateColor(tabGroups, value);
        classColor = color === null ? 'grey' : color;
    }
</script>

<div>
    <div class="mt-1 relative rounded-md shadow-sm">
        <div class="absolute inset-y-0 left-0 pl-3 flex justify-center items-center pointer-events-none">
            {#if color === null}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 stroke-black dark:stroke-white">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {:else}
            <span class="bg-chrome{color} dark:bg-chrome{color}-pale h-4 w-4 rounded-full" aria-hidden="true"></span>
            {/if}
        </div>
        <input type="input" bind:value class="form-input bg-input dark:bg-input-dark text-black dark:text-white shadow-sm focus:ring-chrome{classColor} focus:border-chrome{classColor} dark:focus:ring-chrome{classColor}-pale dark:focus:border-chrome{classColor}-pale block w-full pl-9 sm:text-sm border-gray-300 dark:border-neutral-800 rounded-md" placeholder={placeholder} />
    </div>
</div>
