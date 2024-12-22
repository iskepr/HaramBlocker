const isFirefox = typeof browser !== "undefined";

// استخدام واجهة `browser` إذا كانت مدعومة (فايرفوكس) أو واجهة `chrome` (كروم)
const runtime = isFirefox ? browser.runtime : chrome.runtime;
const action = isFirefox ? browser.action : chrome.action;
const tabs = isFirefox ? browser.tabs : chrome.tabs;

// الحدث عند تثبيت الإضافة
runtime.onInstalled.addListener(() => {
  console.log("HaramBlocker تم التثبيت بنجاح");
});

// الحدث عند الضغط على الأيقونة
action.onClicked.addListener((tab) => {
  const popupUrl = runtime.getURL("popup.html");
  tabs.create({ url: popupUrl });
});

// haram blutr

// haram blut
export const DEFAULT_SETTINGS = {
  status: true,
  blurryStartMode: false,
  blurAmount: 25,
  blurImages: true,
  blurVideos: true,
  blurMale: false,
  blurFemale: true,
  specificBlur: true,
  unblurImages: false,
  unblurVideos: false,
  gray: true,
  strictness: 0.4, // goes from 0 to 1
  whitelist: [],
  detectionModel: "light",
};

export const STATUSES = {
  // the numbers are there to make it easier to sort
  ERROR: "-1ERROR",
  OBSERVED: "0OBSERVED",
  QUEUED: "1QUEUED",
  LOADING: "2LOADING",
  LOADED: "3LOADED",
  PROCESSING: "4PROCESSING",
  PROCESSED: "5PROCESSED",
  DISABLED: "9DISABLED",
};

// when installed or updated load settings

import { DEFAULT_SETTINGS } from "./constants.js";

const defaultSettings = DEFAULT_SETTINGS;
var crashesCount = 0;
var crashTimestamp;

const initSettings = async () => {
  let result = await browser.storage.sync.get(["hb-settings"]);
  if (
    result?.["hb-settings"] === undefined ||
    result?.["hb-settings"] === null ||
    Object.keys(result?.["hb-settings"]).length === 0
  ) {
    await browser.storage.sync.set({ "hb-settings": defaultSettings });
  } else {
    // if there are any new settings, add them to the settings object
    await browser.storage.sync.set({
      "hb-settings": { ...defaultSettings, ...result["hb-settings"] },
    });
  }
  result = await browser.storage.sync.get(["hb-settings"]);
  return result;
};
browser.runtime.onInstalled.addListener(async function () {
  try {
    await initSettings();
  } catch (error) {
    console.error(error);
  }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getSettings") {
    initSettings().then((result) => {
      const isVideoEnabled =
        result["hb-settings"]?.status && result["hb-settings"]?.blurVideos;
      browser.contextMenus.update("enable-detection", {
        enabled: isVideoEnabled,
        checked: isVideoEnabled,
        title: isVideoEnabled
          ? "HaramBlur: Enabled for this video"
          : "HaramBlur: Please enable video detection in settings",
      });

      sendResponse(result["hb-settings"]);
    });

    return true;
  } else if (request.type === "video-status") {
    browser.contextMenus.update("enable-detection", {
      checked: request.status,
    });
  } else if (request.type === "reloadExtension") {
    // reload only once every minute
    browser.storage.local.get("reloadingInfo", function (result) {
      const { lastReload, reloadCount } = result.reloadingInfo ?? {
        lastReload: 0,
        reloadCount: 0,
      };
      if (Date.now() - lastReload > 60000) {
        if (reloadCount > 3) {
          // if reloaded more than 3 times in a minute, stop reloading
          // in 5 minutes time clear the reload count
          setTimeout(() => {
            browser.storage.local.set({
              reloadingInfo: {
                lastReload: Date.now(),
                reloadCount: 0,
              },
            });
          }, 300000);

          return;
        }
        browser.storage.local.set({
          reloadingInfo: {
            lastReload: Date.now(),
            reloadCount: reloadCount + 1,
          },
        });
        reloadExtension();
      }
    });
  } else if (request.type === "updateSettings") {
    const { key, value } = request.newSetting;
    browser.storage.sync.get(["hb-settings"], function (result) {
      const settings = result["hb-settings"];
      settings[key] = value;
      browser.storage.sync.set({ "hb-settings": settings });
    });
    // return true;
  }
});

