<script lang="ts">
    export let label: string;
</script>

<button type="button" on:click class="inline-flex items-center px-2 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white dark:text-black bg-accent dark:bg-accent-pale hover:bg-accent-hover dark:hover:bg-accent-palehover">
    <div class="pr-1">
        <slot></slot>
    </div>
    {label}
</button>
