<script>
    export let rules = [];
    export let tabGroups = [];


    function saveRules() {
        chrome.storage.local.set({rules: rules}, function() {
            if (chrome.runtime.lastError) {
                console.log('error', chrome.runtime.lastError);
            } else {
                console.log('saved: ', rules);
            }
        });
    }


    function addNewRule() {
        rules = [...rules, {}];
    }

    function clear() {
        rules = [];
        saveRules();
    }

    function matchAll() {
        chrome.runtime.sendMessage({type: 'matchAll'});
    }
</script>

<main>
    <tr>
    {#each rules as rule}
    <tc>
    <p>if</p>
    <select bind:value={rule.type}>
        <option value="contains">contains text</option>
        <option value="regex">matches regex</option>
    </select>
    <input type="text" bind:value={rule.text} />
    <select bind:value={rule.group}>
        {#each tabGroups as group}
        <option value={group.title}>{group.title}</option>
        {/each}
    </select>
    </tc>
    {/each}
    <tc>
    <input type="button" on:click={addNewRule} value="Add New" />
    <input type="button" on:click={saveRules} value="Save" />
    <input type="button" on:click={clear} value="Clear data" />
    <input type="button" on:click={matchAll} value="Group all tabs" />
    </tc>
    </tr>
</main>

<style>
    main {
        width: 500px;
    }
</style>
