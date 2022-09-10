import type { Rule } from '../../types';
import { RuleType } from '../../types';

chrome.runtime.onInstalled.addListener(() => {
    console.log('Hello there');
});

// move a tab to the tab group with the given name
async function groupTab(tabId: number, tabGroupName: string) {
    let tabGroups = await chrome.tabGroups.query({title: tabGroupName});
    if (!tabGroups) {
        return;
    }

    if (tabGroups.length == 0) {
        let groupId = await chrome.tabs.group({tabIds: [tabId]});
        if (!groupId) {
            return;
        }

        let group = await chrome.tabGroups.update(groupId, {title: tabGroupName});
        if (!group) {
            return;
        }
    } else {
        let groupId = await chrome.tabs.group({groupId: tabGroups[0].id, tabIds: [tabId]});
        if (!groupId) {
            return;
        }
    }
}

// ungroup a tab
async function ungroupTab(tabId: number) {
    await chrome.tabs.ungroup([tabId]);
}

// process a tab according to the given rules
async function handleTab(rules: Rule[], tab: chrome.tabs.Tab) {
    for (let i = 0; i < rules.length; i++) {
        if (rules[i].matchStr === '' || rules[i].tabGroup === '') {
            continue;
        }
        let re = new RegExp(rules[i].matchStr);
        switch (rules[i].type) {
            case RuleType.TabUrl:
                if (re.test(tab.url)) {
                    await groupTab(tab.id, rules[i].tabGroup);
                    return;
                }
                break;
            case RuleType.TabTitle:
                if (re.test(tab.title)) {
                    await groupTab(tab.id, rules[i].tabGroup);
                    return;
                }
                break;
            default:
                console.log('Error: unknown rule type');
        }
    }
    await ungroupTab(tab.id);
}

// re-process all tabs
async function refresh() {
    let tabs = await chrome.tabs.query({});
    if (!tabs) {
        return;
    }

    let data = await chrome.storage.sync.get({ rules: [] });
    if (!data) {
        return;
    }

    for (let i = 0; i < tabs.length; i++) {
        // block so that if multiple tabs need to be added to a new group we ensure the new group exists
        await handleTab(data.rules, tabs[i]);
    }
}

// handle request to re-process all tabs
chrome.runtime.onMessage.addListener((request, _send, _sendResponse) => {
    if (request.type === 'refresh') {
        refresh();
    }
});

// group pages when they finish loading
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        let data = await chrome.storage.sync.get({ rules: [] });
        if (!data) {
            return;
        }

        handleTab(data.rules, tab);
    }
});
