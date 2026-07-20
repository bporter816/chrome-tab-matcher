import type { ConsolidateRule, Data, Rule } from "../../types";
import { RuleType } from "../../types";

chrome.runtime.onInstalled.addListener(() => {
    console.log("Hello there");
});

// move a tab to the tab group with the given name
async function groupTab(tab: chrome.tabs.Tab, tabGroupName: string) {
    if (tab.id === undefined) {
        return;
    }
    const tabId = tab.id;

    const tabGroups = await chrome.tabGroups.query({ title: tabGroupName });

    let groupId: number;
    if (tabGroups.length === 0) {
        // group doesn't exist, create it
        groupId = await chrome.tabs.group({ tabIds: [tabId] });
        await chrome.tabGroups.update(groupId, { title: tabGroupName });
    } else {
        // group already exists
        groupId = await chrome.tabs.group({
            groupId: tabGroups[0].id,
            tabIds: [tabId],
        });
    }

    // refocus on the tab after it's been moved, if it was actually moved
    if (tab.groupId !== groupId) {
        await chrome.tabs.update(tabId, { highlighted: true });
        const tabDetails = await chrome.tabs.get(tabId);
        await chrome.windows.update(tabDetails.windowId, { focused: true });
    }
}

// ungroup a tab
async function ungroupTab(tab: chrome.tabs.Tab) {
    if (tab.id === undefined) {
        return;
    }
    await chrome.tabs.ungroup(tab.id);
}

async function inManagedGroup(tab: chrome.tabs.Tab, names: Set<string>) {
    const group = await chrome.tabGroups.get(tab.groupId);
    return group.title !== undefined && names.has(group.title);
}

// grab the visible text of a tab's page, if possible
async function getPageText(tab: chrome.tabs.Tab): Promise<string | undefined> {
    if (tab.id === undefined) {
        return undefined;
    }
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.body.textContent,
        });
        const text = results[0]?.result;
        // collapse layout/source-formatting whitespace so text split across
        // elements matches as one line
        return text?.replace(/\s+/g, " ").trim();
    } catch {
        // page can't be scripted (e.g. chrome:// pages, the Chrome Web Store)
        return undefined;
    }
}

// process a tab according to the given rules
async function handleTab(
    rules: Rule[],
    tab: chrome.tabs.Tab,
    names: Set<string>,
) {
    // ignore tab if it's in a user-defined group
    if (tab.groupId > 0) {
        const managed = await inManagedGroup(tab, names);
        if (!managed) {
            return;
        }
    }

    let pageText: string | undefined;
    let pageTextFetched = false;

    for (let i = 0; i < rules.length; i++) {
        if (rules[i].matchStr === "" || rules[i].tabGroup === "") {
            continue;
        }
        const re = new RegExp(rules[i].matchStr, "i");
        switch (rules[i].type) {
            case RuleType.TabUrl:
                if (tab.url !== undefined && re.test(tab.url)) {
                    await groupTab(tab, rules[i].tabGroup);
                    return;
                }
                break;
            case RuleType.TabTitle:
                if (tab.title !== undefined && re.test(tab.title)) {
                    await groupTab(tab, rules[i].tabGroup);
                    return;
                }
                break;
            case RuleType.PageBody:
                if (!pageTextFetched) {
                    pageText = await getPageText(tab);
                    pageTextFetched = true;
                }
                if (pageText !== undefined && re.test(pageText)) {
                    await groupTab(tab, rules[i].tabGroup);
                    return;
                }
                break;
            default:
                console.log("Error: unknown rule type");
        }
    }
    await ungroupTab(tab);
}

// load the current rules and the set of tab group names they reference
async function loadRulesAndNames() {
    const data = (await chrome.storage.sync.get({ rules: [] })) as Data;
    const names = new Set<string>(data.rules.map((o: Rule) => o.tabGroup));
    return { rules: data.rules, names };
}

// re-process all tabs
async function refresh() {
    const tabs = await chrome.tabs.query({});
    const { rules, names } = await loadRulesAndNames();

    for (const tab of tabs) {
        // block so that if multiple tabs need to be added to a new group we ensure the new group exists
        await handleTab(rules, tab, names);
    }
}

// handle request to re-process all tabs
chrome.runtime.onMessage.addListener((request, _send, _sendResponse) => {
    if (request.type === "refresh") {
        refresh();
    }
});

// group pages when they finish loading
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        const { rules, names } = await loadRulesAndNames();
        handleTab(rules, tab, names);
    }
});

// canonicalize a URL for duplicate detection: the first consolidation rule whose
// matchStr matches is applied via replaceStr (which may reference capture groups,
// e.g. "$1") to produce the canonical form. URLs matching no rule compare as-is.
function canonicalizeUrl(url: string, consolidateRules: ConsolidateRule[]) {
    for (const rule of consolidateRules) {
        if (rule.matchStr === "") {
            continue;
        }
        const re = new RegExp(rule.matchStr, "i");
        if (re.test(url)) {
            return url.replace(re, rule.replaceStr);
        }
    }
    return url;
}

// load whether consolidation is enabled and its rules
async function loadConsolidateSettings() {
    const data = (await chrome.storage.sync.get({
        consolidateEnabled: false,
        consolidateRules: [],
    })) as Data;
    return {
        consolidateEnabled: data.consolidateEnabled,
        consolidateRules: data.consolidateRules,
    };
}

// if the tab's URL duplicates an already-open tab (per the consolidation rules),
// close this tab and focus the existing one instead
async function consolidateTab(tabId: number, url: string) {
    const { consolidateEnabled, consolidateRules } =
        await loadConsolidateSettings();
    if (!consolidateEnabled || url === "") {
        return;
    }

    const canonical = canonicalizeUrl(url, consolidateRules);
    const tabs = await chrome.tabs.query({});
    const duplicate = tabs.find(
        (t) =>
            t.id !== undefined &&
            t.id !== tabId &&
            t.url !== undefined &&
            canonicalizeUrl(t.url, consolidateRules) === canonical,
    );
    if (duplicate === undefined || duplicate.id === undefined) {
        return;
    }

    await chrome.tabs.update(duplicate.id, { active: true });
    await chrome.windows.update(duplicate.windowId, { focused: true });
    await chrome.tabs.remove(tabId);
}

// close a newly-created tab as soon as its target URL is known, if it duplicates an
// already-open tab (before it starts loading, when possible)
chrome.tabs.onCreated.addListener((tab) => {
    const url = tab.pendingUrl ?? tab.url;
    if (tab.id !== undefined && url !== undefined) {
        consolidateTab(tab.id, url);
    }
});

// also catch tabs that are consolidated after the fact, e.g. a tab navigating (via
// address bar, link, etc.) to a URL that duplicates another already-open tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url !== undefined) {
        consolidateTab(tabId, changeInfo.url);
    }
});

// listen for changes to tab groups and send the new state back to the component
async function sendGroups() {
    const groups = await chrome.tabGroups.query({});
    chrome.runtime.sendMessage({ type: "updateGroups", tabGroups: groups });
}

chrome.tabGroups.onCreated.addListener(
    (_tabGroup: chrome.tabGroups.TabGroup) => {
        sendGroups();
    },
);

chrome.tabGroups.onUpdated.addListener(
    (_tabGroup: chrome.tabGroups.TabGroup) => {
        sendGroups();
    },
);

chrome.tabGroups.onRemoved.addListener(
    (_tabGroup: chrome.tabGroups.TabGroup) => {
        sendGroups();
    },
);
