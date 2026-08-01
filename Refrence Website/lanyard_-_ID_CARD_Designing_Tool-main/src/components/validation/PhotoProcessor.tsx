import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { uploadService, studentService } from "@/services/dataService";
import { Upload, CheckCircle, XCircle, Image as ImageIcon, User, Sparkles, Download, Loader2, Clock, AlertCircle, Pipette, Zap, ArrowLeftRight, ArrowRight } from "lucide-react";
import { AIImageProcessor, PHOTO_SIZE_PRESETS, type PhotoSize } from "@/services/aiImageProcessor";
import JSZip from 'jszip';
// Import pdfHandler first so the workerSrc is set, then import pdfjsLib
import '@/utils/pdfHandler';
import * as pdfjsLib from 'pdfjs-dist';
import { PhotoMatch } from "@/types/validation";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { parseColorCode, toHexColor, isValidColor, getColorFormatLabel, resolveColorForCanvas } from "@/lib/colorUtils";
import { MASSIVE_COLOR_PRESETS } from "@/lib/colorPresets";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";

const ALLOWED_EXTENSIONS = ['jpeg', 'jpg', 'png', 'webp', 'svg', 'pdf'];
const ALLOWED_ACCEPT = '.jpeg,.jpg,.png,.webp,.svg,.pdf,image/jpeg,image/png,image/webp,image/svg+xml,application/pdf';
const MM_PER_INCH = 25.4;
const ESTIMATED_SEC_PER_PHOTO = 0.5; // MediaPipe is extremely fast

function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
}

type FileProcessingStatus = 'pending' | 'processing' | 'done' | 'error';

interface FileStatus {
  filename: string;
  status: FileProcessingStatus;
  error?: string;
}

// interface PhotoMatch moved to @/types/validation.ts

/** Convert a single PDF page to an image File */
async function pdfPageToImage(pdfDoc: pdfjsLib.PDFDocumentProxy, pageNum: number, pdfName: string): Promise<File> {
  const page = await pdfDoc.getPage(pageNum);
  const scale = 3;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport, canvas } as unknown as Parameters<typeof page.render>[0]).promise;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const baseName = pdfName.replace(/\.pdf$/i, '');
      const fileName = `${baseName}_page${pageNum}.png`;
      resolve(new File([blob!], fileName, { type: 'image/png' }));
    }, 'image/png');
  });
}

/** Expand files: convert PDFs to image files, pass others through */
async function expandFiles(files: File[]): Promise<File[]> {
  const result: File[] = [];
  for (const file of files) {
    if (file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const imgFile = await pdfPageToImage(pdfDoc, i, file.name);
          result.push(imgFile);
        }
      } catch (err) {
        console.error(`Failed to parse PDF ${file.name}:`, err);
      }
    } else {
      result.push(file);
    }
  }
  return result;
}

export interface PhotoProcessorProps {
  students: any[];
  currentOrder: any;
  photoMatches: PhotoMatch[];
  setPhotoMatches: React.Dispatch<React.SetStateAction<PhotoMatch[]>>;
  onStatsUpdate?: (stats: { total: number; valid: number; errors: number; warnings: number }) => void;
  onPhotosProcessed?: (matches: PhotoMatch[]) => void;
  onComplete?: () => void;
  onProceedToStep2?: () => void;
  proceedButtonText?: string;
}

interface SliderWithValueProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  colorClass?: string;
  suffix?: string;
  labelIcon?: React.ReactNode;
}

const SliderWithValue = ({ label, value, min, max, onChange, colorClass, suffix = "%", labelIcon }: SliderWithValueProps) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    const num = parseInt(e.target.value);
    if (!isNaN(num)) {
      onChange(Math.max(min, Math.min(max, num)));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] uppercase font-bold">
        <div className="flex items-center gap-1">
          <span className={colorClass || "text-gray-400"}>{label}</span>
          {labelIcon}
        </div>
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            className="w-8 bg-transparent text-right outline-none text-[10px] font-bold text-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={min}
            max={max}
          />
          <span className="text-[10px] text-gray-400">{suffix}</span>
        </div>
      </div>
      <Slider 
        min={min} 
        max={max} 
        step={1} 
        value={[value]} 
        onValueChange={(val) => onChange(val[0])}
        className={cn("[&_[data-slot=slider-range]]:bg-primary", colorClass && `[&_[data-slot=slider-range]]:bg-current ${colorClass}`)}
      />
    </div>
  );
};

