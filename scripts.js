// تحديد لغة المتصفح
const userLanguage = navigator.language || navigator.userLanguage;

// نصوص الواجهة بلغات مختلفة
const translations = {
    en: {
        title: "Image Editor",
        brightness: "Brightness",
        contrast: "Contrast",
        saturation: "Saturation",
        hue: "Hue",
        grayscale: "Grayscale",
        invert: "Invert Colors",
        rotate: "Rotate",
        crop: "Start Manual Crop",
        download: "Download Image",
    },
    ar: {
        title: "تعديل الصور",
        brightness: "السطوع",
        contrast: "التباين",
        saturation: "التشبع",
        hue: "درجة اللون",
        grayscale: "أبيض وأسود",
        invert: "عكس الألوان",
        rotate: "تدوير",
        crop: "بدء القص اليدوي",
        download: "تحميل الصورة",
    },
};

// تحديد اللغة بناءً على لغة المتصفح
const lang = userLanguage.startsWith("ar") ? "ar" : "en";
const texts = translations[lang];

// تحديث نصوص الواجهة وعنوان الصفحة
document.title = texts.title; // تحديث عنوان الصفحة
document.getElementById("app-title").textContent = texts.title;
document.getElementById("brightness-label").innerHTML = `${texts.brightness}: <input type="range" id="brightness" min="0" max="200" value="100">`;
document.getElementById("contrast-label").innerHTML = `${texts.contrast}: <input type="range" id="contrast" min="0" max="200" value="100">`;
document.getElementById("saturation-label").innerHTML = `${texts.saturation}: <input type="range" id="saturation" min="0" max="200" value="100">`;
document.getElementById("hue-label").innerHTML = `${texts.hue}: <input type="range" id="hue" min="0" max="360" value="0">`;
document.getElementById("grayscale-btn").textContent = texts.grayscale;
document.getElementById("invert-btn").textContent = texts.invert;
document.getElementById("rotate-btn").textContent = texts.rotate;
document.getElementById("crop-btn").textContent = texts.crop;
document.getElementById("download-btn").textContent = texts.download;

// بقية الكود
const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const cropCanvas = document.getElementById('cropCanvas');
const cropCtx = cropCanvas.getContext('2d');
let originalImage = null;

let isCropping = false;
let startX, startY, endX, endY;

// تحميل الصورة
upload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
        alert("يرجى اختيار صورة صالحة.");
        return;
    }
    try {
        const img = await loadImage(file);
        // تحديد حجم الصورة إذا كانت كبيرة
        const maxWidth = 800; // الحد الأقصى للعرض
        const maxHeight = 800; // الحد الأقصى للارتفاع
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
        console.error('Failed to load image:', error);
    }
});

// تحميل الصورة ككائن Image
async function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// بدء القص اليدوي
function startManualCrop() {
    isCropping = true;
}

// أحداث الفأرة للقص
canvas.addEventListener('mousedown', (e) => {
    if (isCropping) {
        const rect = canvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (isCropping) {
        const rect = canvas.getBoundingClientRect();
        endX = e.clientX - rect.left;
        endY = e.clientY - rect.top;
        cropImage();
        isCropping = false;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isCropping) {
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        ctx.putImageData(originalImage, 0, 0);
        ctx.beginPath();
        ctx.rect(startX, startY, currentX - startX, currentY - startY);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
});

// أحداث اللمس للقص
canvas.addEventListener('touchstart', (e) => {
    if (isCropping) {
        e.preventDefault(); // منع السلوك الافتراضي
        const rect = canvas.getBoundingClientRect();
        startX = e.touches[0].clientX - rect.left;
        startY = e.touches[0].clientY - rect.top;
    }
});

canvas.addEventListener('touchend', (e) => {
    if (isCropping) {
        e.preventDefault(); // منع السلوك الافتراضي
        const rect = canvas.getBoundingClientRect();
        endX = e.changedTouches[0].clientX - rect.left;
        endY = e.changedTouches[0].clientY - rect.top;
        cropImage();
        isCropping = false;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (isCropping) {
        e.preventDefault(); // منع السلوك الافتراضي
        const rect = canvas.getBoundingClientRect();
        const currentX = e.touches[0].clientX - rect.left;
        const currentY = e.touches[0].clientY - rect.top;

        ctx.putImageData(originalImage, 0, 0);
        ctx.beginPath();
        ctx.rect(startX, startY, currentX - startX, currentY - startY);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
});

// تطبيق الفلاتر
function applyFilter(filter) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (filter === 'grayscale') {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        } else if (filter === 'invert') {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

// تحديث الصورة بناءً على التعديلات
const brightness = document.getElementById('brightness');
const contrast = document.getElementById('contrast');
const saturation = document.getElementById('saturation');
const hue = document.getElementById('hue');

brightness.addEventListener('input', updateImage);
contrast.addEventListener('input', updateImage);
saturation.addEventListener('input', updateImage);
hue.addEventListener('input', updateImage);

function updateImage() {
    if (originalImage) {
        ctx.putImageData(originalImage, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const brightnessValue = brightness.value / 100;
        const contrastValue = contrast.value / 100;
        const saturationValue = saturation.value / 100;
        const hueValue = hue.value;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            r *= brightnessValue;
            g *= brightnessValue;
            b *= brightnessValue;

            r = ((r - 128) * contrastValue + 128);
            g = ((g - 128) * contrastValue + 128);
            b = ((b - 128) * contrastValue + 128);

            const avg = (r + g + b) / 3;
            r = avg + (r - avg) * saturationValue;
            g = avg + (g - avg) * saturationValue;
            b = avg + (b - avg) * saturationValue;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;

            if (delta !== 0) {
                if (max === r) {
                    data[i] = hueValue;
                } else if (max === g) {
                    data[i + 1] = hueValue;
                } else if (max === b) {
                    data[i + 2] = hueValue;
                }
            }

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }

        ctx.putImageData(imageData, 0, 0);
    }
}

// تدوير الصورة
function rotateImage() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.height;
    tempCanvas.height = canvas.width;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate(Math.PI / 2);
    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
    originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// قص الصورة
function cropImage() {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(startX - endX);
    const height = Math.abs(startY - endY);

    const imageData = ctx.getImageData(x, y, width, height);
    cropCanvas.width = width;
    cropCanvas.height = height;
    cropCtx.putImageData(imageData, 0, 0);
}

// تحميل الصورة بعد التعديل
function downloadImage() {
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = cropCanvas.toDataURL();
    link.click();
}