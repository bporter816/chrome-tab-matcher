import type { Rule } from '../../types';
import { RuleType } from '../../types';

chrome.runtime.onInstalled.addListener(() => {
    console.log('Hello there');
});

// move a tab to the tab group with the given name
async function groupTab(tab: chrome.tabs.Tab, tabGroupName: string) {
    let tabGroups = await chrome.tabGroups.query({title: tabGroupName});
    if (!tabGroups) {
        return;
    }

    if (tabGroups.length == 0) {
        // group doesn't exist, create it
        let groupId = await chrome.tabs.group({tabIds: [tab.id]});
        if (!groupId) {
            return;
        }

        // name the new group
        let group = await chrome.tabGroups.update(groupId, {title: tabGroupName});
        if (!group) {
            return;
        }
    } else {
        // group already exists
        let groupId = await chrome.tabs.group({groupId: tabGroups[0].id, tabIds: [tab.id]});
        if (!groupId) {
            return;
        }

        // refocus on the tab after it's been moved, if it was actually moved
        if (tab.groupId !== groupId) {
            let highlightedTab = await chrome.tabs.update(tab.id, {highlighted: true});
            if (!highlightedTab) {
                return;
            }
            let tabDetails = await chrome.tabs.get(highlightedTab.id);
            if (!tabDetails) {
                return;
            }
            let windowUpdate = await chrome.windows.update(tabDetails.windowId, {focused: true});
            if (!windowUpdate) {
                return;
            }
        }
    }
}

// ungroup a tab
async function ungroupTab(tab: chrome.tabs.Tab) {
    await chrome.tabs.ungroup([tab.id]);
}

async function inManagedGroup(tab: chrome.tabs.Tab, names: Set<string>) {
    let group = await chrome.tabGroups.get(tab.groupId);
    if (!group) {
        return true;
    }

    return names.has(group.title);
}

// process a tab according to the given rules
async function handleTab(rules: Rule[], tab: chrome.tabs.Tab, names: Set<string>) {
    // ignore tab if it's in a user-defined group
    if (tab.groupId > 0) {
        let managed = await inManagedGroup(tab, names);
        if (!managed) {
            return;
        }
    }

    for (let i = 0; i < rules.length; i++) {
        if (rules[i].matchStr === '' || rules[i].tabGroup === '') {
            continue;
        }
        let re = new RegExp(rules[i].matchStr, 'i');
        switch (rules[i].type) {
            case RuleType.TabUrl:
                if (re.test(tab.url)) {
                    await groupTab(tab, rules[i].tabGroup);
                    return;
                }
                break;
            case RuleType.TabTitle:
                if (re.test(tab.title)) {
                    await groupTab(tab, rules[i].tabGroup);
                    return;
                }
                break;
            default:
                console.log('Error: unknown rule type');
        }
    }
    await ungroupTab(tab);
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

    let names = new Set<string>(data.rules.map((o: Rule) => o.tabGroup));

    for (let i = 0; i < tabs.length; i++) {
        // block so that if multiple tabs need to be added to a new group we ensure the new group exists
        await handleTab(data.rules, tabs[i], names);
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

        let names = new Set<string>(data.rules.map((o: Rule) => o.tabGroup));

        handleTab(data.rules, tab, names);
    }
});

// listen for changes to tab groups and send the new state back to the component
async function sendGroups() {
    let groups = await chrome.tabGroups.query({});
    if (!groups) {
        return;
    }

    chrome.runtime.sendMessage({ type: 'updateGroups', tabGroups: groups });
}

chrome.tabGroups.onCreated.addListener((_tabGroup: chrome.tabGroups.TabGroup) => {
    sendGroups();
});

chrome.tabGroups.onUpdated.addListener((_tabGroup: chrome.tabGroups.TabGroup) => {
    sendGroups();
});

chrome.tabGroups.onRemoved.addListener((_tabGroup: chrome.tabGroups.TabGroup) => {
    sendGroups();
});
