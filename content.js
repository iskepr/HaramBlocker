let style = document.createElement("style");
document.body.appendChild(style);

browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && "value" in changes) {
    update(changes.value.newValue);
  }
});

function update(value) {
  style.innerText = "body {filter: sepia(" + value + "%) !important }";
  title.innerHTML = value;
}

browser.storage.local.get("value").then((result) => update(result.value));

// prn blocer
("use strict");

// تعريف مصفوفات لتخزين القواعد والمواقع
let rules = [];
let url = "";
let websites = [];
let custom_webs = ["upwork.com"]; // إضافة مواقع مخصصة، مثال: Upwork

// دالة لإضافة القواعد بناءً على الإجراء المحدد
function addRulesBasedOnAction(action) {
  // تحديد الرابط بناءً على الإجراء الذي تم اختياره
  switch (action) {
    case "default":
      url =
        "https://raw.githubusercontent.com/abutashin/harampolice/main/websites.txt"; // رابط المواقع الممنوعة (مثل القمار)
      break;
    case "social_media":
      url =
        "https://raw.githubusercontent.com/abutashin/harampolice/main/social_media.txt"; // رابط مواقع التواصل الاجتماعي
      break;
    default:
      console.error("Invalid action selected"); // رسالة خطأ إذا كان الإجراء غير صالح
      return;
  }

  // تحميل البيانات من الرابط المحدد
  fetch(url)
    .then((response) => response.text()) // تحويل الاستجابة إلى نص
    .then((text) => {
      let websitess = text.split("\r\n"); // تقسيم النص إلى قائمة مواقع
      let redURL; // تحديد صفحة التوجيه بناءً على الإجراء
      if (action === "default") {
        redURL = "block.html";
      } else if (action === "dating") {
        redURL = "dating_block.html";
      } else if (action === "gambling") {
        redURL = "gambling_block.html";
      } else if (action === "social_media") {
        redURL = "social_block.html";
      }

      // إضافة المواقع إلى مصفوفة websites
      for (let i = 0; i < websitess.length - 1; i++) {
        websites.push(websitess[i]);
      }

      let removeRuleIds = [];
      // إضافة قواعد جديدة بناءً على المواقع التي تم تحميلها
      for (let i = 0; i <= websites.length; i++) {
        removeRuleIds.push(i);
      }

      // إضافة القواعد الخاصة بكل موقع
      websites.forEach((website) => {
        let id = rules.length + 1; // توليد معرف فريد لكل قاعدة
        let rule = {
          id: id,
          priority: 1, // تحديد الأولوية
          action: {
            type: "redirect", // تحديد نوع الإجراء (توجيه)
            redirect: {
              url: chrome.runtime.getURL(redURL), // تعيين عنوان التوجيه
            },
          },
          condition: {
            urlFilter: website, // الموقع المستهدف
            resourceTypes: ["main_frame"], // نوع المورد (الإطار الرئيسي)
          },
        };

        // إضافة القاعدة إلى المصفوفة
        rules.push(rule);
      });

      // تحديث القواعد الديناميكية في متصفح كروم
      chrome.declarativeNetRequest.updateDynamicRules(
        {
          addRules: rules,
          removeRuleIds: removeRuleIds,
        },
        () => {
          // التحقق من وجود أخطاء أثناء التحديث
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else {
            console.log("Rule added successfully");
          }
        }
      );
    })
    .catch((error) => {
      console.error(error); // طباعة الأخطاء إذا حدثت
    });
}

// دالة لإزالة القواعد بناءً على الإجراء المحدد
function removeRulesBasedOnAction(action) {
  switch (action) {
    case "default":
      url =
        "https://raw.githubusercontent.com/abutashin/harampolice/main/websites.txt"; // رابط المواقع الممنوعة
      break;
    case "social_media":
      url =
        "https://raw.githubusercontent.com/abutashin/harampolice/main/social_media.txt"; // رابط مواقع التواصل الاجتماعي
      break;
    default:
      console.error("Invalid action selected"); // رسالة خطأ إذا كان الإجراء غير صالح
      return;
  }

  // تحميل البيانات من الرابط المحدد
  fetch(url)
    .then((response) => response.text()) // تحويل الاستجابة إلى نص
    .then((text) => {
      let websitess = text.split("\r\n"); // تقسيم النص إلى قائمة مواقع
      let removeRuleIds = [];

      // تحديد القواعد التي يجب إزالتها بناءً على المواقع
      for (let i = 0; i <= rules.length - 1; i++) {
        if (websitess.includes(rules[i].condition.urlFilter)) {
          removeRuleIds.push(rules[i].id); // إضافة معرّف القاعدة للإزالة
          rules = rules.filter(function (idee) {
            return idee !== rules[i].id; // إزالة القاعدة من المصفوفة
          });
        }
      }

      // تحديث القواعد الديناميكية في متصفح كروم
      chrome.declarativeNetRequest.updateDynamicRules(
        {
          removeRuleIds: removeRuleIds, // إزالة القواعد المحددة
        },
        () => {
          // التحقق من وجود أخطاء أثناء التحديث
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else {
            console.log("Rules removed successfully");
          }
        }
      );
    });
}

// الاستماع لحدث تثبيت/تحديث الإضافة
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install" || details.reason === "update") {
    // فتح رابط في تبويب جديد عند التثبيت أو التحديث
    chrome.tabs.create({ url: "https://www.buymeacoffee.com/skepr" });
  }
});

// إضافة القواعد بناءً على الإجراء "default"
addRulesBasedOnAction("default");
console.log(websites); // طباعة المواقع المُعالجة

// الاستماع للرسائل من السكربت (مثل الرسائل من النافذة المنبثقة)
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("Selected action: " + message.action); // طباعة الإجراء المحدد
  if (message.buttonType === "cancel") {
    removeRulesBasedOnAction(message.action); // إزالة القواعد إذا تم الضغط على "إلغاء"
  } else {
    rules = []; // مسح القواعد السابقة
    websites = []; // مسح المواقع السابقة
    addRulesBasedOnAction(message.action); // إضافة القواعد بناءً على الإجراء الجديد
  }
});
