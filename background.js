chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        chrome.storage.local.get(['rules'], function(result) {
            if (chrome.runtime.lastError) {
                console.log('load error', chrome.runtime.lastError);
            } else {
                try {
                    handleTab(result.rules, tab);
                } catch (err) {
                    console.log(err);
                }
            }
        });
    }
});

function handleTab(rules, tab) {
    for (let i = 0; i < rules.length; i++) {
        switch (rules[i].type) {
            case 'contains':
                if (tab.url.includes(rules[i].text)) {
                    moveTab(tab.id, rules[i].group);
                    return;
                }
                break;
            case 'regex':
                let re = new RegExp(rules[i].text);
                if (re.test(tab.url)) {
                    moveTab(tab.id, rules[i].group);
                    return;
                }
                break;
            default:
                throw 'Error: unknown rule type';
        }
    }
    ungroupTab(tab.id);
}

function moveTab(tabId, tabGroupName) {
    chrome.tabGroups.query({title: tabGroupName})
    .then(function(result) {
        targetGroupId = result[0].id;
        chrome.tabs.group({groupId: targetGroupId, tabIds: [tabId]})
    })
    .catch(() => console.log('FAILED'));
}

function ungroupTab(tabId) {
    chrome.tabs.ungroup([tabId]);
    // TODO promise/error handle
}

chrome.runtime.onMessage.addListener(
    function(request, send, sendResponse) {
        console.log('recv message');
        if (request.type === 'matchAll') {
            matchAll();
        }
    }
);

function matchAll() {
    chrome.tabs.query({}, function(tabsResult) {
        chrome.storage.local.get(['rules'], function(rulesResult) {
            for (let i = 0; i < tabsResult.length; i++) {
                console.log('handle tab ', tabsResult[i].title);
                try {
                    handleTab(rulesResult.rules, tabsResult[i]);
                } catch (err) {
                    console.log(err);
                }
            }
        });
    })
}
