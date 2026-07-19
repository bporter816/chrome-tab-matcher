<script lang="ts">
interface Props {
    placeholder: string;
    value: string;
}

let { placeholder, value = $bindable() }: Props = $props();
</script>

<div>
    <input type="input" bind:value class="nodrag form-input bg-input dark:bg-input-dark text-black dark:text-white shadow-xs focus:ring-accent dark:focus:ring-accent-pale focus:border-accent dark:focus:border-accent-pale block w-full sm:text-sm border-gray-300 dark:border-neutral-800 rounded-md" placeholder={placeholder}>
</div>
