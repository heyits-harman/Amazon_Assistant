chrome.runtime.onMessage.addListener((
  request: { type: string; url: string },
  _sender,
  sendResponse
) => {
  if (request.type === 'SCRAPE_URL') {

    chrome.tabs.create({ url: request.url, active: false }, (tab) => {
      if (!tab.id) return;

      const tabId = tab.id;

      chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
        if (updatedTabId === tabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);

          chrome.scripting.executeScript({
            target: { tabId },
            func: () => document.documentElement.outerHTML,
          }, (results) => {
            chrome.tabs.remove(tabId);
            sendResponse({ html: results?.[0]?.result ?? null });
          });
        }
      });
    });

    return true;
  }
});