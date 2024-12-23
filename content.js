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

// ------------------------------------- فلترة الكلمات السيئة
const badWords = [
  "خول ",
  "عرص",
  "بعبوص",
  "كسمك",
  "كس امك",
  "كس اختك",
  "الوسخة",
  "ابن الكلب",
  "شرموطة",
  "كسك",
  "ابن الحرام",
  "ولاد الحرام",
  "بنت الكلبة",
  "معرصة",
  "قحبة",
  "قحبه",
  "شرموته",
  "زانية",
  "لوطي",
  "طيز",
  "طياز",
  "انيكك",
  "انعل ابوك",
  "يلعن",
  "كسم",
];

// دالة للبحث واستبدال الكلمات في النص
function filterBadWordsInText(text) {
  // إنشاء تعبير منتظم واحد للكلمات المحظورة
  const regex = new RegExp(`(${badWords.join("|")})`, "gi");
  return text.replace(regex, (match) => "*".repeat(match.length));
}

// دالة للبحث في النصوص داخل الصفحة
function searchTextInPage() {
  // الحصول على كل العناصر في الصفحة
  const bodyElements = document.body.getElementsByTagName("*");

  // تحويل HTMLCollection إلى مصفوفة لتسهيل التعامل معها
  Array.from(bodyElements).forEach((element) => {
    // إذا كان العنصر يحتوي على نصوص داخلية
    if (element.hasChildNodes()) {
      Array.from(element.childNodes).forEach((child) => {
        // إذا كان العنصر نصًا (نص داخل العنصر)
        if (child.nodeType === Node.TEXT_NODE) {
          child.textContent = filterBadWordsInText(child.textContent); // استبدال الكلمات المحظورة
        }
      });
    }

    // استثناء العناصر التي تحتوي على خاصيتي alt و title من التعديل
    if (element.alt && badWords.some((word) => element.alt.includes(word))) {
      element.alt = element.alt.replace(
        new RegExp(`(${badWords.join("|")})`, "gi"),
        "*"
      );
    }

    if (
      element.title &&
      badWords.some((word) => element.title.includes(word))
    ) {
      element.title = element.title.replace(
        new RegExp(`(${badWords.join("|")})`, "gi"),
        "*"
      );
    }
  });

  console.log("تم البحث عن الكلمات المحظورة في الصفحة");
}

// الاستماع لتغيير القيمة في التخزين
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.badwordsEnabled?.newValue !== undefined) {
    // تفعيل أو تعطيل الدالة بناءً على القيمة الجديدة
    if (changes.badwordsEnabled.newValue) {
      searchTextInPage();
    }
  }
});

// الحصول على الحالة الحالية من التخزين
browser.storage.local.get("badwordsEnabled").then((result) => {
  if (result.badwordsEnabled !== undefined) {
    // إذا كانت القيمة موجودة، تفعيل الدالة بناءً عليها
    if (result.badwordsEnabled) {
      searchTextInPage();
    }
  }
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
browser.runtime.onMessage.addListener((message) => {
  if (message.buttonType === "cancel") {
    browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map((rule) => rule.id),
    });
  } else {
    addRules(message.action);
  }
});

browser.runtime.onInstalled.addListener(() => {
  addRules("default");
  // browser.tabs.create({ url: "https://www.buymeacoffee.com/skepr" });
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