export default function PhotoProcessor({
  students,
  currentOrder,
  photoMatches,
  setPhotoMatches,
  onStatsUpdate,
  onPhotosProcessed,
  onComplete,
  onProceedToStep2,
  proceedButtonText,
}: PhotoProcessorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [estRemainingSeconds, setEstRemainingSeconds] = useState(0);
  const [activeEyedropperIndex, setActiveEyedropperIndex] = useState<number | null>(null);
  const [beforeAfterIndex, setBeforeAfterIndex] = useState<number | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });
  const cancelZipRef = useRef(false);

  useEffect(() => {
    console.log('PhotoProcessor - students array:', students);
    console.log('PhotoProcessor - students count:', students.length);
    const matched = photoMatches.filter(p => p.matched).length;
    onStatsUpdate?.({
      total: students.length,
      valid: matched,
      errors: photoMatches.length - matched,
      warnings: Math.max(0, students.length - matched)
    });
  }, [photoMatches, students, onStatsUpdate]);

  // Photo size state
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [customWidthMm, setCustomWidthMm] = useState(35);
  const [customHeightMm, setCustomHeightMm] = useState(45);
  const [useCustom, setUseCustom] = useState(false);
  const [unit, setUnit] = useState<"mm" | "inch">("mm");
  const [bgType, setBgType] = useState<"transparent" | "color">("color");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [colorSearchQuery, setColorSearchQuery] = useState('');

  const getPhotoSize = (): PhotoSize => {
    if (useCustom) {
      return {
        label: "Custom",
        widthMm: customWidthMm,
        heightMm: customHeightMm,
        widthInch: parseFloat((customWidthMm / MM_PER_INCH).toFixed(2)),
        heightInch: parseFloat((customHeightMm / MM_PER_INCH).toFixed(2)),
      };
    }
    return PHOTO_SIZE_PRESETS[selectedPresetIdx];
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const rawFiles = Array.from(selectedFiles);
    const invalidFiles = rawFiles.filter(f => !ALLOWED_EXTENSIONS.includes(f.name.split('.').pop()?.toLowerCase() || ''));
    
    if (invalidFiles.length > 0) {
      toast.error(`Unsupported file(s): ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    try {
      const filesArray = await expandFiles(rawFiles);
      setPendingFiles(prev => [...prev, ...filesArray]);
      // Note: matches and statuses will be updated when processing starts
      toast.success(`${filesArray.length} file(s) added to the queue.`);
    } catch {
      toast.error('Failed to read selected files.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const matchPhotoToStudent = (filename: string) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').toLowerCase();
    for (const student of students) {
      if (student.roll_number && nameWithoutExt.includes(student.roll_number.toLowerCase())) return student;
      if (student.student_id && nameWithoutExt.includes(student.student_id.toLowerCase())) return student;
      const nameParts = (student.student_name || '').toLowerCase().split(' ');
      for (const part of nameParts) {
        if (part.length > 2 && nameWithoutExt.includes(part)) return student;
      }
    }
    return null;
  };

  const handleProcessFiles = async () => {
    if (pendingFiles.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    // Don't clear photoMatches, append results instead in the loop
    setFileStatuses((prev: FileStatus[]) => [...prev.filter(s => s.status !== 'pending'), ...pendingFiles.map(f => ({ filename: f.name, status: 'pending' as FileProcessingStatus }))]);
    const totalProcessingCount = pendingFiles.length;
    setEstRemainingSeconds(totalProcessingCount * ESTIMATED_SEC_PER_PHOTO);

    // Deep Fix: MessageChannel doesn't get throttled to 1000ms in background tabs like setTimeout does!
    const yieldEventLoop = () => new Promise<void>(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(null);
    });

    try {
      const processor = new AIImageProcessor();
      await processor.initialize();
      const photoSize = getPhotoSize();
      const newMatches: PhotoMatch[] = [];
      const startTime = Date.now();

      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        setFileStatuses(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'processing' } : s));
        try {
          const resultBlob = await processor.processImage(file, photoSize, {
            backgroundColor: 'transparent' // Always get transparent subject for dynamic UI coloring
          });
          const match: PhotoMatch = {
            filename: file.name,
            originalFile: file,
            processedBlob: resultBlob,
            matched: false,
            brightness: 100,
            contrast: 100,
            enhance: 100,
            temperature: -25,
            originalUrl: URL.createObjectURL(file), // Cache original
            processedUrl: URL.createObjectURL(resultBlob) // Cache processed
          };
          const matchResult = matchPhotoToStudent(file.name);
          if (matchResult) {
            match.matched = true;
            match.studentId = String(matchResult.id);
            match.studentName = String(matchResult.student_name);
          }
          newMatches.push(match);
          setFileStatuses(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s));
        } catch (err) {
          setFileStatuses(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error', error: String(err) } : s));
        }
        setProgress(((i + 1) / totalProcessingCount) * 100);
        
        // Deep Dynamic ETA Fix based on actual elapsed time
        const elapsedMs = Date.now() - startTime;
        const avgMsPerPhoto = elapsedMs / (i + 1);
        const remainingPhotos = totalProcessingCount - (i + 1);
        setEstRemainingSeconds(Math.max(1, Math.round((avgMsPerPhoto * remainingPhotos) / 1000)));

        // Deep Fix: Yield the event loop safely even in background tabs
        await yieldEventLoop();
      }
      setPhotoMatches(prev => [...prev, ...newMatches]);
      onPhotosProcessed?.(newMatches);
      setPendingFiles([]);
      toast.success(`Processed ${newMatches.length} photos!`);
    } catch (error) {
      toast.error('AI processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualMatch = (photoIndex: number, studentId: string) => {
    const updated = [...photoMatches];
    const student = students.find(s => s.id === studentId);
    if (student) {
      updated[photoIndex].matched = true;
      updated[photoIndex].studentId = String(student.id);
      updated[photoIndex].studentName = String(student.student_name);
    }
    setPhotoMatches(updated);
    onPhotosProcessed?.(updated);
  };

  const handleUpload = async () => {
    if (!currentOrder || photoMatches.length === 0) return;
    const matchedPhotos = photoMatches.filter(p => p.matched);
    if (matchedPhotos.length === 0) { toast.error('Match some photos first'); return; }

    setIsUploading(true);
    try {
      const results = await Promise.all(matchedPhotos.map(async (m) => {
        // Bake the current background color choice into the blob before uploading
        const finalBlob = await drawImageToCanvasBlob(m);
        const extension = bgType === 'transparent' ? 'png' : 'jpg';
        const mimeType = bgType === 'transparent' ? 'image/png' : 'image/jpeg';
        const file = new File([finalBlob], `${m.filename.replace(/\.[^/.]+$/, "")}.${extension}`, { type: mimeType });
        const res = await uploadService.uploadPhoto(file);
        return { studentId: m.studentId, photoUrl: res.url };
      }));
      await Promise.all(results.map(r => r && studentService.update(r.studentId!, { photo_url: r.photoUrl } as any)));
      toast.success('Uploaded to database!');
      onComplete?.();
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const drawImageToCanvasBlob = async (p: PhotoMatch): Promise<Blob> => {
    return new Promise(async (resolve) => {
      try {
        let img: HTMLImageElement | ImageBitmap;
        
        // Use hyper-fast createImageBitmap if available (Chrome) to avoid DOM main-thread decoding
        if (typeof createImageBitmap !== 'undefined') {
           img = await createImageBitmap(p.processedBlob);
        } else {
           img = await new Promise<HTMLImageElement>((res, rej) => {
               const i = new Image();
               i.onload = () => res(i);
               i.onerror = rej;
               i.src = URL.createObjectURL(p.processedBlob);
           });
        }

        const useOffscreen = typeof OffscreenCanvas !== 'undefined';
        const canvas = useOffscreen 
          ? new OffscreenCanvas(img.width, img.height) 
          : document.createElement("canvas");
        
        if (!useOffscreen) {
          (canvas as HTMLCanvasElement).width = img.width;
          (canvas as HTMLCanvasElement).height = img.height;
        }

        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
        if (ctx) {
          // If not transparent, fill with the background color
          if (bgType !== 'transparent') {
            const fill = resolveColorForCanvas(bgColor, '#FFFFFF');
            ctx.fillStyle = fill;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          
          // Draw the processed image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Apply ALL manual adjustments via pixel manipulation (ctx.filter is unreliable across browsers)
          const brightness = (p.brightness || 100) / 100;
          const contrast = (p.contrast || 100) / 100;
          const saturation = (p.enhance || 100) / 100;
          const temperature = p.temperature || 0;

          const needsAdjustment = brightness !== 1 || contrast !== 1 || saturation !== 1 || temperature !== 0;

          if (needsAdjustment) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
              let r = data[i];
              let g = data[i + 1];
              let b = data[i + 2];

              // 1. Apply Brightness
              r = r * brightness;
              g = g * brightness;
              b = b * brightness;

              // 2. Apply Contrast (around midpoint 128)
              r = ((r - 128) * contrast) + 128;
              g = ((g - 128) * contrast) + 128;
              b = ((b - 128) * contrast) + 128;

              // 3. Apply Saturation
              if (saturation !== 1) {
                const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                r = gray + saturation * (r - gray);
                g = gray + saturation * (g - gray);
                b = gray + saturation * (b - gray);
              }

              // 4. Apply Temperature (warm/cool shift)
              if (temperature !== 0) {
                const factor = temperature / 100;
                r = r * (1 + factor * 0.2);
                b = b * (1 - factor * 0.2);
              }

              // Clamp to 0-255
              data[i]     = Math.max(0, Math.min(255, Math.round(r)));
              data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
              data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
            }
            ctx.putImageData(imageData, 0, 0);
          }

          const format = bgType === 'transparent' ? "image/png" : "image/jpeg";
          if (useOffscreen) {
            (canvas as OffscreenCanvas).convertToBlob({ type: format, quality: 0.95 }).then(blob => resolve(blob));
          } else {
            (canvas as HTMLCanvasElement).toBlob((b) => resolve(b!), format, 0.95);
          }
        } else {
          resolve(p.processedBlob);
        }
      } catch (e) {
        resolve(p.processedBlob);
      }
    });
  };

  const handleManualWhiteBalance = (index: number, e: React.MouseEvent<HTMLImageElement>) => {
    if (activeEyedropperIndex !== index) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x_pct = (e.clientX - rect.left) / rect.width;
    const y_pct = (e.clientY - rect.top) / rect.height;
    
    // Create a temporary canvas to sample the color from the blob
    const img = e.currentTarget;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    
    const sampleX = Math.floor(x_pct * canvas.width);
    const sampleY = Math.floor(y_pct * canvas.height);
    const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
    
    // Neutralize yellow: if blue is lower than average of red/green, increase temperature (blue side)
    const avgRG = (pixel[0] + pixel[1]) / 2;
    const diff = avgRG - pixel[2];
    
    // We want pixel[2] + offset = avgRG
    // Offset should be applied to temperature slider
    const updated = [...photoMatches];
    updated[index].temperature = Math.max(-100, Math.min(100, (updated[index].temperature || 0) - (diff * 0.8)));
    setPhotoMatches(updated);
    setActiveEyedropperIndex(null);
    toast.success("White balance synchronized to sample point");
  };

  const handleDownloadZip = async () => {
    if (photoMatches.length === 0) return;
    setIsZipping(true);
    setZipProgress({ current: 0, total: photoMatches.length });
    cancelZipRef.current = false;

    // Deep Fix: MessageChannel avoids the brutal 1-second timeout throttle in background tabs
    const yieldEventLoop = () => new Promise<void>(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(null);
    });

    try {
      const extension = bgType === 'transparent' ? 'png' : 'jpg';
      const zip = new JSZip();

      for (let i = 0; i < photoMatches.length; i++) {
        if (cancelZipRef.current) {
          setIsZipping(false);
          toast.info("ZIP generation cancelled.");
          return;
        }

        const p = photoMatches[i];
        // Bake the manual color modifications
        const finalBlob = await drawImageToCanvasBlob(p);
        zip.file(`${p.filename.replace(/\.[^/.]+$/, "")}.${extension}`, finalBlob);
        
        setZipProgress({ current: i + 1, total: photoMatches.length });

        // Yield the event loop every 20 images to prevent the browser from freezing and allow GC
        if (i > 0 && i % 20 === 0) {
            await yieldEventLoop();
        }
      }
      
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "STORE" // Deep fix: Images are already compressed. Deflate wastes 3x memory.
      });
      
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `processed_photos.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("ZIP downloaded successfully!");
    } catch (e) {
      toast.error("Failed to package zip file. " + String(e));
    } finally {
      setIsZipping(false);
    }
  };

  const handleClearPhotos = () => {
    // Revoke all cached URLs to avoid memory leaks
    photoMatches.forEach(p => {
      if (p.originalUrl) URL.revokeObjectURL(p.originalUrl);
      if (p.processedUrl) URL.revokeObjectURL(p.processedUrl);
    });
    setPhotoMatches([]);
    setPendingFiles([]);
    setFileStatuses([]);
    setProgress(0);
    toast.success('Successfully cleared all session photos.');
  };

  const handleUpscale = async (index: number) => {
    if (isUpscaling) return;
    
    setIsUpscaling(true);
    try {
      const photo = photoMatches[index];
      
      // Convert blob to image element
      const img = new Image();
      const imageUrl = URL.createObjectURL(photo.processedBlob);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Canvas-based upscaling (2x resolution with bicubic interpolation)
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      
      // Use high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const upscaledBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else resolve(photo.processedBlob);
        }, 'image/png', 0.95);
      });

      // Update the photo with upscaled version
      const updated = [...photoMatches];
      // Revoke old processed URL before creating new one
      if (updated[index].processedUrl) URL.revokeObjectURL(updated[index].processedUrl!);
      
      updated[index].processedBlob = upscaledBlob;
      updated[index].processedUrl = URL.createObjectURL(upscaledBlob);
      setPhotoMatches(updated);
      
      URL.revokeObjectURL(imageUrl);
      toast.success('Image upscaled successfully!');
    } catch (error) {
      console.error('Upscaling error:', error);
      toast.error('Upscaling failed. Please try again.');
    } finally {
      setIsUpscaling(false);
    }
  };
  
  const handleSliderChange = (index: number, key: keyof PhotoMatch, val: number) => {
    const updated = [...photoMatches];
    // @ts-ignore - dynamic assignment
    updated[index][key] = val;
    setPhotoMatches(updated);
  };

  const displayW = (s: PhotoSize) => unit === "mm" ? `${s.widthMm}mm` : `${s.widthInch}"`;
  const displayH = (s: PhotoSize) => unit === "mm" ? `${s.heightMm}mm` : `${s.heightInch}"`;

  return (
    <div className="space-y-6 relative">
      {/* ZIP Generation Overlay Modal */}
      {isZipping && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="relative w-32 h-32 mb-6">
               <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                 <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                 <circle 
                   cx="50" cy="50" r="45" fill="none" stroke="#2563EB" strokeWidth="8" 
                   strokeDasharray="283" 
                   strokeDashoffset={283 - (283 * (zipProgress.current / Math.max(1, zipProgress.total)))}
                   className="transition-all duration-300 ease-out"
                   strokeLinecap="round"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-600">
                 <span className="text-3xl font-black">{Math.round((zipProgress.current / Math.max(1, zipProgress.total)) * 100)}%</span>
               </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Packaging ZIP File...</h3>
            <p className="text-sm text-gray-500 mb-8 text-center leading-relaxed">Processing and optimizing {zipProgress.current} of {zipProgress.total} images.</p>
            <Button 
              variant="outline" 
              className="w-full rounded-xl text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-bold h-12"
              onClick={() => { cancelZipRef.current = true; }}
            >
              Cancel Processing
            </Button>
          </div>
        </div>
      )}

      <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg flex items-center gap-2 font-bold text-[#2A4B8C] mb-1">
                <Sparkles className="w-5 h-5 text-blue-500" />
                AI Photo Optimizer
              </h2>
              <p className="text-[13px] text-gray-500 font-medium">Auto background removal and lighting correction.</p>
            </div>
            <div className="flex items-center gap-3">
              {onProceedToStep2 && (
                <Button 
                  onClick={onProceedToStep2} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  {proceedButtonText || "Proceed to Step 2"}
                  <ArrowRight size={14} />
                </Button>
              )}
              {(pendingFiles.length > 0 || photoMatches.length > 0) && (
                <Button variant="ghost" size="sm" onClick={handleClearPhotos} className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <XCircle size={14} className="mr-2" /> Clear All 
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="border border-gray-100 rounded-2xl p-6 bg-white space-y-6">
            {/* 1. Crop Size & AI Dimensions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-[11px] font-black text-slate-800 uppercase tracking-wide">1. Crop Size & AI Dimensions</Label>
                <div className="flex bg-white border border-gray-200 rounded-full p-0.5 shadow-sm">
                   <button 
                     onClick={() => setUnit("mm")} 
                     className={cn("px-3 py-1 text-[9px] font-black rounded-full transition-all", unit === "mm" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-600")}
                   >
                     MM
                   </button>
                   <button 
                     onClick={() => setUnit("inch")} 
                     className={cn("px-3 py-1 text-[9px] font-black rounded-full transition-all", unit === "inch" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-600")}
                   >
                     INCH
                   </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PHOTO_SIZE_PRESETS.map((p, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setSelectedPresetIdx(i); setUseCustom(false); }} 
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border transition-all h-20",
                      !useCustom && selectedPresetIdx === i 
                        ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" 
                        : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                    )}
                  >
                    <div className="font-bold text-[11px] text-gray-900">{p.label}</div>
                    <div className="text-[10px] text-gray-400 font-medium mt-1">{displayW(p)} x {displayH(p)}</div>
                  </button>
                ))}
                <button 
                  onClick={() => setUseCustom(true)} 
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all h-20",
                    useCustom 
                      ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" 
                      : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                  )}
                >
                  <div className="font-bold text-[11px] text-gray-900">Custom</div>
                  <div className="text-[10px] text-gray-400 font-medium mt-1">Manual Size</div>
                </button>
              </div>

              {useCustom && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-dashed border-gray-200 grid grid-cols-2 gap-4"
                >
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase">Width ({unit})</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={unit === 'mm' ? customWidthMm : parseFloat((customWidthMm / MM_PER_INCH).toFixed(2))}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (unit === 'mm') setCustomWidthMm(val);
                          else setCustomWidthMm(val * MM_PER_INCH);
                        }}
                        className="h-9 rounded-xl text-xs font-bold pl-3 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">{unit}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase">Height ({unit})</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={unit === 'mm' ? customHeightMm : parseFloat((customHeightMm / MM_PER_INCH).toFixed(2))}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (unit === 'mm') setCustomHeightMm(val);
                          else setCustomHeightMm(val * MM_PER_INCH);
                        }}
                        className="h-9 rounded-xl text-xs font-bold pl-3 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none">{unit}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Background Engine */}
            <div>
              <Label className="text-[11px] font-black text-slate-800 uppercase tracking-wide mb-4 block">2. Background Engine</Label>
              <div className="flex flex-wrap gap-3">
                {/* Transparency Toggle */}
                <button 
                  onClick={() => setBgType('transparent')}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl border transition-all w-[72px] h-[72px]",
                    bgType === 'transparent' ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                  )}
                >
                  <div className="w-6 h-6 rounded-md border border-gray-200 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-[length:10px_10px]" />
                  <span className="font-bold text-[10px] mt-2 text-gray-700">Transparent</span>
                </button>

                {/* Quick Color Presets */}
                {[
                  { name: 'White', color: '#FFFFFF' },
                  { name: 'Sky', color: '#87CEEB' },
                  { name: 'Navy', color: '#000080' },
                  { name: 'Red', color: '#FF0000' },
                ].map((preset) => (
                  <button 
                    key={preset.color}
                    onClick={() => { setBgType('color'); setBgColor(preset.color); }}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border transition-all w-[72px] h-[72px]",
                      bgType === 'color' && resolveColorForCanvas(bgColor, '').toUpperCase() === preset.color 
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" 
                        : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                    )}
                  >
                    <div className="w-6 h-6 rounded-md border border-gray-200 shadow-sm" style={{ backgroundColor: preset.color }} />
                    <span className="font-bold text-[10px] mt-2 text-gray-700">{preset.name}</span>
                  </button>
                ))}

                {/* Preset Colors Dropdown */}
                {(() => {
                  const query = colorSearchQuery.toLowerCase();
                  
                  // Filter categories based on search
                  const filteredPresets = MASSIVE_COLOR_PRESETS.map(group => {
                    const filteredColors = group.colors.filter(c => 
                      c.name.toLowerCase().includes(query) || 
                      c.hex.toLowerCase().includes(query)
                    );
                    return { ...group, colors: filteredColors };
                  }).filter(group => group.colors.length > 0);

                  const displayPresets = query ? filteredPresets : MASSIVE_COLOR_PRESETS.slice(0, 15);

                  return (
                    <div className="relative">
                      <button 
                        onClick={() => setBgType(bgType === 'transparent' ? 'color' : bgType)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-xl border transition-all w-[72px] h-[72px] group",
                          "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 shadow-sm"
                        )}
                        onClickCapture={(e) => {
                          e.stopPropagation();
                          const dropdown = e.currentTarget.parentElement?.querySelector('[data-preset-dropdown]') as HTMLElement;
                          if (dropdown) {
                            dropdown.classList.toggle('hidden');
                          }
                        }}
                      >
                        <div className="w-6 h-6 rounded-md border border-gray-200 shadow-sm bg-gradient-to-br from-red-400 via-blue-400 to-green-400" />
                        <span className="font-bold text-[10px] mt-2 text-gray-600 group-hover:text-blue-600">Presets ▾</span>
                      </button>

                      {/* Dropdown Panel */}
                      <div 
                        data-preset-dropdown
                        className="hidden absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-[420px] max-h-[500px] overflow-y-auto custom-scrollbar"
                        style={{ animation: 'fadeIn 0.15s ease-out' }}
                      >
                        <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">3000+ Preset Colors</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const dropdown = e.currentTarget.closest('[data-preset-dropdown]') as HTMLElement;
                                if (dropdown) dropdown.classList.add('hidden');
                              }}
                              className="text-gray-400 hover:text-gray-600 text-[16px] leading-none px-1"
                            >✕</button>
                          </div>
                          
                          {/* Search Input */}
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search colors (e.g., 'Blue', 'Red', '#FF...')"
                              value={colorSearchQuery}
                              onChange={(e) => setColorSearchQuery(e.target.value)}
                              className="w-full text-xs py-1.5 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                            />
                            {colorSearchQuery && (
                              <button
                                onClick={() => setColorSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                              >✕</button>
                            )}
                          </div>
                        </div>

                        {displayPresets.length === 0 ? (
                           <div className="text-center text-gray-400 text-xs py-4">No colors found.</div>
                        ) : (
                          displayPresets.map((group) => (
                            <div key={group.category} className="mb-4">
                              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">{group.category} <span className="text-gray-300 ml-1">({group.colors.length})</span></div>
                              <div className="grid grid-cols-5 gap-1.5">
                                {/* Only render the first 100 colors per category if not searching to prevent lag */}
                                {group.colors.slice(0, query ? group.colors.length : 100).map((c) => (
                                  <button
                                    key={c.hex + c.name}
                                    title={c.name}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBgType('color');
                                      setBgColor(c.hex);
                                      // Close dropdown
                                      const dropdown = e.currentTarget.closest('[data-preset-dropdown]') as HTMLElement;
                                      if (dropdown) dropdown.classList.add('hidden');
                                    }}
                                    className={cn(
                                      "flex flex-col items-center gap-1 p-1 rounded-lg border transition-all text-left hover:shadow-md hover:scale-[1.05]",
                                      bgType === 'color' && resolveColorForCanvas(bgColor, '').toUpperCase() === c.hex.toUpperCase()
                                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                        : "border-gray-100 hover:border-gray-300 bg-white"
                                    )}
                                  >
                                    <div 
                                      className="w-full h-6 rounded-md border border-gray-200 shrink-0" 
                                      style={{ backgroundColor: c.hex }} 
                                    />
                                    <div className="w-full text-center">
                                      <div className="text-[8px] text-gray-400 font-mono truncate">{c.hex}</div>
                                    </div>
                                  </button>
                                ))}
                                {!query && group.colors.length > 100 && (
                                   <div className="flex items-center justify-center text-[9px] text-gray-400 italic">
                                     +{group.colors.length - 100} more
                                   </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Universal Custom Color Picker */}
                {(() => {
                  const quickPresets = ['#FFFFFF', '#87CEEB', '#000080', '#FF0000'];
                  const resolvedBg = resolveColorForCanvas(bgColor, '').toUpperCase();
                  const isCustomActive = bgType === 'color' && !quickPresets.includes(resolvedBg);
                  const parsed = parseColorCode(bgColor);
                  const previewHex = parsed.valid ? toHexColor(bgColor) : '#FFFFFF';
                  const formatLabel = parsed.valid ? getColorFormatLabel(bgColor) : null;
                  return (
                    <div 
                      onClick={() => setBgType('color')}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl border transition-all h-[72px] min-w-[130px] cursor-pointer",
                        isCustomActive ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                      )}
                    >
                      <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="relative w-6 h-6 rounded-md shadow-sm border border-gray-200 overflow-hidden">
                           <input 
                             type="color" 
                             value={previewHex} 
                             onChange={(e) => { 
                               setBgType('color'); 
                               setBgColor(e.target.value.toUpperCase()); 
                             }}
                             className="absolute -inset-4 w-16 h-16 cursor-pointer bg-transparent border-none p-0 outline-none"
                           />
                        </div>
                        <input 
                          type="text" 
                          value={bgColor} 
                          onChange={(e) => { 
                            setBgType('color'); 
                            setBgColor(e.target.value); 
                          }}
                          placeholder="any color..."
                          className="w-[70px] text-[9px] font-mono border border-gray-200 rounded px-1.5 py-1 outline-none text-center"
                        />
                      </div>
                      
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <span className={cn(
                          "font-bold text-[10px] transition-colors",
                          isCustomActive ? "text-blue-600" : "text-gray-700"
                        )}>Custom</span>
                        {formatLabel && (
                          <span className="bg-gray-100 text-gray-500 text-[8px] font-bold px-1 rounded">{formatLabel}</span>
                        )}
                        {bgColor && !parsed.valid && (
                          <span className="bg-red-100 text-red-500 text-[8px] font-bold px-1 rounded">Invalid</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-blue-200 rounded-[20px] p-12 bg-gradient-to-b from-blue-50/50 to-transparent text-center relative group hover:bg-blue-50/80 transition-colors cursor-pointer">
            <div className="absolute inset-0 rounded-[20px] shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] pointer-events-none" />
            <Upload className="w-10 h-10 text-blue-500 mx-auto mb-4 group-hover:scale-110 group-hover:-translate-y-1 transition-transform" strokeWidth={2.5} />
            <p className="font-bold text-blue-900 text-[15px]">Select or Drag Student Photos</p>
            <p className="text-xs text-blue-600/70 mt-1.5 font-medium">Supports JPG, PNG, WebP & PDF (Auto-extract pages)</p>
            <input type="file" multiple accept={ALLOWED_ACCEPT} onChange={handleFileSelect} ref={fileInputRef} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>

          {pendingFiles.length > 0 && !isProcessing && (
             <Button onClick={handleProcessFiles} className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg rounded-xl shadow-lg ring-offset-2 hover:ring-2 ring-blue-500 transition-all">
                <div className="flex flex-col items-center">
                   <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> Start AI Batch Processing ({pendingFiles.length} photos)
                   </div>
                   <div className="text-[10px] opacity-70 font-normal mt-1 flex items-center gap-1">
                      <Clock size={10} /> Estimated processing time: {formatEstimatedTime(pendingFiles.length * ESTIMATED_SEC_PER_PHOTO)}
                   </div>
                </div>
             </Button>
          )}

          {(isProcessing || fileStatuses.length > 0) && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100">
               <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-blue-600">
                   <div className="flex items-center gap-2">
                      <span>{isProcessing ? 'Processing...' : 'Complete'}</span>
                      {isProcessing && estRemainingSeconds > 0 && (
                        <span className="text-gray-400 font-normal lowercase tracking-normal flex items-center gap-1">
                           <Clock size={10} /> ~{formatEstimatedTime(estRemainingSeconds)} remaining
                        </span>
                      )}
                   </div>
                   <span>{progress.toFixed(0)}%</span>
               </div>
               <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all" style={{ width: `${progress}%` }} />
               </div>
               <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {fileStatuses.map((fs, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${fs.status === 'done' ? 'bg-green-50 text-green-700' : fs.status === 'processing' ? 'bg-blue-50 animate-pulse' : 'bg-gray-50'}`}>
                       {fs.status === 'done' ? <CheckCircle size={12}/> : fs.status === 'processing' ? <Loader2 size={12} className="animate-spin"/> : <Clock size={12}/>}
                       <span className="truncate flex-1">{fs.filename}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>

      {photoMatches.length > 0 && (
        <Card className="border-gray-200">
           <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-base uppercase tracking-widest text-gray-500">Processed Results</CardTitle>
                <div className="text-sm font-bold text-gray-900 mt-1">{photoMatches.length} Processed</div>
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={handleDownloadZip} className="rounded-lg"><Download size={14} className="mr-2"/> ZIP</Button>
              </div>
           </CardHeader>
           <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {photoMatches.map((p, i) => {
                  const originalUrl = p.originalUrl || URL.createObjectURL(p.originalFile);
                  const processedUrl = p.processedUrl || URL.createObjectURL(p.processedBlob);
                  return (
                    <div key={i} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                       <div className="aspect-[4/3] relative">
                          {beforeAfterIndex === i ? (
                            <BeforeAfterSlider
                              beforeImage={originalUrl}
                              afterImage={processedUrl}
                              beforeLabel="Raw"
                              afterLabel="AI"
                              className="w-full h-full"
                            />
                          ) : (
                            <div className="flex gap-px bg-gray-100 h-full">
                              <div className="flex-1 bg-white relative">
                                <span className="absolute top-1 left-1 bg-black/40 text-[8px] text-white px-1 rounded uppercase font-bold z-10">Raw</span>
                                <img src={originalUrl} className="w-full h-full object-cover" />
                              </div>
                              <div 
                                className={cn(
                                  "flex-1 relative ring-2 ring-blue-500/50 z-20 overflow-hidden transition-all duration-300",
                                  bgType === 'transparent' ? "bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-[length:10px_10px] bg-white" : ""
                                )}
                                style={{ backgroundColor: bgType === 'color' ? resolveColorForCanvas(bgColor, '#FFFFFF') : undefined }}
                              >
                                <span className="absolute top-1 left-1 bg-blue-600 text-[8px] text-white px-1 rounded uppercase font-bold z-10">AI</span>
                                <img 
                                  src={processedUrl} 
                                  className={`w-full h-full object-cover transition-all ${activeEyedropperIndex === i ? 'cursor-crosshair ring-4 ring-amber-400 ring-inset z-30' : 'cursor-default'}`} 
                                  onClick={(e) => handleManualWhiteBalance(i, e)}
                                  style={{ 
                                    filter: `brightness(${p.brightness || 100}%) contrast(${p.contrast || 100}%) saturate(${p.enhance || 100}%)`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                       </div>

                       {/* Manual Colour Constraints */}
                       <div className="px-4 pt-4 pb-2 bg-white border-t space-y-5">
                           <SliderWithValue 
                             label="Brightness"
                             value={p.brightness || 100}
                             min={0}
                             max={200}
                             onChange={(val) => handleSliderChange(i, 'brightness', val)}
                           />

                           <SliderWithValue 
                             label="Contrast"
                             value={p.contrast || 100}
                             min={0}
                             max={200}
                             onChange={(val) => handleSliderChange(i, 'contrast', val)}
                           />

                           <SliderWithValue 
                             label="Saturation"
                             value={p.enhance || 100}
                             min={0}
                             max={200}
                             onChange={(val) => handleSliderChange(i, 'enhance', val)}
                             colorClass="text-blue-600"
                           />

                           <SliderWithValue 
                             label="Temp"
                             value={p.temperature || 0}
                             min={-100}
                             max={100}
                             onChange={(val) => handleSliderChange(i, 'temperature', val)}
                             colorClass="text-amber-600"
                             suffix=""
                             labelIcon={
                               <button 
                                 onClick={(e) => { 
                                   e.stopPropagation(); 
                                   if (activeEyedropperIndex === i) setActiveEyedropperIndex(null);
                                   else {
                                     setActiveEyedropperIndex(i);
                                     toast.info("Click the yellow spot on the photo to neutralize balance");
                                   }
                                 }} 
                                 className={`p-0.5 rounded transition-colors ${activeEyedropperIndex === i ? 'bg-amber-500 text-white shadow-sm' : 'hover:bg-amber-50 text-amber-500'}`}
                               >
                                  <Pipette size={10} />
                               </button>
                             }
                           />
                       </div>
                       
                       <div className="p-3 bg-gray-50 border-t">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-mono text-gray-400 truncate w-24" title={p.filename}>{p.filename}</span>
                             <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleUpscale(i)}
                                  disabled={isUpscaling}
                                  className="text-[9px] h-6 px-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                >
                                  {isUpscaling ? <Loader2 size={10} className="animate-spin mr-1"/> : <Zap size={10} className="mr-1"/>}
                                  Upscale
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setBeforeAfterIndex(beforeAfterIndex === i ? null : i)}
                                  className={`text-[9px] h-6 px-2 ${beforeAfterIndex === i ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'} hover:bg-blue-100`}
                                >
                                  <ArrowLeftRight size={10} className="mr-1"/>
                                  Compare
                                </Button>
                             </div>
                          </div>
                       </div>
                    </div>
                  );
                })}
              </div>
           </CardContent>
        </Card>
      )}
      <div className="hidden">
        <svg>
          <defs>
            {photoMatches.map((p, i) => {
              const factor = (p.temperature || 0) / 100;
              const rRed = factor > 0 ? 1 + factor * 0.2 : 1 + factor * 0.2;
              const bBlue = factor < 0 ? 1 + Math.abs(factor) * 0.2 : 1 - factor * 0.2;
              
              return (
                <filter key={i} id={`temp-filter-${i}`}>
                  <feColorMatrix 
                    type="matrix" 
                    values={`${rRed} 0 0 0 0 0 1 0 0 0 0 0 ${bBlue} 0 0 0 0 0 1 0`}
                  />
                </filter>
              );
            })}
          </defs>
        </svg>
      </div>
    </div>
  );
}
