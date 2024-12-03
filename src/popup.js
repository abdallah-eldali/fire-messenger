const removeMessagesButton = document.getElementById('RemoveMessages');
const stopButton = document.getElementById('Stop');
const delayInput = document.getElementById('Delay');
const messageDiv = document.getElementById('Message');

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
              }
            })
            .catch(onError);


removeMessagesButton.addEventListener('click', () => {
  browser.tabs.query({ active: true, currentWindow: true})
              .then((tabs) => {
                const message = {
                  action: 'REMOVE',
                  data: delayInput.value
                };
                browser.tabs.sendMessage(tabs[0].id, message);
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
