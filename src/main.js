// The div at the very top of the message chain. This is the div holding the description
// of the person your chatting with. Example as follows
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=
// User Image
// User Name
// You're friends on facebook
// Lives in {city/state}
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=
TOP_OF_CHAIN_QUERY = '.xsag5q8.xn6708d.x1ye3gou.x1cnzs8';

// Remove Queries -------------------------------------------------------------
MY_ROW_QUERY = '.x78zum5.xdt5ytf.x193iq5w.x1n2onr6.xuk3077'; // Also used for finding the scroller (we just go up to the first parent w/ scrollTop)

// Partner chat text innerText.
PARTNER_CHAT_QUERY = '.x1cy8zhl.x78zum5.xdt5ytf.x193iq5w.x1n2onr6.x1kxipp6';

// Selects all sent chats (both Partner's and User's chat messages)
CHATS_QUERY = `.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x78zum5.xh8yej3:has(${MY_ROW_QUERY},${PARTNER_CHAT_QUERY})`;

// In case a user has none of their own messages on screen and only unsent messages, this serves to pick up the scroll parent
UNSENT_MESSAGE_QUERY = `.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1h91t0o.xkh2ocl.x78zum5.xdt5ytf.x13a6bvl.x193iq5w.x1c4vz4f.x1eb86dx:has(.html-div.x11i5rnm.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1k4tb9n.x12nagc.x1gslohp.x1ks1olk.xyk4ms5)`;

// Selects all chats (Unsent messages, Partner's and User's)
ALL_CHAT_QUERY = `${CHATS_QUERY},${UNSENT_MESSAGE_QUERY}`;

// The sideways ellipses used to open the 'remove' menu. Visible on hover.
MORE_BUTTONS_QUERY = '[role="row"] [aria-hidden="false"] [aria-label="More"]';

// The button used to open the remove confirmation dialog.
REMOVE_BUTTON_QUERY = '[aria-label="Remove message"],[aria-label="Remove Message"]';

// The button used to close the 'message removed' post confirmation.
OKAY_BUTTON_QUERY = '[aria-label="Okay"]';

REMOVE_CONFIRMATION_QUERY = '[aria-label="Unsend"],[aria-label="Remove"]';
CANCEL_BUTTON_QUERY = `:not([aria-disabled="true"])[aria-label="Cancel"][role="button"]`
CANCEL_CONFIRMATION_QUERY = `[aria-label="Who do you want to unsend this message for?"] ${CANCEL_BUTTON_QUERY},[aria-label="Remove for you"] ${CANCEL_BUTTON_QUERY}`;

// The loading animation.
LOADING_QUERY = '[role="main"] svg[aria-valuetext="Loading..."]';

// Consts and Params.
const STATUS = {
  CONTINUE: 'continue',
  ERROR: 'error',
  COMPLETE: 'complete',
};

let DELAY = 5;
const RUNNER_COUNT = 10;
const DEBUG_MODE = false; // When set, does not actually remove messages.

const currentURL =
  location.protocol + '//' + location.host + location.pathname;
const continueKey = 'shoot-the-messenger-continue' + currentURL;
const lastClearedKey = 'shoot-the-messenger-last-cleared' + currentURL;
const delayKey = 'shoot-the-messenger-delay' + currentURL;

let scrollerCache = null;
const clickCountPerElement = new Map();

