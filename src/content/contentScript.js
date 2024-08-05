// src/content/contentScript.js

// Inject the contentScriptInjector.js as a module
function injectScript(file_path) {
  const script = document.createElement('script');
  script.setAttribute('type', 'module');
  script.setAttribute('src', chrome.runtime.getURL(file_path));
  document.documentElement.appendChild(script);
  console.log('Injected script:', file_path);
}

injectScript('src/content/contentScriptInjector.js');

// Listen for messages from the injected script
window.addEventListener('message', function (event) {
  // We only accept messages from ourselves
  if (event.source != window) return;
  // Check if chrome.storage.local is available
  if (!chrome || !chrome.storage || !chrome.storage.local) {
    console.error('chrome.storage.local is not available');
    return;
  }

  switch (event.data.type) {
    case 'REQUEST_INFO_CAPTURED':
      console.log('Request info captured:', event.data.requestInfo);
      chrome.storage.local.set({ requestInfo: event.data.requestInfo });
      break;
    case 'DELETION_COMPLETE':
    case 'DELETION_ERROR':
      // Forward deletion results to the popup
      chrome.runtime.sendMessage(event.data).catch(error => console.error('Error sending message to popup:', error));
      break;
    case 'SAVE_REQUEST_INFO':
      chrome.storage.local.set({ requestInfo: event.data.requestInfo });
      break;
    case 'GET_REQUEST_INFO':
      chrome.storage.local.get('requestInfo', (data) => {
        window.postMessage({
          type: 'REQUEST_INFO_RESPONSE',
          messageId: event.data.messageId,
          requestInfo: data.requestInfo || null
        }, '*');
      });
      break;
    case 'SAVE_USERNAME':
      chrome.storage.local.set({ username: event.data.username });
      break;
    case 'GET_USERNAME':
      chrome.storage.local.get('username', (data) => {
        window.postMessage({
          type: 'USERNAME_RESPONSE',
          messageId: event.data.messageId,
          username: data.username || null
        }, '*');
      });
      break;
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message from popup:', message);

  if (message.type === 'START_DELETION') {
    // Forward the start deletion message to the injected script
    window.postMessage({ type: 'START_DELETION', options: message.options }, '*');
    return true; // Indicates that the response is sent asynchronously
  }
});