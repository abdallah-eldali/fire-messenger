// The div at the very top of the message chain. This is the div holding the description
// of the person your chatting with. Example as follows
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=
// User Image
// User Name
// You're friends on facebook
// Lives in {city/state}
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=
TOP_OF_CHAIN_QUERY = `.xsag5q8.xn6708d.x1ye3gou.x1cnzs8`;

// Remove Queries -------------------------------------------------------------
MY_ROW_QUERY = `.x78zum5.xdt5ytf.x193iq5w.x1n2onr6.xuk3077`; // Also used for finding the scroller (we just go up to the first parent w/ scrollTop)

// Partner chat text innerText.
PARTNER_CHAT_QUERY = `.x1cy8zhl.x78zum5.xdt5ytf.x193iq5w.x1n2onr6.x1kxipp6`;

// Selects all sent chats (both Partner's and User's chat messages)
CHATS_QUERY = `.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x78zum5.xh8yej3:has(${MY_ROW_QUERY},${PARTNER_CHAT_QUERY})`;

// In case a user has none of their own messages on screen and only unsent messages, this serves to pick up the scroll parent
UNSENT_MESSAGE_QUERY = `.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1h91t0o.xkh2ocl.x78zum5.xdt5ytf.x13a6bvl.x193iq5w.x1c4vz4f.x1eb86dx:has(.html-div.x11i5rnm.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1k4tb9n.x12nagc.x1gslohp.x1ks1olk)`;
// Selects all chats (Unsent messages, Partner's and User's)
ALL_CHAT_QUERY = `${CHATS_QUERY},${UNSENT_MESSAGE_QUERY}`;

// The sideways ellipses used to open the 'remove' menu. Visible on hover.
MORE_BUTTONS_QUERY = `[role="row"] [aria-hidden="false"] [aria-label="More"]`;

// The button used to open the remove confirmation dialog.
REMOVE_BUTTON_QUERY = `[aria-label="Remove message"],[aria-label="Remove Message"]`;
REMOVE_CONFIRMATION_QUERY = `[aria-label="Unsend"],[aria-label="Remove"]`;
CANCEL_BUTTON_QUERY = `:not([aria-disabled="true"])[aria-label="Cancel"][role="button"]`
CANCEL_CONFIRMATION_QUERY = `[aria-label="Who do you want to unsend this message for?"] ${CANCEL_BUTTON_QUERY},[aria-label="Remove for you"] ${CANCEL_BUTTON_QUERY}`;

// The loading animation.
LOADING_QUERY = `[role="main"] svg[aria-valuetext="Loading..."]`;

// Consts and Params.
const STATUS = {
  CONTINUE: "continue",
  ERROR: "error",
  COMPLETE: "complete",
  STOPPED: "stopped"
};

let DELAY = 5;
let STOP = false;
const DEBUG_MODE = false; // When set, does not actually remove messages.

let scrollerCache = null;