// Helper functions ----------------------------------------------------------
function getRandom(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function sleep(ms) {
  let randomizedSleep = getRandom(ms, ms * 1.33);
  return new Promise((resolve) => setTimeout(resolve, randomizedSleep));
}

function reload() {
  window.location = window.location.pathname;
}

function getScroller() {
  if (scrollerCache) return scrollerCache;

  let el;
  try {
    el = document.querySelector(ALL_CHAT_QUERY);
    while (!('scrollTop' in el) || el.scrollTop === 0) {
      console.log('Traversing tree to find scroller...', el);
      el = el.parentElement;
    }
  } catch (e) {
    alert(
      'Could not find scroller. This normally happens because you do not ' +
        'have enough messages to scroll through. Failing.',
    );
    console.log('Could not find scroller; failing.');
    throw new Error('Could not find scroller.');
  }

  scrollerCache = el;
  return el;
}

// Removal functions ---------------------------------------------------------
// Takes a chat message and removes any reaction made by the user
// Returns true if the user didn't react to the chat or the reaction was removed successfully, false otherwise
async function removeReactionFromMessage(chat_msg) {
  // Get the reactions from chat message
  const reactionButton = chat_msg.parentElement.querySelector(`[aria-label*="see who reacted to this"][role="button"]`);
  if (!reactionButton) {
    console.log('Chat message has no reaction');
    return true;
  }
  console.log('Clicking on reaction button: ', reactionButton);
  reactionButton.click();
  await sleep(500);

  // Check if the reaction window has opened
  const windowPopup = document.querySelector(`.x1yr2tfi`);
  // Check if the title tag within the popup window is of "Message reactions"
  if (windowPopup?.querySelector('.x1lkfr7t').innerText !== 'Message reactions') {
    console.log("Reaction window couldn't open");
    return false;
  }

  // Find if the user reacted to the message
  // NOTE: I'm not sure if a user can react to a message more than once, if not, then this array will always only have one element at most
  Array.from(windowPopup.querySelectorAll(`div.xu06os2:nth-child(2) > span`))
       .filter((el) => el.innerText === 'Click to remove')
       .forEach(async (el) => {
         if (DEBUG_MODE) {
           console.log('Skipping removal of reaction we are in debug mode. ', el);
           return; // counts as a 'continue' keyword
         }

         console.log('Removing reaction from message: ', el);
         el.click();
         await sleep(150);
       });

  // Close reaction window
  console.log('Closing reaction window');
  windowPopup.querySelector(`[aria-label="Close"][role="button"]`).click();
  await sleep(1000);
  return true;
}


async function prepareDOMForRemoval() {
  const elementsToRemove = [];

  // Add the elements from clickCountPerElement where the count is greater than
  // 3 to elementsToRemove.
  for (let [el, count] of clickCountPerElement) {
    if (count > 3) {
      console.log('Unable to unsend element: ', el);
      elementsToRemove.push(el);
    }
  }

  // Once we know what to remove, start the loading process for new messages
  // just in case we lose the scroller.
  getScroller().scrollTop = 0;
  await sleep(1000);

  // We cant delete all of the elements because react will crash. Keep the
  // first one.
  elementsToRemove.shift();
  elementsToRemove.reverse();
  console.log('Removing bad rows from dom: ', elementsToRemove);
  for (let badEl of elementsToRemove) {
    await sleep(100);
    let el = badEl;
    try {
      while (el.getAttribute('role') !== 'row') el = el.parentElement;
      el.remove();
    } catch (err) {
      console.log('Skipping row: could not find the row attribute.');
    }
  }
}

async function getAllMessages() {
  // Get all ... buttons that let you select 'more' for all messages you sent.
  const elementsToUnsend = [...document.querySelectorAll(ALL_CHAT_QUERY)];
  console.log('Got elements to unsend: ', elementsToUnsend);
  return elementsToUnsend;
}

async function unsendAllVisibleMessages() {
  // Prepare the DOM. Get the elements we can remove. Load the next set. Hide
  // the rest.
  prepareDOMForRemoval();
  const moreButtonsHolders = await getAllMessages();
  console.log('Found hidden menu holders: ', moreButtonsHolders);

  // Reverse list so it steps through messages from bottom and not a seemingly
  // random position.
  for (el of moreButtonsHolders.slice().reverse()) {
    // Keep current task in view, as to not confuse users, thinking it's not
    // working anymore.
    el.scrollIntoView();
    await sleep(100);

    // Remove reactions from chat message if possible
    if (!(await removeReactionFromMessage(el))) {
      console.log('Could not successfully remove the reactions! Skipping holder: ', el);
      continue;
    }

    // Trigger on hover.
    console.log('Triggering hover on: ', el);
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await sleep(150);

    // Get the more button.
    const moreButton = el.parentElement.parentElement.querySelector(MORE_BUTTONS_QUERY);
    if (!moreButton) {
      console.log('No moreButton found! Skipping holder: ', el);
      continue;
    }
    console.log('Clicking more button: ', moreButton);
    moreButton.click();

    // Update the click count for the button. This is used to skip elements
    // that refuse to be unsent (see: prepareDOMForRemoval -- we remove these
    // DOM elements there).
    clickCountPerElement.set(el, (clickCountPerElement.get(el) ?? 0) + 1);

    // Hit the remove button to get the popup.
    await sleep(500);
    const removeButton = document.querySelector(REMOVE_BUTTON_QUERY);
    if (!removeButton) {
      console.log('No removeButton found! Skipping holder: ', el);
      continue;
    }

    console.log('Clicking remove button: ', removeButton);
    removeButton.click();

    // Hit unsend on the popup. If we are in debug mode, just log the popup.
    await sleep(1000);
    const unsendButton = document.querySelector(REMOVE_CONFIRMATION_QUERY);
    const cancelButton = document.querySelector(CANCEL_CONFIRMATION_QUERY);
    if (DEBUG_MODE) {
      console.log('Skipping unsend because we are in debug mode.', unsendButton);
      cancelButton.click();
    } else if (!unsendButton) {
      console.log('No unsendButton found! Skipping holder: ', el);
      cancelButton.click();
    } else {
      console.log('Clicking unsend button: ', unsendButton);
      unsendButton.click();
    }
    await sleep(1800);
  }
  console.log('Removed all holders.');

  // Now see if we need to scroll up.
  const scroller_ = getScroller();
  const topOfChainText = document.querySelectorAll(TOP_OF_CHAIN_QUERY);
  await sleep(2000);
  if (!scroller_ || scroller_.scrollTop === 0) {
    console.log('Reached top of chain: ', topOfChainText);
    return { status: STATUS.COMPLETE };
  }

  // Scroll up. Wait for the loader.
  // Were done loading when the loading animation is gone, or when the loop
  // waits 5 times (10s).
  let loader = null;
  scroller_.scrollTop = 0;

  for (let i = 0; i < 5; ++i) {
    console.log('Waiting for loading messages to populate...', loader);
    await sleep(2000);
    loader = document.querySelector(LOADING_QUERY);
    if (!loader) break;
  }

  return { status: STATUS.CONTINUE, data: DELAY * 1000 };
}

async function deleteAllRunner(count) {
  console.log('Starting delete all runner removal for N iterations: ', count);
  for (let i = 0; i < count; ++i) {
    console.log('Running count:', i);
    const sleepTime = await unsendAllVisibleMessages();
    if (sleepTime.status === STATUS.CONTINUE) {
      console.log('Sleeping to avoid rate limits: ', sleepTime.data / 1000);
      await sleep(sleepTime.data);
    } else if (sleepTime.status === STATUS.COMPLETE) {
      return STATUS.COMPLETE;
    } else {
      return STATUS.ERROR;
    }
  }
  console.log('Completed run.');
  return STATUS.CONTINUE;
}

function hijackLog() {
  // Add a log to the bottom left of the screen where users can see what the
  // system is thinking about.
  console.log('Adding log to screen');
  const log = document.createElement('div');
  log.id = 'log';
  log.style.position = 'fixed';
  log.style.bottom = '0';
  log.style.left = '0';
  log.style.backgroundColor = 'white';
  log.style.padding = '10px';
  log.style.zIndex = '10000';
  log.style.maxWidth = '200px';
  log.style.maxHeight = '500px';
  log.style.overflow = 'scroll';
  log.style.border = '1px solid black';
  log.style.fontSize = '12px';
  log.style.fontFamily = 'monospace';
  log.style.color = 'black';
  document.body.appendChild(log);

  // Hijack the console.log function to also append to our new log element.
  const oldLog = console.log;
  console.log = function () {
    oldLog.apply(console, arguments);
    log.innerText += '\n' + Array.from(arguments).join(' ');
    log.scrollTop = log.scrollHeight;
  };
  console.log('Successfully added log to screen');
  console.log(
    'To see more complete logs, hit f12 or open the developer console.',
  );
  return log;
}

async function removeHandler() {
  hijackLog();
  DELAY = localStorage.getItem(delayKey) || DELAY;
  console.log('Sleeping to allow the page to load fully...');
  await sleep(10000); // give the page a bit to fully load.

  const status = await deleteAllRunner(RUNNER_COUNT);

  if (status === STATUS.COMPLETE) {
    localStorage.removeItem(continueKey);
    localStorage.setItem(lastClearedKey, new Date().toString());
    console.log('Success!');
    alert('Successfully cleared all messages!');
    return null;
  } else if (status === STATUS.CONTINUE) {
    console.log('Completed runner iteration but did not finish removal.');
    localStorage.setItem(continueKey, true);
    return reload();
  }

  console.log('Failed to complete removal.');
  alert('ERROR: something went wrong. Failed to complete removal.');
}

// Main ----------------------------------------------------------------------

// Hacky fix to avoid issues with removing/manipulating the DOM from outside
// react control.
// See: https://github.com/facebook/react/issues/11538#issuecomment-417504600
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console) {
        console.error(
          'Cannot remove a child from a different parent',
          child,
          this,
        );
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        console.error(
          'Cannot insert before a reference node from a different parent',
          referenceNode,
          this,
        );
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

(async function () {
  chrome.runtime.onMessage.addListener(async function (msg, sender) {
    // Make sure we are using english language messenger.
    if (document.documentElement.lang !== 'en') {
      alert(
        'ERROR: detected non-English language. Shoot the Messenger only works when Facebook settings are set to English. Please change your profile settings and try again.',
      );
      return;
    }

    console.log('Got action: ', msg.action);
    if (msg.action === 'REMOVE') {
      const doRemove = confirm(
        'Removal will nuke your messages and will prevent you from seeing the messages of other people in this chat. We HIGHLY recommend backing up your messages first. Continue?',
      );
      if (doRemove) {
        removeHandler();
      }
    } else if (msg.action === 'STOP') {
      localStorage.removeItem(continueKey);
      reload();
    } else if (msg.action === 'UPDATE_DELAY') {
      console.log('Setting delay to', msg.data || DELAY, 'seconds');
      localStorage.setItem(delayKey, msg.data);
    } else {
      console.log('Unknown action.');
    }
  });

  if (localStorage.getItem(continueKey)) {
    removeHandler();
  }
})();