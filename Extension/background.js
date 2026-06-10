chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SCRAPE_URL') {

    // Open the review page in a hidden background tab
    chrome.tabs.create({ url: request.url, active: false }, (tab) => {

      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);

          // Read the fully loaded DOM from the tab
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.documentElement.outerHTML
          }, (results) => {
            chrome.tabs.remove(tab.id); // close the tab
            sendResponse({ html: results?.[0]?.result || null });
          });
        }
      });

    });

    return true; // keeps message channel open for async response
  }
});