// Helper functions ----------------------------------------------------------
function sleep(ms) {
  function getRandom(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  let randomizedSleep = getRandom(ms, ms * 1.33);
  return new Promise((resolve) => setTimeout(resolve, randomizedSleep));
}

Node.prototype.waitForQuerySelector = function(query, timeout, matchInnerText=".*") {
  return new Promise((resolve, reject) => {
    const time_interval = 100;
    let intervalId = setInterval(() => {
      let element = Array.from(this.querySelectorAll(query)).find((el) => el.innerText?.match(matchInnerText));
      if (element || timeout <= 0) {
        clearInterval(intervalId);
        resolve(element); //will return element or null
      }
      //if (element) {
      //  clearInterval(intervalId);
      //  resolve(element);
      //}
      //if (timeout <= 0) {
      //  console.log("Timeout");
      //  clearInterval(intervalId);
      //  reject("Timeout");
      //}
      timeout -= time_interval;
    }, time_interval);
  });
}

// Constantly polls for the Node to check if it's connected to the DOM until timeout in milliseconds
Node.prototype.waitForDisconnect = function(timeout) {
  return new Promise((resolve, reject) => {
    const time_interval = 100;
    let intervalId = setInterval(() => {
      if (!this.isConnected || timeout <= 0) {
        clearInterval(intervalId);
        resolve(!this.isConnected);
      }
      timeout -= time_interval;
    }, time_interval);
  });
}

function getMostRecentMessage() {
  const elementsToUnsend = Array.from(document.querySelectorAll(ALL_CHAT_QUERY)).at(-1);
  console.log("Got most recent message element to unsend: ", elementsToUnsend);
  return elementsToUnsend;
}

function getScroller() {
  if (scrollerCache) return scrollerCache;

  let el;
  try {
    el = getMostRecentMessage();
    while (!("scrollTop" in el) || el.scrollTop === 0) {
      console.log("Traversing tree to find scroller...", el);
      el = el.parentElement;
    }
  } catch (e) {
    alert(
      "Could not find scroller. This normally happens because you do not " +
        "have enough messages to scroll through. Failing.",
    );
    console.log("Could not find scroller; failing.");
    throw new Error("Could not find scroller.");
  }

  scrollerCache = el;
  return el;
}

// Removal functions ---------------------------------------------------------
// Takes a chat message and removes any reaction made by the user
// Returns true if the user didn't react to the chat or the reaction was removed successfully, false otherwise
async function removeReactionFromMessage(chat_msg) {
  if (!chat_msg) {
    console.log(`Chat Message doesn't exist: ${chat_msg}`);
    return false;
  }

  chat_msg.scrollIntoView();

  // Get the reactions from chat message
  const reactionButton = chat_msg.parentElement?.querySelector(`[aria-label*="see who reacted to this"][role="button"]`);
  if (!reactionButton) {
    console.log("Chat message has no reaction");
    return true;
  }

  console.log("Clicking on reaction button: ", reactionButton);
  reactionButton.click();
  await sleep(500); // NOTE: This sleep is important, DO NOT user waitForQuerySelector alone to get the window popup as it will return the loading popup window instead of the already loaded one
  // Check if the reaction window has opened
  const windowPopup = await document.waitForQuerySelector(".x1yr2tfi", 3000);
  // Check if the title tag within the popup window is of "Message reactions"
  if (windowPopup?.querySelector(".x1lkfr7t")?.innerText !== "Message reactions") {
    console.log("Reaction window couldn't open");
    return false;
  }

  let userReacted = false;
  // Find if the user reacted to the message
  // NOTE: I'm not sure if a user can react to a message more than once, if not, then this array will always only have one element at most
  Array.from(windowPopup.querySelectorAll(`div.xu06os2:nth-child(2) > span`))
       .filter((el) => el.innerText === "Click to remove")
       .forEach(async (el) => {
         if (DEBUG_MODE) {
           console.log("Skipping removal of reaction we are in debug mode. ", el);
           return; // counts as a 'continue' keyword
         }

         console.log("Removing reaction from message: ", el);
         el.click();
         //await sleep(500);
         userReacted = true;
       });

  // Close reaction window
  console.log("Closing reaction window");
  //await sleep(500);
  windowPopup.querySelector(`[aria-label="Close"][role="button"]`).click();
  //await sleep(500);
  if (!userReacted) return true;

  if (!chat_msg.parentElement.querySelector(`[aria-label*="see who reacted to this"][role="button"]`)) {
      console.log("Reaction was successfully removed");
      return true;
  }
  console.log("Reaction wasn't successfully removed");
  return false;
}

async function unsendMessage(chat_msg) {
  if (!chat_msg) {
    console.log("Chat Message doesn't exist: ", chat_msg);
    return false;
  }

  chat_msg.scrollIntoView();

  // Trigger the hover over the chat message
  console.log("Triggering hover on: ", chat_msg);
  chat_msg.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

  //await sleep(500);

  // Get the more button of the message (the 3 elipses besides a chat message)
  const moreButton = await chat_msg.parentElement?.parentElement?.waitForQuerySelector(MORE_BUTTONS_QUERY, 5000);
  if (!moreButton) {
    console.log("No More Button found! Skipping holder: ", chat_msg);
    return false;
  }

  console.log("Clicking more button: ", moreButton);
  moreButton.click();

  //await sleep(500);
  // Hit the remove button to tget the popup
  const removeButton = await document.waitForQuerySelector(REMOVE_BUTTON_QUERY, 5000);
  if (!removeButton) {
    console.log("No Remove Button found! Skipping holder: ", chat_msg);
    return false;
  }

  console.log("Clicking remove button: ", removeButton);
  removeButton.click();

  //await sleep(500);
  // Hit unsend on the popup. If we are in debug mode, just log the popup.
  const unsendButton = await document.waitForQuerySelector(REMOVE_CONFIRMATION_QUERY, 5000, "Remove");
  const cancelButton = await document.waitForQuerySelector(CANCEL_CONFIRMATION_QUERY, 5000, "Cancel");
  // This means the window asking to unsend the messages isn't open
  if (!unsendButton && !cancelButton) {
    console.log("No unsendButton and cancelButton! Unsending window might not been opened. Skipping holder: ", chat_msg);
    return false;
  }
  if (DEBUG_MODE) {
    console.log("Skipping unsend because we are in debug mode: ", unsendButton);
    cancelButton.click();
    return true;
  } else if (!unsendButton) {
    console.log("No unsendButton found! Skipping holder: ", chat_msg);
    cancelButton.click();
    return false;
  } else {
    console.log("Clicking unsend button: ", unsendButton);
    unsendButton.click();
  }

  //await sleep(500);
  // Check if chat_msg was deleted (is it still connected to the DOM?)
  const isMessageDisconnectedFromDOM = await chat_msg.waitForDisconnect(1000);
  return isMessageDisconnectedFromDOM;
}

function removeElementFromDOM(chat_msg) {
  try {
    chat_msg.closest(`div.x78zum5.xdt5ytf.x1iyjqo2.x2lah0s.xl56j7k.x121v3j4 > div`).remove();
  } catch (err) {
    console.log("Couldn't remove chat message from DOM. Thowing error");
    throw err;
  }
}

function isMessageACall(chat_msg) {
  if (!chat_msg) {
    console.log("Chat message doesn't exist: ", chat_msg);
    return false;
  }

  if (chat_msg.querySelector(`[aria-label*="call"][role="button"]`)) {
    console.log("Chat message is a call: ", chat_msg);
    return true;
  } else {
    console.log("Chat message is not a call: ", chat_msg);
    return false;
  }

}

function isMessageFromUser(chat_msg) {
  if (!chat_msg) {
    throw new Error("Chat Message doesn't exist");
  }
  return Boolean(chat_msg.querySelector(MY_ROW_QUERY));
}

async function unsendAllVisibleMessages() {
  const scroller_ = getScroller();
  while (recentMessage = getMostRecentMessage()) {
    // Check if we need to stop, if so, return as Complete
    if (STOP) {
      return { status: STATUS.STOPPED };
    }

    await sleep(100);

    if (!recentMessage.isConnected) {
      continue;
    }

    if (isMessageACall(recentMessage)) {
      removeElementFromDOM(recentMessage);
      continue;
    }

    // Remove reactions from chat message if possible
    if (!isMessageFromUser(recentMessage) &&
        !(await removeReactionFromMessage(recentMessage))) {
      console.log("Could not successfully remove the reactions! Skipping holder: ", recentMessage);
      continue;
    }
    // Unsend message from chat if possible
    if (!(await unsendMessage(recentMessage))) {
      console.log("Could not successfully unsend the message! Skipping holder: ", recentMessage);
      continue;
    }
  }
  console.log("Removed all holders.");

  // Now see if we need to scroll up.
  const topOfChainText = document.querySelector(TOP_OF_CHAIN_QUERY);
  if ((!scroller_ || scroller_.scrollTop === 0) && Boolean(topOfChainText)) {
    console.log("Reached top of chain: ", topOfChainText);
    return { status: STATUS.COMPLETE };
  }

  // Scroll up. Wait for the loader.
  // Were done loading when the loading animation is gone, or when the loop
  // waits 10 times (10s).
  let loader = null;
  scroller_.scrollTop = 0;
  for (let i = 0; i < 10; ++i) {
    console.log("Waiting for loading messages to populate...", loader);
    await sleep(1000);
    loader = document.querySelector(LOADING_QUERY);
    if (!loader) break;
  }

  return { status: STATUS.CONTINUE, data: DELAY * 1000 };
}

async function deleteAllRunner() {
  console.log("Starting delete all runner removal");
  let sleepTime = await unsendAllVisibleMessages();
  while (sleepTime.status === STATUS.CONTINUE) {
    console.log(`Sleeping to avoid rate limits: ${sleepTime.data / 1000}`);
    await sleep(sleepTime.data);
    sleepTime = await unsendAllVisibleMessages();
  }
  return sleepTime.status;
}


async function removeHandler() {
  console.log("Sleeping to allow the page to load fully...");
  await sleep(10000); // give the page a bit to fully load.

  const status = await deleteAllRunner();

  if (status === STATUS.COMPLETE) {
    console.log("Success!");
    alert("Successfully cleared all messages!");
    return null;
  }
  if (status === STATUS.STOPPED) {
    console.log("Deleting process was stopped");
    alert("Deleting process was stopped");
    return null
  }
  console.log("Failed to complete removal.");
  alert("ERROR: something went wrong. Failed to complete removal.");
}

// Main ----------------------------------------------------------------------

browser.runtime.onMessage.addListener((msg, sender) => {
  // Make sure we are using english language messenger.
  if (document.documentElement.lang !== "en") {
    alert(
      "ERROR: detected non-English language. Fire Messenger only works when Facebook settings are set to English. Please change your profile settings and try again.",
    );
    return;
  }

  console.log("Got action: ", msg.action);
  if (msg.action === "REMOVE") {
    const doRemove = confirm(
      "Removal will nuke your messages and will prevent you from seeing the messages of other people in this chat. We HIGHLY recommend backing up your messages first. Continue?",
    );
    if (doRemove) {
      console.log(`Setting delay to ${msg.data} seconds.`);
      DELAY = msg.data || DELAY;
      STOP = false;
      removeHandler();
    }
  } else if (msg.action === "STOP") {
    console.log(`Received Stopped signal`);
    STOP = true;
  } else {
    console.log("Unknown action.");
  }
});
