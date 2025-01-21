let currentUtterance;
let pdfDoc;

// Function to get browser language
function getBrowserLanguage() {
    return navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage);
}

// Get the default language of the speech synthesis (vocal)
function getSpeechLanguage() {
    const voices = window.speechSynthesis.getVoices();
    const lang = voices[0] ? voices[0].lang.split('-')[0] : getBrowserLanguage().split('-')[0]; // Use the first voice as the default
    return lang;
}

// Set document language and translate content on page load
document.addEventListener('DOMContentLoaded', function() {
    const langCode = getBrowserLanguage().split('-')[0]; // Use language part only, not the region
    document.documentElement.lang = langCode;

    // Translation messages for different languages
    const translations = {
        'en': {
            startBtn: "Start Reading",
            pauseBtn: "Pause",
            resumeBtn: "Resume",
            noticeMessage: "The voice has been changed to match the language of the PDF. Please ensure your device's voice matches this language for correct reading.",
            closeNoticeBtn: "Close"
        },
        'fr': {
            startBtn: "Commencer la lecture",
            pauseBtn: "Pause",
            resumeBtn: "Reprendre",
            noticeMessage: "La voix a été changée pour correspondre à la langue du PDF. Veuillez vous assurer que la voix de votre appareil correspond à cette langue pour une lecture correcte.",
            closeNoticeBtn: "Fermer"
        },
        'ar': {
            startBtn: "بدء القراءة",
            pauseBtn: "إيقاف مؤقت",
            resumeBtn: "استئناف",
            noticeMessage: "تم تغيير الصوت ليتطابق مع لغة ملف PDF. يرجى التأكد من أن صوت جهازك يتطابق مع هذه اللغة لضمان القراءة بشكل صحيح.",
            closeNoticeBtn: "إغلاق"
        }
    };

    // Apply translated texts based on browser language
    function setLanguageText(language) {
        const texts = translations[language] || translations['en']; // Fallback to English
        document.getElementById('startBtn').textContent = texts.startBtn;
        document.getElementById('pauseBtn').textContent = texts.pauseBtn;
        document.getElementById('resumeBtn').textContent = texts.resumeBtn;
        document.getElementById('languageNoticeMessage').textContent = texts.noticeMessage;
        document.getElementById('closeNoticeBtn').textContent = texts.closeNoticeBtn;
    }

    setLanguageText(langCode); // Set text according to browser language
});

document.getElementById('startBtn').addEventListener('click', startReading);
document.getElementById('pauseBtn').addEventListener('click', pauseReading);
document.getElementById('resumeBtn').addEventListener('click', resumeReading);
document.getElementById('closeNoticeBtn').addEventListener('click', closeNotice);

// Show the language notice if needed
function showLanguageNotice() {
    document.getElementById('languageNotice').style.display = 'block';
}

async function startReading() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (file) {
        document.getElementById('loadingSpinner').style.display = 'block';
        const arrayBuffer = await file.arrayBuffer();
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdfDoc.numPages;
        document.getElementById('loadingSpinner').style.display = 'none';

        for (let i = 1; i <= numPages; i++) {
            const textContent = await readPage(i);
            await speakText(textContent);
        }
    }
}

async function readPage(pageNum) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    document.getElementById('pdfContainer').appendChild(canvas);

    const textContent = await page.getTextContent();
    const textItems = textContent.items;
    const texts = textItems.map(item => item.str).join(' ');

    // Determine the language of the PDF text
    const language = getLanguageFromText(texts);
    const speechLang = getSpeechLanguage();

    // Show language notice if the PDF language is different from the speech language
    if (language !== speechLang) {
        showLanguageNotice();
    }

    return texts;
}

function getLanguageFromText(text) {
    const arabicRegex = /[\u0600-\u06FF]/;
    if (arabicRegex.test(text)) {
        return 'ar';
    }
    return 'fr'; // Modify according to the need to support other languages
}

function speakText(text) {
    return new Promise((resolve) => {
        currentUtterance = new SpeechSynthesisUtterance(text);
        currentUtterance.lang = getLanguageFromText(text);
        currentUtterance.onend = resolve;
        window.speechSynthesis.speak(currentUtterance);
    });
}

function pauseReading() {
    if (currentUtterance) {
        window.speechSynthesis.pause();
    }
}

function resumeReading() {
    if (currentUtterance && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    } else {
        console.log('SpeechSynthesis is not paused or there is no current utterance.');
    }
}

function closeNotice() {
    document.getElementById('languageNotice').style.display = 'none';
}
