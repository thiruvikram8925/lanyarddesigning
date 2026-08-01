import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

const DPI = 300;
const MM_PER_INCH = 25.4;

function mmToPixels(mm) {
    return Math.round((mm / MM_PER_INCH) * DPI);
}

export const PHOTO_SIZE_PRESETS = [
    { label: "Passport", widthMm: 35, heightMm: 45, widthInch: parseFloat((35 / MM_PER_INCH).toFixed(2)), heightInch: parseFloat((45 / MM_PER_INCH).toFixed(2)) },
    { label: "ID Card", widthMm: 22, heightMm: 22, widthInch: parseFloat((22 / MM_PER_INCH).toFixed(2)), heightInch: parseFloat((22 / MM_PER_INCH).toFixed(2)) },
    { label: "ID/Visa", widthMm: 51, heightMm: 51, widthInch: parseFloat((51 / MM_PER_INCH).toFixed(2)), heightInch: parseFloat((51 / MM_PER_INCH).toFixed(2)) },
];

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = src;
    });
}

async function shrinkFile(file, maxDim = 1024) {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    URL.revokeObjectURL(url);

    let { width, height } = img;
    if (width <= maxDim && height <= maxDim) return file;

    if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
    } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to shrink file"));
        }, file.type || "image/png", 0.9);
    });
}

