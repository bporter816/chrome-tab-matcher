<script lang="ts">
    import { RuleType } from '../types';
    export let options: RuleType[];
    export let selected: RuleType;

    const mapping = {
        [RuleType.TabUrl]: 'URL matches',
        [RuleType.TabTitle]: 'title matches',
    };
</script>
<div>
    <select bind:value={selected} class="form-select block w-full rounded-md bg-input dark:bg-input-dark text-black dark:text-white shadow-sm focus:ring-accent dark:focus:ring-accent-pale focus:border-accent dark:focus:border-accent-pale border-gray-300 dark:border-neutral-800 sm:text-sm">
        {#each options as option}
            <option value={option}>{mapping[option]}</option>
        {/each}
    </select>
</div>
