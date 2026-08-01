import React, { useState, useRef } from 'react';
import { UploadCloud, FileCheck, ArrowRight, LayoutTemplate, Database, Image as ImageIcon, CheckCircle, Plus, X, GitBranch, AlertCircle, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { useConfiguratorStore } from '../../../store/useConfiguratorStore';
import { formatIfDate } from '../../../utils/dateUtils';
import WMF from 'wmf';

// Initialize PDF.js worker
if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions && pdfjsLib.version) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} else if (typeof window !== 'undefined' && (window as Record<string, unknown>).pdfjsLib) {
  ((window as Record<string, unknown>).pdfjsLib as typeof pdfjsLib).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${((window as Record<string, unknown>).pdfjsLib as typeof pdfjsLib).version}/pdf.worker.min.mjs`;
}
import { uploadService, projectService } from '../../../services/dataService';
import { hydrateBatchImageStore, getBatchImageKeys, batchImageStore, loadBatchPhotosFromDB, clearBatchImageStore } from '../../../utils/batchImageStore';

async function convertPdfToImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdfDoc.getPage(1);
  const viewport = page.getViewport({ scale: 3 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport, canvas } as unknown as import('pdfjs-dist').RenderParameters).promise;
  return canvas.toDataURL('image/png', 0.9);
}

async function convertWmfToImage(file: File): Promise<string> {
  try {
    // Defensively handle CommonJS default exports in Vite production build
    const wmfLib = (WMF as any).default || WMF;
    const arrayBuffer = await file.arrayBuffer();
    let data = new Uint8Array(arrayBuffer);
    
    // Check for Aldus Placeable Metafile (APM) header
    // The magic number is 0x9AC6CDD7 (little endian: 0xD7 0xCD 0xC6 0x9A)
    let aldusWidth = 0;
    let aldusHeight = 0;
    if (data.length > 22 && data[0] === 0xD7 && data[1] === 0xCD && data[2] === 0xC6 && data[3] === 0x9A) {
      console.log('Detected Aldus Placeable Metafile header. Stripping first 22 bytes.');
      const view = new DataView(arrayBuffer);
      const left = view.getInt16(6, true);
      const top = view.getInt16(8, true);
      const right = view.getInt16(10, true);
      const bottom = view.getInt16(12, true);
      const inch = view.getUint16(14, true);
      
      aldusWidth = Math.abs(right - left);
      aldusHeight = Math.abs(bottom - top);
      if (inch > 0) {
        aldusWidth = Math.round((aldusWidth / inch) * 300); // 300 DPI scaling
        aldusHeight = Math.round((aldusHeight / inch) * 300);
      }
      
      // Remove the 22-byte header so the library gets a standard WMF
      data = data.slice(22);
    }

    let size = wmfLib.image_size(data);
    if (!size || isNaN(size[0]) || isNaN(size[1]) || size[0] <= 0) {
       size = [aldusWidth > 0 ? aldusWidth : 1000, aldusHeight > 0 ? aldusHeight : 600];
    }

    const canvas = document.createElement('canvas');
    canvas.width = size[0];
    canvas.height = size[1];
    wmfLib.draw_canvas(data, canvas);
    return canvas.toDataURL('image/png', 1.0);
  } catch (e: any) {
    // The wmf library throws raw strings for errors
    const errorMsg = typeof e === 'string' ? e : (e?.message || 'Unknown parsing error');
    throw new Error('WMF parsing failed: ' + errorMsg);
  }
}

export default function SetupMode() {
  const design = useConfiguratorStore((state) => state.design);
  const setField = useConfiguratorStore((state) => state.setField);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const activeSide = design.idCard.activeSide;
  const { datasetColumns = [], datasetRecords = [], imageMatchColumn, matchedImageCount = 0, datasetImages = {} } = design.idCard.bulkWorkflow || {};
  const datasetReady = datasetRecords?.length > 0;
  
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [photoCount, setPhotoCount] = useState(Object.keys(datasetImages).length || Object.keys(batchImageStore).length);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // On mount: load batch photos from IndexedDB for the current project
  React.useEffect(() => {
    if (design.idCard.selected) {
      loadBatchPhotosFromDB(design.idCard.selected).then(() => {
        setPhotoCount(getBatchImageKeys().length);
      });
    }
  }, [design.idCard.selected]);

  const handleBatchPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    console.log('[BatchPhotos] onChange fired, files:', selectedFiles?.length);
    if (!selectedFiles || selectedFiles.length === 0) {
      console.log('[BatchPhotos] No files selected');
      return;
    }
    
    setIsProcessingPhotos(true);
    
    // Helper: convert a Blob/File to a data URL (base64 embedded)
    // Data URLs survive page reloads, HMR, serialization — unlike blob URLs
    const blobToDataUrl = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const firstFile = selectedFiles[0];
    const isZip = firstFile.name.toLowerCase().endsWith('.zip') || 
                  firstFile.type === 'application/zip' || 
                  firstFile.type === 'application/x-zip-compressed';
    console.log('[BatchPhotos] File:', firstFile.name, 'type:', firstFile.type, 'size:', firstFile.size, 'isZip:', isZip);

    try {
      if (isZip) {
        if (!design.idCard.selected) {
           alert('Please select or create a project first before uploading a ZIP.');
           setIsProcessingPhotos(false);
           return;
        }
        console.log('[BatchPhotos] Uploading ZIP to server...');
        const res = await uploadService.uploadZip(firstFile, design.idCard.selected);
        console.log('[BatchPhotos] ZIP uploaded and extracted:', res);
        
        // Fetch the list of extracted photos from the server
        const photosRes = await projectService.getPhotos(design.idCard.selected);
        if (photosRes.success && photosRes.photos) {
            photosRes.photos.forEach((p: {name: string, url: string}) => {
                const basename = p.name;
                const extIdx = basename.lastIndexOf('.');
                const key = (extIdx > 0 ? basename.substring(0, extIdx) : basename).trim();
                if (key) {
                    batchImageStore[key] = p.url;
                    console.log('[BatchPhotos] Cloud image:', basename, '->', key);
                }
            });
        }
      } else {
        // Individual image files
        for (const file of Array.from(selectedFiles)) {
          if (/\.(jpe?g|png|webp|svg)$/i.test(file.name)) {
            const extIdx = file.name.lastIndexOf('.');
            const key = (extIdx > 0 ? file.name.substring(0, extIdx) : file.name).trim();
            if (key) {
              const dataUrl = await blobToDataUrl(file);
              batchImageStore[key] = dataUrl;
              console.log('[BatchPhotos] Image:', file.name, '->', key, '(', Math.round(dataUrl.length / 1024), 'KB)');
            }
          }
        }
      }
    } catch (err) {
      console.error('[BatchPhotos] Error processing files:', err);
      alert('Error processing files. Please try again.');
    }

    // Count matches
    const allKeys = Object.keys(batchImageStore);
    const lowerKeys = new Set(allKeys.map(k => k.toLowerCase()));
    
    // Create a map of pure numbers to actual keys for robust matching
    // Make sure we only map meaningful numbers (e.g. at least 1 digit)
    const numericKeysMap = new Map<string, string>();
    for (const k of allKeys) {
      const numMatch = k.replace(/\D/g, '');
      if (numMatch.length > 0) {
        numericKeysMap.set(numMatch, k);
      }
    }
    
    let matched = 0;
    if (imageMatchColumn && datasetRecords) {
      for (const rec of datasetRecords) {
        const rawVal = rec[imageMatchColumn]?.toString()?.trim();
        if (rawVal) {
          // If Excel has "183411.JPG", we strip the extension to "183411"
          const extIdx = rawVal.lastIndexOf('.');
          const baseVal = extIdx > 0 ? rawVal.substring(0, extIdx).trim() : rawVal;
          // Extract just the numbers from Excel val (e.g. "file photo no:183411.JPG" -> "183411")
          const numOnlyVal = rawVal.replace(/\D/g, '');
          
          if (batchImageStore[rawVal] || lowerKeys.has(rawVal.toLowerCase()) || 
              batchImageStore[baseVal] || lowerKeys.has(baseVal.toLowerCase()) ||
              (numOnlyVal && numericKeysMap.has(numOnlyVal))) {
            matched++;
          }
        }
      }
    }

    console.log('[BatchPhotos] Total images:', allKeys.length, 'Matched:', matched);
    console.log('[BatchPhotos] Sample keys:', allKeys.slice(0, 5));
    if (datasetRecords.length > 0 && imageMatchColumn) {
      const sampleVal = datasetRecords[0][imageMatchColumn]?.toString()?.trim();
      console.log('[BatchPhotos] Sample dataset value:', JSON.stringify(sampleVal), 'has match:', matched > 0);
    }

    // Store data URLs in IndexedDB
    const storeImages: Record<string, string> = {};
    for (const k of allKeys) {
      storeImages[k] = batchImageStore[k];
    }
    
    await hydrateBatchImageStore(storeImages, design.idCard.selected || undefined);
    // Remove saving to Zustand to avoid 5MB quota errors
    setField('idCard.bulkWorkflow.datasetImages', {});
    setField('idCard.bulkWorkflow.matchedImageCount', matched);
    setPhotoCount(allKeys.length);
    setIsProcessingPhotos(false);

    // Reset input so same file can be re-selected
    if (photoInputRef.current) photoInputRef.current.value = '';
    
    console.log('[BatchPhotos] ✅ Done! Store updated with', allKeys.length, 'data URLs');
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingPdf(true);
      let uploadFile = file;
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const dataUrl = await convertPdfToImage(file);
        const blob = await (await fetch(dataUrl)).blob();
        uploadFile = new File([blob], file.name.replace(/\.pdf$/i, '.png'), { type: 'image/png' });
      } else if (file.name.toLowerCase().endsWith('.wmf')) {
        const dataUrl = await convertWmfToImage(file);
        const blob = await (await fetch(dataUrl)).blob();
        uploadFile = new File([blob], file.name.replace(/\.wmf$/i, '.png'), { type: 'image/png' });
      }
      
      const res = await uploadService.uploadPhoto(uploadFile);
      setField(`idCard.${side}.backgroundImage`, res.url);
    } catch (err: any) {
      console.error('Error processing template', err);
      const msg = typeof err === 'string' ? err : (err.message || 'Unknown error');
      alert('Could not upload template: ' + msg);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleVariantTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantId: string, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let uploadFile = file;
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const dataUrl = await convertPdfToImage(file);
        const blob = await (await fetch(dataUrl)).blob();
        uploadFile = new File([blob], file.name.replace(/\.pdf$/i, '.png'), { type: 'image/png' });
      } else if (file.name.toLowerCase().endsWith('.wmf')) {
        const dataUrl = await convertWmfToImage(file);
        const blob = await (await fetch(dataUrl)).blob();
        uploadFile = new File([blob], file.name.replace(/\.wmf$/i, '.png'), { type: 'image/png' });
      }
      
      const res = await uploadService.uploadPhoto(uploadFile);
      const dataUrl = res.url;
      
      const updatedVariants = [...(design.idCard.bulkWorkflow.templateVariants || [])];
      const variantIndex = updatedVariants.findIndex(v => v.id === variantId);
      if (variantIndex >= 0) {
        if (side === 'front') updatedVariants[variantIndex].frontImage = dataUrl;
        if (side === 'back') updatedVariants[variantIndex].backImage = dataUrl;
        setField('idCard.bulkWorkflow.templateVariants', updatedVariants);
      }
    } catch (err: any) {
      console.error('Error processing variant template', err);
      const msg = typeof err === 'string' ? err : (err.message || 'Unknown error');
      alert('Could not upload variant template: ' + msg);
    }
  };

  const addTemplateVariant = () => {
    const newVariant = {
      id: `variant-${Date.now()}`,
      name: `Variant ${(design.idCard.bulkWorkflow.templateVariants || []).length + 1}`,
      condition: { column: datasetColumns[0] || '', value: '' },
      frontImage: null,
      backImage: null
    };
    setField('idCard.bulkWorkflow.templateVariants', [...(design.idCard.bulkWorkflow.templateVariants || []), newVariant]);
  };

  const updateVariantCondition = (id: string, key: 'column' | 'value', val: string) => {
    const updated = (design.idCard.bulkWorkflow.templateVariants || []).map(v => 
      v.id === id ? { ...v, condition: { ...v.condition, [key]: val } } : v
    );
    setField('idCard.bulkWorkflow.templateVariants', updated);
  };

  const removeVariant = (id: string) => {
    const updated = (design.idCard.bulkWorkflow.templateVariants || []).filter(v => v.id !== id);
    setField('idCard.bulkWorkflow.templateVariants', updated);
  };

  const resetWorkspace = async () => {
    if (confirm('Are you sure you want to clear EVERYTHING? This will delete all your design elements, dataset, and templates.')) {
      setField('idCard.bulkWorkflow.datasetRecords', []);
      setField('idCard.bulkWorkflow.datasetColumns', []);
      setField('idCard.bulkWorkflow.templateVariants', []);
      setField('idCard.bulkWorkflow.datasetImages', {});
      setField('idCard.front.backgroundImage', null);
      setField('idCard.back.backgroundImage', null);
      setField('idCard.front.elements', []);
      setField('idCard.back.elements', []);
      setField('idCard.bulkWorkflow.mode', 'setup');
      await clearBatchImageStore(design.idCard.selected || undefined);
      setPhotoCount(0);
    }
  };

  const handleClearDataset = () => {
    if (confirm('Are you sure you want to clear the ID Dataset?')) {
      setField('idCard.bulkWorkflow.datasetRecords', []);
      setField('idCard.bulkWorkflow.datasetColumns', []);
    }
  };
  const handleClearTemplate = () => {
    if (confirm('Are you sure you want to clear the Design Template (Front and Back images)?')) {
      setField('idCard.front.backgroundImage', null);
      setField('idCard.back.backgroundImage', null);
    }
  };
  const handleClearPhotos = async () => {
    if (confirm('Are you sure you want to clear all Batch Photos?')) {
      await clearBatchImageStore(design.idCard.selected || undefined);
      setPhotoCount(0);
      setField('idCard.bulkWorkflow.datasetImages', {});
      setField('idCard.bulkWorkflow.matchedImageCount', 0);
    }
  };

  const getMatchCount = (variant: Record<string, unknown>) => {
    if (!datasetRecords || !variant.condition.column || !variant.condition.value) return 0;
    return datasetRecords.filter((r: Record<string, unknown>) => 
      r[variant.condition.column]?.toString().trim().toLowerCase() === variant.condition.value.trim().toLowerCase()
    ).length;
  };



  const handleDatasetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
        const rawRecords = XLSX.utils.sheet_to_json(worksheet);
        
        // Process records to format dates and cleanup values
        const records = rawRecords.map((r: Record<string, unknown>) => {
          const cleaned: Record<string, unknown> = {};
          for (const key of headers) {
             // Use formatIfDate for every field to catch date objects or date-like strings
             cleaned[key] = r[key] !== undefined ? formatIfDate(r[key]) : '';
          }
          return cleaned;
        });
        
        if (headers && records.length > 0) {
          setField('idCard.bulkWorkflow.datasetColumns', headers);
          setField('idCard.bulkWorkflow.datasetRecords', records);
          setField('idCard.bulkWorkflow.mapping', {});
          setField('idCard.front.elements', []);
          setField('idCard.back.elements', []);
        }
      } catch(err) {
        console.error('Error parsing excel', err);
        alert('Could not parse Excel file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const frontBgImage = design.idCard.front.backgroundImage;
  const backBgImage = design.idCard.back.backgroundImage;
  const anyBgImage = frontBgImage || backBgImage;

  // Determine photos state
  const hasPhotos = photoCount > 0 || matchedImageCount > 0;
  const photosFullyMatched = hasPhotos && matchedImageCount > 0 && matchedImageCount === datasetRecords.length;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-10 overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-6xl w-full">
        <div className="mb-12">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Workspace Setup</h1>
            <p className="text-slate-500 font-medium mt-1">Define your visual template and your data source to begin.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Template Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
              <LayoutTemplate size={28} />
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">1. The Design Template</h3>
              {anyBgImage && (
                <button 
                  onClick={handleClearTemplate}
                  className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  Clear Template
                </button>
              )}
            </div>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Upload a base design exported from Canva or Illustrator. We support high-res images(JPG, WMF).</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Front Side</label>
                <label className="cursor-pointer block">
                  <input type="file" accept=".pdf,image/*,.wmf" className="hidden" onChange={(e) => handleTemplateUpload(e, 'front')} />
                  <div className={`w-full py-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${frontBgImage ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600'}`}>
                    {isProcessingPdf ? (
                      <span className="font-bold text-xs flex items-center gap-2 animate-pulse">Processing...</span>
                    ) : frontBgImage ? (
                      <span className="font-bold text-xs flex items-center gap-2"><FileCheck size={16} /> Front Uploaded</span>
                    ) : (
                      <span className="font-bold text-xs flex items-center gap-2"><UploadCloud size={16} /> Select Front File</span>
                    )}
                  </div>
                </label>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Back Side (Optional)</label>
                <label className="cursor-pointer block">
                  <input type="file" accept=".pdf,image/*,.wmf" className="hidden" onChange={(e) => handleTemplateUpload(e, 'back')} />
                  <div className={`w-full py-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${backBgImage ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600'}`}>
                    {backBgImage ? (
                      <span className="font-bold text-xs flex items-center gap-2"><FileCheck size={16} /> Back Uploaded</span>
                    ) : (
                      <span className="font-bold text-xs flex items-center gap-2"><UploadCloud size={16} /> Select Back File</span>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Dataset Card */}
          <div className={`bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden transition-all ${anyBgImage ? 'hover:shadow-lg' : 'opacity-60 grayscale'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${datasetReady ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              <Database size={28} />
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">2. The ID Dataset</h3>
              {datasetReady && (
                <button 
                  onClick={handleClearDataset}
                  className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  Clear Dataset
                </button>
              )}
            </div>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Upload the Excel file containing the cardholder information. This will automatically generate your text fields.</p>
            
            <label className={`block ${anyBgImage ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleDatasetUpload} disabled={!anyBgImage} />
              <div className={`w-full py-5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${datasetReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-600'}`}>
                {datasetReady ? (
                  <span className="font-bold flex items-center gap-2"><FileCheck size={20} /> {design.idCard.bulkWorkflow.datasetRecords.length} Records Loaded</span>
                ) : (
                  <span className="font-bold flex items-center gap-2"><UploadCloud size={20} /> Upload Dataset</span>
                )}
              </div>
            </label>
            {!anyBgImage && <div className="text-sm font-bold text-slate-400 mt-5 text-center px-4 py-3 bg-slate-50 rounded-xl">Please upload a template first</div>}
          </div>

          {/* Photos Card */}
          <div className={`bg-white rounded-3xl p-8 border shadow-sm relative overflow-hidden transition-all ${hasPhotos ? 'border-emerald-300 shadow-emerald-100' : 'border-slate-200'} ${datasetReady ? 'hover:shadow-lg' : 'opacity-60 grayscale'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${hasPhotos ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
              {hasPhotos ? <CheckCircle size={28} /> : <ImageIcon size={28} />}
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-slate-900">3. Batch Photos</h3>
              {hasPhotos && (
                <button 
                  onClick={handleClearPhotos}
                  className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  Clear Photos
                </button>
              )}
            </div>
             <p className="text-slate-500 text-sm mb-4 leading-relaxed">Upload a ZIP or folder of student photos. File names MUST match the Excel IDs exactly (e.g. 1025.jpg).</p>
            
            {datasetReady && (
              <div className="mb-5">
                 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Match photos with column:</label>
                 <select 
                   value={imageMatchColumn || ''}
                   onChange={(e) => setField('idCard.bulkWorkflow.imageMatchColumn', e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/50"
                 >
                   <option value="" disabled>Select a column...</option>
                   {datasetColumns.map(col => <option key={col} value={col}>{col}</option>)}
                 </select>
              </div>
            )}
            
            {/* Hidden file input - controlled via ref (NOT inside a label to avoid disabled/pointer-events conflicts) */}
            <input 
              ref={photoInputRef}
              type="file" 
              multiple 
              accept="image/*,.zip,application/zip,application/x-zip-compressed"
              style={{ display: 'none' }}
              onChange={handleBatchPhotos}
            />
            
            {/* Clickable button triggers file input via ref */}
            <button
              type="button"
              onClick={() => {
                if (datasetReady && imageMatchColumn && photoInputRef.current) {
                  console.log('[BatchPhotos] Opening file picker...');
                  photoInputRef.current.click();
                }
              }}
              disabled={!datasetReady || !imageMatchColumn}
              className={`w-full py-5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 transition-all font-bold ${
                !datasetReady || !imageMatchColumn
                  ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                  : hasPhotos 
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer' 
                    : 'border-orange-200 bg-orange-50/50 hover:bg-orange-50 text-orange-600 cursor-pointer'
              }`}
            >
              {isProcessingPhotos ? (
                <span className="flex items-center gap-2 animate-pulse">Processing...</span>
              ) : hasPhotos ? (
                <span className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-emerald-500" /> 
                  {photoCount} Photos Loaded {matchedImageCount > 0 && `• ${matchedImageCount} Matched`}
                </span>
              ) : (
                <span className="flex items-center gap-2"><UploadCloud size={20} /> Select Photos or ZIP</span>
              )}
            </button>
            
            {!datasetReady && <div className="text-sm font-bold text-slate-400 mt-5 text-center px-4 py-3 bg-slate-50 rounded-xl">Load dataset first</div>}
            {datasetReady && !imageMatchColumn && <div className="text-xs font-bold text-slate-400 mt-2 text-center text-orange-500 animate-pulse">Please select a matching column above</div>}
            {hasPhotos && matchedImageCount > 0 && (
              <div className={`mt-3 text-center text-xs font-bold py-2 rounded-xl ${photosFullyMatched ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {photosFullyMatched ? '✓ All records matched with photos!' : `${datasetRecords.length - matchedImageCount} records still missing photos`}
              </div>
            )}
          </div>
        </div>

        {/* Template Intelligence Section */}
        {datasetReady && anyBgImage && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-10 overflow-hidden relative group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <GitBranch size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Template Intelligence</h3>
                  <p className="text-slate-500 text-sm">Automatically swap templates based on dataset values (e.g. branch, department).</p>
                </div>
              </div>
              <button 
                onClick={addTemplateVariant}
                disabled={(design.idCard.bulkWorkflow.templateVariants || []).length >= 4}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} /> Add Variant
              </button>
            </div>

            {(design.idCard.bulkWorkflow.templateVariants || []).length > 0 ? (
              <div className="space-y-4">
                {(design.idCard.bulkWorkflow.templateVariants || []).map((variant, idx) => (
                  <div key={variant.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50 flex items-start gap-6 relative">
                    <button onClick={() => removeVariant(variant.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors">
                      <X size={18} />
                    </button>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-black text-purple-600 uppercase tracking-widest text-[10px] px-2 py-0.5 bg-purple-50 rounded border border-purple-100">
                            {variant.condition.value ? `Variant: ${variant.condition.value}` : `Rule ${idx + 1}`}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                             <Database size={12}/>
                             {getMatchCount(variant)} Records Match
                          </div>
                        </div>
                        {(!variant.frontImage && !variant.backImage) && (
                          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded animate-pulse">
                            <AlertCircle size={10}/> No artwork uploaded
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-500">IF</span>
                          <select 
                            value={variant.condition.column}
                            onChange={(e) => updateVariantCondition(variant.id, 'column', e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-1.5 outline-none flex-1 max-w-[200px]"
                          >
                            {datasetColumns.map(col => <option key={col} value={col}>{col}</option>)}
                          </select>
                          <span className="text-sm font-bold text-slate-500">EQUALS</span>
                          <input 
                            type="text"
                            placeholder="Value (e.g. North)"
                            value={variant.condition.value}
                            onChange={(e) => updateVariantCondition(variant.id, 'value', e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-1.5 outline-none flex-1"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <label className="cursor-pointer flex-1">
                          <input type="file" accept=".pdf,image/*,.wmf" className="hidden" onChange={(e) => handleVariantTemplateUpload(e, variant.id, 'front')} />
                          <div className={`w-full py-3 rounded-xl border border-dashed flex items-center justify-center transition-colors text-xs font-bold ${variant.frontImage ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'}`}>
                            {variant.frontImage ? <><FileCheck size={14} className="mr-2"/> Front Uploaded</> : <><UploadCloud size={14} className="mr-2"/> Upload Specific Front</>}
                          </div>
                        </label>
                        <label className="cursor-pointer flex-1">
                          <input type="file" accept=".pdf,image/*,.wmf" className="hidden" onChange={(e) => handleVariantTemplateUpload(e, variant.id, 'back')} />
                          <div className={`w-full py-3 rounded-xl border border-dashed flex items-center justify-center transition-colors text-xs font-bold ${variant.backImage ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'}`}>
                            {variant.backImage ? <><FileCheck size={14} className="mr-2"/> Back Uploaded</> : <><UploadCloud size={14} className="mr-2"/> Upload Specific Back</>}
                          </div>
                        </label>
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <div className="py-6 px-4 bg-slate-50 border border-slate-100 border-dashed rounded-2xl text-center text-slate-500 text-sm font-medium">
                No variants configured. All records will use the default templates above.
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={() => setField('idCard.bulkWorkflow.mode', 'design')}
            disabled={!anyBgImage || !datasetReady}
            className={`px-10 py-4 rounded-full font-black text-lg transition-all flex items-center gap-3 shadow-lg ${anyBgImage && datasetReady ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 hover:shadow-indigo-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
          >
            Enter Design Workspace <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