const countCrashes = () => {
  if (crashesCount === 0) {
    crashTimestamp = Date.now();
  }
  crashesCount++;
  if (crashesCount >= 3) {
    if (Date.now() - crashTimestamp < 120000) {
      // do something
    } else {
      crashesCount = 0;
    }
  }
};

// context menu: "enable detection on this video"
browser.contextMenus.create({
  id: "enable-detection",
  title: "HaramBlur: Enable for this video",
  contexts: ["all"],
  type: "checkbox",
  enabled: true,
  checked: true,
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  console.log("HB== context menu clicked", info, tab);
  if (info.menuItemId === "enable-detection") {
    if (info.checked) {
      browser.tabs.sendMessage(tab.id, {
        type: "enable-detection",
      });
    } else {
      browser.tabs.sendMessage(tab.id, {
        type: "disable-detection",
      });
    }
  }

  return true;
});

// on install, onboarding
browser.runtime.onInstalled.addListener(function (details) {
  const manifest = browser.runtime.getManifest();
  if (details?.reason === "install") {
    browser.tabs.create({
      url: browser.runtime.getURL("src/assets/support-install.html"),
    });
  } else if (details?.reason === "update") {
    const currentVersion = manifest.version;
    const previousVersion = details.previousVersion;
    if (currentVersion != previousVersion) {
      // browser.tabs.create({
      //     url: browser.runtime.getURL("src/assets/support-update.html"),
      // });
    }
  }
  promptUserToReload();
});

// on uninstall
browser.runtime.setUninstallURL("https://forms.gle/RovVrtp29vK3Z7To7");

function reloadExtension() {
  browser.runtime.reload();
  reInjectScript();
  countCrashes();
}

function reInjectScript() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  browser.tabs.query(queryOptions, ([tab]) => {
    browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["dist/content.js"],
    });
  });
}

function promptUserToReload() {
  browser.tabs.query({ url: "<all_urls>" }, (tabs) => {
    for (const tab of tabs) {
      if (tab.url.match(/(chrome|chrome-extension):\/\//gi)) {
        continue;
      }
      const target = { tabId: tab.id, allFrames: true };

      browser.scripting.executeScript({
        // files: cs.js,
        func: () => {
          const style = {
            position: "fixed",
            bottom: "0",
            right: "0",
            backgroundColor: "#C55112FF",
            color: "white",
            zIndex: "9999",
            padding: "20px",
            borderTopLeftRadius: "10px",
            cursor: "pointer",
            transition: "all 0.5s ease",
            fontSize: "1.5rem",
            boxShadow: "0 0 10px 0px black",
            display: "flex",
            alignItems: "center",
          };
          // Solution:
          const alert = () => {
            let alertMessage = document.getElementById("hb-alert");
            if (alertMessage) {
              alertMessage.remove();
            }
            alertMessage = document.createElement("div");
            alertMessage.id = "hb-alert";
            for (const key in style) {
              alertMessage.style[key] = style[key];
            }
            alertMessage.innerHTML = `
                         <img src='${browser.runtime.getURL(
                           "src/assets/hb-icon-128.png"
                         )}' style="width: 30px; height: 30px; margin-right: 10px;" alt="HaramBlur Icon" /> 
                        <div>HaramBlur was installed or updated. <a style='color:white; text-decoration:underline;' href='#'>Please refresh this tab</a>  </div>`;
            // close icon
            alertMessage.innerHTML += `<div style="font-size: 2rem; margin-left:20px; border:1px solid white; padding:0px 4px;" id="close">&times;</div>`;
            alertMessage.addEventListener("click", (e) => {
              if (e.target.id === "close") {
                alertMessage.remove();
                return;
              }
              window.location.reload();
              alertMessage.remove();
            });

            document.body.appendChild(alertMessage);
          };

          alert();
        },
        injectImmediately: true,
        target,
      });
    }
  });
}
