<script lang="ts">
interface Props {
    label: string;
    onclick?: (event: MouseEvent) => void;
    children?: import("svelte").Snippet;
}

let { label, onclick, children }: Props = $props();
</script>

<button type="button" {onclick} class="inline-flex items-center px-2 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white dark:text-black bg-accent dark:bg-accent-pale hover:bg-accent-hover dark:hover:bg-accent-palehover">
    <div class="pr-1">
        {@render children?.()}
    </div>
    {label}
</button>
