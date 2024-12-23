// معالجة قيمة النطاق (range)
let range = document.getElementById("range");
range.addEventListener("change", (e) => {
  setValue(e.target.value);
});

async function setValue(value) {
  await browser.storage.local.set({ value });
}

async function init() {
  let { value } = await browser.storage.local.get("value");
  if (!value) {
    value = 0;
  }
  range.value = value;
  setValue(value);
}

init().catch((e) => console.error(e));
// -------------------------------------------------------- مانع الكلمات السيئة
let badwords = document.getElementById("badwords");

// حفظ الحالة عند التغيير
badwords.addEventListener("change", () => {
  const badwordsEnabled = badwords.checked;
  setbadwords(badwordsEnabled);
});
async function setbadwords(badwordsEnabled) {
  await browser.storage.local.set({ badwordsEnabled });
}
async function initializebadwords() {
  let { badwordsEnabled } = await browser.storage.local.get("badwordsEnabled");

  if (typeof badwordsEnabled === "undefined") {
    badwordsEnabled = false;
  }
  badwords.checked = badwordsEnabled;
}
initializebadwords();
// -------------------------------------------------------- مانع الاباحية والتواصل الاجتماعي
let socialbut = document.getElementById("social");

// حفظ الحالة عند التغيير
socialbut.addEventListener("change", () => {
  const socialEnabled = socialbut.checked;
  setsocial(socialEnabled);
});
async function setsocial(socialEnabled) {
  await browser.storage.local.set({ socialEnabled });
}
async function initializesocial() {
  let { socialEnabled } = await browser.storage.local.get("socialEnabled");

  if (typeof socialEnabled === "undefined") {
    socialEnabled = false;
  }
  socialbut.checked = socialEnabled;
}
initializesocial();

// قائمة الآيات القرآنية
const verses = [
  {
    aya: "قُل لِّلۡمُؤۡمِنِينَ يَغُضُّوا۟ مِنۡ أَبۡصَٰرِهِمۡ وَيَحۡفَظُوا۟ فُرُوجَهُمۡۚ ذَٰلِكَ أَزۡكَىٰ لَهُمۡۗ إِنَّ ٱللَّهَ خَبِيرُۢ بِمَا يَصۡنَعُونَ",
    sura: "[النور: 30]",
  },
  {
    aya: "وَقُل لِّلۡمُؤۡمِنَٰتِ يَغۡضُضۡنَ مِنۡ أَبۡصَٰرِهِنَّ وَيَحۡفَظۡنَ فُرُوجَهُنَّ وَلَا يُبۡدِينَ زِينَتَهُنَّ إِلَّا مَا ظَهَرَ مِنۡهَا",
    sura: "[النور: 31]",
  },
  {
    aya: "إِنَّ ٱلَّذِينَ يُحِبُّونَ أَن تَشِيعَ ٱلۡفَٰحِشَةُ فِي ٱلَّذِينَ ءَامَنُواْ لَهُمۡ عَذَابٌ أَلِيمٞ فِي ٱلدُّنۡيَا وَٱلۡأٓخِرَةِۚ وَٱللَّهُ يَعۡلَمُ وَأَنتُمۡ لَا تَعۡلَمُونَ",
    sura: "[النور: 19]",
  },
  {
    aya: "وَلَا تَقۡرَبُواْ ٱلزِّنَىٰٓ إِنَّهُۥ كَانَ فَٰحِشَةٗ وَسَآءَ سَبِيلًا",
    sura: "[الإسراء: 32]",
  },
  {
    aya: "وَٱلَّذِينَ هُمۡ لِفُرُوجِهِمۡ حَٰفِظُونَ إِلَّا عَلَىٰٓ أَزۡوَٰجِهِمۡ أَوۡ مَا مَلَكَتۡ أَيۡمَٰنُهُمۡ فَإِنَّهُمۡ غَيۡرُ مَلُومِينَ",
    sura: "[المؤمنون: 5-6]",
  },
];

// دالة لاختيار آية عشوائية
function getRandomVerse() {
  const randomIndex = Math.floor(Math.random() * verses.length);
  const ayaElement = document.getElementById("aya");
  ayaElement.innerHTML = "adasddas";

  if (ayaElement) {
    // تنظيف القيم قبل إدخالها في DOM
    const sanitizedAya = DOMPurify.sanitize(verses[randomIndex].aya);
    const sanitizedSura = DOMPurify.sanitize(verses[randomIndex].sura);

    ayaElement.innerHTML = `${sanitizedAya} <br> ${sanitizedSura}`;
  } else {
    console.error("عنصر الآية أو السورة غير موجود!");
  }
}

// عرض الآية عند التحميل
getRandomVerse();
