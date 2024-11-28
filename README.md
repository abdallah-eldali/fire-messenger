<h1 align="center">
<img src="./src/icon.png" height="70" width="70">
Fire Messenger
</h1>

Fire Messenger is a fork of the Chrome extension [Shoot the Messenger](https://github.com/theahura/shoot-the-messenger) with bug fixes, added features and Firefox integration!

# About

Fire Messenger (similar to [Shoot the Messenger](https://github.com/theahura/shoot-the-messenger)) automatically unsends all your chat messages in Facebook's Messenger app. It also removes partner's chat messages and any reactions you made to any chat message.

## Attribution

### Fire Messenger Icon
The [Fire Messenger icon](./src/icon.png) was created using and modifying the emojis designed by [OpenMoji](https://openmoji.org/) – the open-source emoji and icon project. License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/#)

The Fire Messenger project, including the icon, will be licensed under [GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html) as [GPLv3 is a compatible license with CC BY-SA 4.0](https://creativecommons.org/share-your-work/licensing-considerations/compatible-licenses/). Following [Section 3(b)(1)](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en#s3b1) of the CC BY-SA 4.0 License by applying a BY-SA Compatible License (in this case, GPLv3).

### WebExtension API Polyfill

The Fire Messenger extension uses the [WebExtension `browser` API Polyfill](https://github.com/mozilla/webextension-polyfill) library to port Promise-based WebExtension API and the use of `broswer.*` namespace to Google Chrome browsers. The library is licensed under MPL-2.0 and [it's compatible with Fire Messengers' license, GPLv3](https://www.fsf.org/blogs/licensing/mpl-2.0-release). The `browser-polyfill.js` file is MPL-2.0 licensed which is being incorporated into a "Larger Work" under GPLv3 which is permitted as per [Section 3.3 of the MPL-2.0 license](https://www.mozilla.org/en-US/MPL/2.0/).

# Installing

Currently, the only available option for installation is a manual installation.

## Manual

### Google Chrome

1. Download and unzip `chrome_fire-messenger.zip` (from the [latest release](https://github.com/abdallah-eldali/fire-messenger/releases)) to a directory named `fire-messenger`
2. Open Chrome and go to [*Extensions*](chrome://extensions/)
3. Toggle-on the "*Developer mode*" option
4. Press the *Load unpacked* button
5. Select the created `fire-messenger` directory and press "*Open*"

### Firefox

#### Firefox Extended Support Release (ESR), Firefox Developer Edition and Nightly versions of Firefox

1. Make sure to set `xpinstall.signatures.required` to `false` in [`about:config`](about:config), for more information, see [here](https://support.mozilla.org/en-US/kb/add-on-signing-in-firefox).
2. Download `firefox_fire-messenger.zip` (from the [latest release](https://github.com/abdallah-eldali/fire-messenger/releases)).
3. Open "*Extensions*" (you can find by going to [Addons Page](about:addons) and clicking "*Extensions*" located in the left pane).
4. Click on the Gear Icon (⚙️) and select "*Install Add-on From File...*".
5. Locate the recently downloaded `firefox_fire-messenger.zip` file, select it, and click "*Open*".
6. Firefox will warn about the extension being potentially malicious as it's not signed by Mozilla. Click "*Add*".

#### Standard Firefox

Since the Standard Firefox version ignores the `xpinstall.signatures.required` flag, the only way to install the extension is by using the Debug-mode.

**NOTE:** This will load the extension **temporarily**, meaning, that the extension will be removed when Firefox is closed and you will have to load it again.

1. Download `firefox_fire-messenger.zip` (from the [latest release](https://github.com/abdallah-eldali/fire-messenger/releases)).
2. Go to [Firefox Debugging Page](about:debugging#/runtime/this-firefox).
3. Click the button "*Load Temporary Add-on...*".
4. Locate the recently downloaded `firefox_fire-messenger.zip` file, select it, and click "*Open*".

### Build Instructions (for Developers)

1. Clone the [fire-messenger repository](https://github.com/abdallah-eldali/fire-messenger).
```bash
git clone https://github.com/abdallah-eldali/fire-messenger
```
2. Change to current working directory to the location of the local repository that was just cloned.
```bash
cd fire-messenger
```
3. Execute the bash script `setup.sh`
```bash
./setup.sh
```
4. The packaged extensions will be located on the `fire-messenger/build/` directory.

# How to Use
1. Go to [Messenger](https://messenger.com)
2. Open the messenger chain that you want to delete
3. Click the extension and press the "*Remove Messages*" button.
4. Leave the tab running. If you want to keep using the web on your computer, open a new browser.
6. If you want to stop the removal of messages: Click the extension, and press the "*Stop Removal*" button.
5. If you start getting hit with rate limiting by Facebook (generally an error, 'Cannot unsend at this time'), increase the `Rate limit pause` time in the Extension popup. The default is 5 seconds.

# Issue Reporting

If you encounter any issues, please create a ticket [here](https://github.com/abdallah-eldali/shoot-the-messenger/issues). Please include any logs to help us find the issue quicker.

# Roadmap

- [ ] Implement a CI/CD pipeline using GitHub Actions to automate the creation of extension packages in the release page instead of doing it manually
- [ ] Get the Firefox version of the extension signed by Mozilla and published to the [AMO](addons.mozilla.org)
- [ ] Possibility of using GitHub Actions to check for errors and warnings on PR using web-ext lint
