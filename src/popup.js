const removeMessagesButton = document.getElementById('RemoveMessages');
const stopButton = document.getElementById('Stop');
const delayInput = document.getElementById('Delay');
const messageDiv = document.getElementById('Message');
const lastClearedDiv = document.getElementById('LastCleared');

function disablePopupHtml() {
  Array.from(document.getElementsByTagName('input'))
       .forEach((input_element) => input_element.disabled = true);
  Array.from(document.getElementsByTagName('button'))
       .forEach((button_element) => button_element.disabled = true);
  
  messageDiv.textContent = `Disabled: The extension can only run in messenger.com`;
}

function onError(error) {
  console.error(`Error: ${error}`);
  messageDiv.textContent = `Error: ${error}`;
}

// Make sure the user is using messenger.com.
const messengers = [
  'https://www.messenger.com',
  'https://messenger.com/'
];

browser.tabs.query({active: true, currentWindow: true})
            .then((tabs) => {
              if (!messengers.some((m) => tabs[0].url.startsWith(m))){
                disablePopupHtml();
              } else {
                browser.tabs.sendMessage(tabs[0].id, { 
                  action: 'UPDATE_DELAY',
                  data: delayInput.value
                });
              }
            })
            .catch(onError);


removeMessagesButton.addEventListener('click', () => {
  browser.tabs.query({ active: true, currentWindow: true})
              .then((tabs) => {
                browser.tabs.sendMessage(tabs[0].id, {action: 'REMOVE'}); 
              })
              .catch(onError);
});

stopButton.addEventListener('click', () => {
  browser.tabs.query({ active: true, currentWindow: true})
              .then((tabs) => {
                browser.tabs.sendMessage(tabs[0].id, {action: 'STOP'}); 
              })
              .catch(onError);
});

delayInput.addEventListener('input', (e) => {
  browser.tabs.query({ active: true, currentWindow: true})
              .then((tabs) => {
                browser.tabs.sendMessage(tabs[0].id, { 
                  action: 'UPDATE_DELAY',
                  data: e.target.value
                });
              })
              .catch(onError);
});

browser.tabs.query({ active: true, currentWindow: true })
            .then((tabs) => browser.storage.local.get([tabs[0].url]))
            .then((result) => {
              if (!result || Object.keys(result).length === 0) return;
              console.log('Found storage for url: ', result);
              if ('lastCleared' in result[tabs[0].url]) {
                lastClearedDiv.textContent = `Last Cleared: ${result[tabs[0].url]['lastCleared']}`;
              }
            })
            .catch(onError);
