let badWords = []; 

// جلب البيانات وتحميل الكلمات المحظورة
async function loadBadWords() {
  try {
    const response = await fetch("/data/badwords.txt");
    if (!response.ok) throw new Error("خطأ في تحميل الملف النصي");
    
    const text = await response.text();
    badWords = text.split("\n").map(word => word.trim()).filter(Boolean);
    console.log("تم تحميل الكلمات:", badWords);
  } catch (error) {
    console.error("حدث خطأ:", error);
  }
}

// استبدال الكلمات المحظورة بالنجمات
function filterBadWordsInText(text) {
  if (!badWords.length) return text;

  const regex = new RegExp(`(${badWords.join("|")})`, "gi");
  return text.replace(regex, match => "*".repeat(match.length));
}

// البحث عن النصوص المحظورة في الصفحة
function searchTextInPage() {
  if (!badWords.length) return console.log("الكلمات المحظورة لم يتم تحميلها بعد.");

  const regex = new RegExp(`(${badWords.join("|")})`, "gi");
  
  Array.from(document.body.getElementsByTagName("*")).forEach(element => {
    // استبدال النصوص داخل العناصر
    Array.from(element.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent = filterBadWordsInText(child.textContent);
      }
    });

    // استبدال النصوص في alt و title
    if (element.alt) element.alt = element.alt.replace(regex, "*");
    if (element.title) element.title = element.title.replace(regex, "*");
  });

  console.log("تم البحث عن الكلمات المحظورة في الصفحة");
}