const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const brightnessInput = document.getElementById('brightness');
const contrastInput = document.getElementById('contrast');
const saturationInput = document.getElementById('saturation');
const applyFiltersBtn = document.getElementById('apply-filters-btn');
const grayscaleBtn = document.getElementById('grayscale-btn');
const cropBtn = document.getElementById('crop-btn');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
let originalImage = null;
let isCropping = false;
let cropStartX, cropStartY, cropEndX, cropEndY;

// نصوص التطبيق بلغات مختلفة
const translations = {
    en: {
        pageTitle: "Image Editor", // عنوان الصفحة بالإنجليزية
        appTitle: "Image Editor",
        brightnessLabel: "Brightness:",
        contrastLabel: "Contrast:",
        saturationLabel: "Saturation:",
        applyFiltersBtn: "Apply Filters",
        grayscaleBtn: "Grayscale",
        cropBtn: "Manual Crop",
        downloadBtn: "Download Image",
        resetBtn: "Reset",
        alertInvalidImage: "Please select a valid image.",
        alertCropInstruction: "Click and drag to select the crop area.",
    },
    ar: {
        pageTitle: "تعديل الصور", // عنوان الصفحة بالعربية
        appTitle: "تعديل الصور",
        brightnessLabel: "سطوع:",
        contrastLabel: "تباين:",
        saturationLabel: "تشبع:",
        applyFiltersBtn: "تطبيق الفلاتر",
        grayscaleBtn: "أبيض وأسود",
        cropBtn: "قص يدوي",
        downloadBtn: "تحميل الصورة",
        resetBtn: "إعادة تعيين",
        alertInvalidImage: "يرجى اختيار صورة صالحة.",
        alertCropInstruction: "انقر واسحب لتحديد منطقة القص.",
    },
};

// تحديد لغة المتصفح
const userLanguage = navigator.language.startsWith("ar") ? "ar" : "en";
const texts = translations[userLanguage];

// تعيين عنوان الصفحة بناءً على اللغة
document.title = texts.pageTitle;

// تعيين النصوص بناءً على اللغة
document.getElementById("app-title").textContent = texts.appTitle;
document.getElementById("brightness-label").textContent = texts.brightnessLabel;
document.getElementById("contrast-label").textContent = texts.contrastLabel;
document.getElementById("saturation-label").textContent = texts.saturationLabel;
applyFiltersBtn.textContent = texts.applyFiltersBtn;
grayscaleBtn.textContent = texts.grayscaleBtn;
cropBtn.textContent = texts.cropBtn;
downloadBtn.textContent = texts.downloadBtn;
resetBtn.textContent = texts.resetBtn;

// تحميل الصورة
upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
        alert(texts.alertInvalidImage);
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// تطبيق الفلاتر
function applyFilters() {
    if (!originalImage) {
        alert(texts.alertInvalidImage);
        return;
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const brightness = parseFloat(brightnessInput.value);
    const contrast = parseFloat(contrastInput.value);
    const saturation = parseFloat(saturationInput.value);

    for (let i = 0; i < data.length; i += 4) {
        // تطبيق السطوع
        data[i] += brightness; // الأحمر
        data[i + 1] += brightness; // الأخضر
        data[i + 2] += brightness; // الأزرق

        // تطبيق التباين
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;

        // تطبيق التشبع
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg + (data[i] - avg) * (1 + saturation / 100);
        data[i + 1] = avg + (data[i + 1] - avg) * (1 + saturation / 100);
        data[i + 2] = avg + (data[i + 2] - avg) * (1 + saturation / 100);
    }

    ctx.putImageData(imageData, 0, 0);
}

// تطبيق فلتر الأبيض والأسود
function applyGrayscale() {
    if (!originalImage) {
        alert(texts.alertInvalidImage);
        return;
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg; // الأحمر
        data[i + 1] = avg; // الأخضر
        data[i + 2] = avg; // الأزرق
    }

    ctx.putImageData(imageData, 0, 0);
}

// بدء القص اليدوي
function startManualCrop() {
    if (!originalImage) {
        alert(texts.alertInvalidImage);
        return;
    }

    isCropping = true;
    alert(texts.alertCropInstruction);
}

// تفاعلات الماوس للقص
canvas.addEventListener('mousedown', (e) => {
    if (isCropping) {
        cropStartX = e.offsetX;
        cropStartY = e.offsetY;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (isCropping) {
        cropEndX = e.offsetX;
        cropEndY = e.offsetY;
        cropImage();
        isCropping = false;
    }
});

// قص الصورة
function cropImage() {
    const width = cropEndX - cropStartX;
    const height = cropEndY - cropStartY;
    const imageData = ctx.getImageData(cropStartX, cropStartY, width, height);

    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(imageData, 0, 0);
    originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// تحميل الصورة بعد التعديل
function downloadImage() {
    if (!originalImage) {
        alert(texts.alertInvalidImage);
        return;
    }

    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL();
    link.click();
}

// إعادة تعيين الصورة
function resetImage() {
    if (!originalImage) {
        alert(texts.alertInvalidImage);
        return;
    }

    ctx.putImageData(originalImage, 0, 0);
    brightnessInput.value = 0;
    contrastInput.value = 0;
    saturationInput.value = 0;
}

// ربط الدوال بالأزرار
applyFiltersBtn.addEventListener('click', applyFilters);
grayscaleBtn.addEventListener('click', applyGrayscale);
cropBtn.addEventListener('click', startManualCrop);
downloadBtn.addEventListener('click', downloadImage);
resetBtn.addEventListener('click', resetImage);