function getOpaqueBoundingBox(ctx, width, height) {
    const data = ctx.getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = 0, maxY = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const a = data[(y * width + x) * 4 + 3];
            if (a > 20) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (maxX <= minX || maxY <= minY) return { x: 0, y: 0, w: width, h: height };
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

async function detectFace(img) {
    if (typeof window.FaceDetector !== "undefined") {
        try {
            const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
            const faces = await detector.detect(img);
            if (faces.length > 0) {
                const bb = faces[0].boundingBox;
                return { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
            }
        } catch {}
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tCtx = tempCanvas.getContext("2d");
    tCtx.drawImage(img, 0, 0);

    const bbox = getOpaqueBoundingBox(tCtx, img.width, img.height);
    const faceH = bbox.h * 0.35;
    const faceW = bbox.w * 0.6;
    const faceX = bbox.x + (bbox.w - faceW) / 2;
    const faceY = bbox.y;

    return { x: faceX, y: faceY, width: faceW, height: faceH };
}

function computeSmartCrop(imgW, imgH, face, targetAspect) {
    const faceCenter = { x: face.x + face.width / 2, y: face.y + face.height / 2 };
    let cropH = face.height / 0.30;
    let cropW = cropH * targetAspect;

    if (cropW > imgW) {
        cropW = imgW;
        cropH = cropW / targetAspect;
    }
    if (cropH > imgH) {
        cropH = imgH;
        cropW = cropH * targetAspect;
    }

    let sy = faceCenter.y - cropH * 0.30;
    let sx = faceCenter.x - cropW / 2;

    sx = Math.max(0, Math.min(sx, imgW - cropW));
    sy = Math.max(0, Math.min(sy, imgH - cropH));

    return { sx: Math.round(sx), sy: Math.round(sy), sw: Math.round(cropW), sh: Math.round(cropH) };
}

export class AIImageProcessor {
    constructor() {
        this.isInitialized = false;
        this.segmenter = null;
    }

    async initialize() {
        if (this.isInitialized) return;
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            this.segmenter = await ImageSegmenter.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
                    delegate: "GPU"
                },
                runningMode: "IMAGE",
                outputCategoryMask: false,
                outputConfidenceMasks: true
            });
            this.isInitialized = true;
        } catch (error) {
            console.error("Failed to initialize MediaPipe ImageSegmenter", error);
        }
    }

    applyAutoContrastAndBalance(ctx, w, h) {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const hist = new Array(256).fill(0);
        let total = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
            if (a < 50 || (r > 240 && g > 240 && b > 240)) continue;
            const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            hist[lum]++;
            total++;
        }

        if (total === 0) return;

        let minL = 0, maxL = 255;
        let count = 0;
        for (let i = 0; i < 256; i++) {
            count += hist[i];
            if (count > total * 0.02) { minL = i; break; }
        }
        count = 0;
        for (let i = 255; i >= 0; i--) {
            count += hist[i];
            if (count > total * 0.02) { maxL = i; break; }
        }

        if (maxL <= minL) return;
        const scale = 255 / (maxL - minL);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
            if (a < 50 || (r > 240 && g > 240 && b > 240)) continue;
            data[i]   = Math.max(0, Math.min(255, (r - minL) * scale));
            data[i+1] = Math.max(0, Math.min(255, (g - minL) * scale));
            data[i+2] = Math.max(0, Math.min(255, (b - minL) * scale));
        }

        ctx.putImageData(imgData, 0, 0);
    }

    applySharpen(ctx, w, h, amount = 0.6) {
        for (let pass = 0; pass < 2; pass++) {
            const imageData = ctx.getImageData(0, 0, w, h);
            const src = imageData.data;
            const copy = new Uint8ClampedArray(src);

            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const idx = (y * w + x) * 4;
                    if (copy[idx + 3] < 10) continue;

                    for (let c = 0; c < 3; c++) {
                        const center = copy[idx + c];
                        const neighbors = copy[((y - 1) * w + x) * 4 + c] + copy[((y + 1) * w + x) * 4 + c] + copy[(y * w + (x - 1)) * 4 + c] + copy[(y * w + (x + 1)) * 4 + c];
                        const blur = neighbors / 4;
                        const diff = center - blur;
                        src[idx + c] = Math.max(0, Math.min(255, Math.round(center + amount * diff)));
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);
            amount *= 0.5;
        }
    }

    async processImage(file, photoSize, options) {
        const size = photoSize ?? PHOTO_SIZE_PRESETS[0];
        const bgColor = options?.backgroundColor ?? "#FFFFFF";

        const targetW_px = mmToPixels(size.widthMm);
        const targetH_px = mmToPixels(size.heightMm);

        try {
            if (!this.segmenter) await this.initialize();
            
            const optimalBlob = await shrinkFile(file, 1500);
            const url = URL.createObjectURL(optimalBlob);
            const originalImg = await loadImage(url);
            URL.revokeObjectURL(url);

            const result = this.segmenter.segment(originalImg);
            const personMask = result.confidenceMasks && result.confidenceMasks.length > 1 
                ? result.confidenceMasks[1].getAsFloat32Array() 
                : result.confidenceMasks[0].getAsFloat32Array();

            const subCanvas = document.createElement("canvas");
            subCanvas.width = originalImg.width;
            subCanvas.height = originalImg.height;
            const subCtx = subCanvas.getContext("2d");
            
            subCtx.drawImage(originalImg, 0, 0);
            
            const imgData = subCtx.getImageData(0, 0, originalImg.width, originalImg.height);
            const data = imgData.data;
            for (let i = 0; i < personMask.length; i++) {
                data[i * 4 + 3] = Math.round(personMask[i] * 255); 
            }
            subCtx.putImageData(imgData, 0, 0);
            
            const transparentUrl = subCanvas.toDataURL("image/png");
            const img = await loadImage(transparentUrl);
            
            const face = await detectFace(img);
            
            const canvas = document.createElement("canvas");
            canvas.width = targetW_px;
            canvas.height = targetH_px;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });

            if (bgColor !== 'transparent') {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, targetW_px, targetH_px);
            } else {
                ctx.clearRect(0, 0, targetW_px, targetH_px);
            }

            if (face) {
                const crop = computeSmartCrop(img.width, img.height, face, targetW_px / targetH_px);
                ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, targetW_px, targetH_px);
            } else {
                const aspect = img.width / img.height;
                const targetAspect = targetW_px / targetH_px;
                let sx, sy, sw, sh;
                if (aspect > targetAspect) {
                    sh = img.height;
                    sw = sh * targetAspect;
                    sx = (img.width - sw) / 2;
                    sy = 0;
                } else {
                    sw = img.width;
                    sh = sw / targetAspect;
                    sx = 0;
                    sy = (img.height - sh) / 2;
                }
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW_px, targetH_px);
            }

            this.applyAutoContrastAndBalance(ctx, targetW_px, targetH_px);
            this.applySharpen(ctx, targetW_px, targetH_px, 0.4);

            const format = bgColor === 'transparent' ? "image/png" : "image/jpeg";
            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Canvas export failed"));
                }, format, 0.95);
            });

        } catch (error) {
            console.error("Local Image Processing failed:", error);
            return file;
        }
    }
}
