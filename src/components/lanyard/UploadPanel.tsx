import { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, FileImage } from 'lucide-react';

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  file: File;
}

export default function UploadPanel({ onImageSelect }: { onImageSelect?: (url: string) => void }) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    fileArr.forEach(file => {
      if (!file.type.startsWith('image/') && file.type !== 'image/svg+xml') return;
      if (file.size > 5 * 1024 * 1024) return; // 5MB limit
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setImages(prev => [...prev, {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          name: file.name,
          url,
          file,
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  }, [processFiles]);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Upload</h3>
          <span className="text-[10px] text-slate-400 font-medium">ASSETS</span>
        </div>
      </div>

      {/* Drop Zone */}
      <div className="px-4 mb-4">
        <div
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
            isDragOver
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-slate-100'
          }`}
          onClick={() => document.getElementById('lanyard-file-input')?.click()}
        >
          <Upload size={28} className={`mb-2 ${isDragOver ? 'text-indigo-500' : 'text-slate-300'}`} />
          <p className="text-xs font-bold text-slate-600 mb-0.5">Drop files here</p>
          <p className="text-[10px] text-slate-400">or click to browse</p>
          <p className="text-[9px] text-slate-300 mt-1">PNG, JPG, SVG up to 5MB</p>
          <input
            id="lanyard-file-input"
            type="file"
            accept="image/*,.svg"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>

      {/* Uploaded Images */}
      <div className="px-4 mb-2">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Uploaded Images</h4>
      </div>

      <div className="flex-1 px-4 pb-4">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileImage size={32} className="text-slate-200 mb-2" />
            <p className="text-[11px] text-slate-400">Your uploaded images will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map(img => (
              <div
                key={img.id}
                className="group relative aspect-square bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => onImageSelect?.(img.url)}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-contain p-1"
                />
                <button
                  onClick={e => { e.stopPropagation(); removeImage(img.id); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                >
                  <X size={10} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-all">
                  <p className="text-[8px] text-white truncate">{img.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
