<script lang="ts">
    import Button from './Button.svelte';

    function refresh() {
        chrome.runtime.sendMessage({ type: 'refresh' });
    }

    function openOptions() {
        chrome.runtime.openOptionsPage(() => {
            console.log("Opened options page");
        });
    }
</script>

<div>
    <button on:click={refresh}>Refresh Groupings</button>
    <button on:click={openOptions}>Settings</button>
    <Button />
</div>
