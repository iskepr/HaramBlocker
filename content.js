// إنشاء عنصر CSS لتغيير الفلتر
let style = document.createElement("style");
document.body.appendChild(style);

// تحديث CSS عند تغيير القيمة
function updateFilter(value) {
  style.innerText = `body {filter: sepia(${value}%) !important;}`;
}

// مراقبة التغييرات في التخزين المحلي
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.value?.newValue) {
    updateFilter(changes.value.newValue);
  }
});

// جلب القيمة المخزنة عند التحميل
browser.storage.local.get("value").then((result) => {
  if (result.value) updateFilter(result.value);
});

// -------------------------------------------------------------- مانع الاباحية والتواصل الاجتماعي
// إضافة القواعد بناءً على نوع الإجراء
let rules = [];
let websites = [];

function addRules(action) {
  let urlMap = {
    default: "data/websites.txt",
    socialMedia: "data/socialMedia.txt",
  };

  let redirectionMap = {
    default: "block.html",
    socialMedia: "socialBlock.html",
  };

  let url = urlMap[action];
  let redURL = redirectionMap[action];

  if (!url || !redURL) return console.error("Invalid action");

  fetch(url)
    .then((response) => response.text())
    .then((text) => {
      websites = text.split("\r\n").filter((site) => site);
      rules = websites.map((site, index) => ({
        id: index + 1,
        priority: 1,
        action: {
          type: "redirect",
          redirect: { url: chrome.runtime.getURL(redURL) },
        },
        condition: { urlFilter: site, resourceTypes: ["main_frame"] },
      }));

      chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules,
        removeRuleIds: Array.from({ length: rules.length }, (_, i) => i + 1),
      });
    })
    .catch((err) => console.error("Error fetching rules:", err));
}

// التعامل مع الرسائل الواردة من الإضافة
chrome.runtime.onMessage.addListener((message) => {
  if (message.buttonType === "cancel") {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map((rule) => rule.id),
    });
  } else {
    addRules(message.action);
  }
});


chrome.runtime.onInstalled.addListener(() => {
  addRules("default");
  chrome.tabs.create({ url: "https://www.buymeacoffee.com/skepr" });
});

function setSocialBlock(socialEnabled) {
  addRules(socialEnabled ? "socialMedia" : "default");
}

// استمع لتغييرات التخزين
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.socialEnabled?.newValue !== undefined) {
    setSocialBlock(changes.socialEnabled.newValue);
  }
});

// الحصول على الحالة الحالية من التخزين
browser.storage.local.get("socialEnabled").then((result) => {
  if (result.socialEnabled !== undefined) {
    setSocialBlock(result.socialEnabled);
  }
});
