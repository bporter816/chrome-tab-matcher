import App from './App.svelte';

let rules = null, tabGroups = null;

let app = null;

chrome.storage.local.get(['rules'], function(result) {
    if (chrome.runtime.lastError) {
        console.log('load error: ', chrome.runtime.lastError);
    } else {
        console.log('loaded: ', result.rules);
        rules = result.rules;
        chrome.tabGroups.query({})
        .then(function(result) {
            tabGroups = result;

            app = new App({
	            target: document.body,
	            props: {
                    rules: rules,
                    tabGroups: tabGroups
	            }
            });
        });
    }
});

export default app;
