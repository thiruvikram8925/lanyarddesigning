import { ImagePlus, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

export default function DropzoneField({ label, hint, accept, onFileSelect, fileName }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file) => {
    if (!file) return;
    await onFileSelect(file);
    setDragging(false);
  };

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center justify-between gap-2 text-sm min-w-0">
        <span className="font-medium text-slate-800 truncate shrink-0 max-w-[45%]">{label}</span>
        <span className="text-xs text-slate-500 truncate text-right min-w-0" title={fileName || hint}>
          {fileName || hint}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <button
        type="button"
        onClick={pickFile}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          handleFile(event.dataTransfer.files?.[0]);
        }}
        className={`flex min-h-28 w-full flex-col items-center justify-center rounded-[1.4rem] border-2 border-dashed px-4 py-5 text-center transition ${
          dragging
            ? 'border-[#2f6cf6] bg-blue-50 text-slate-800'
            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
        }`}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#2f6cf6] shadow-sm">
          {fileName ? <ImagePlus className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
        </div>
        <div className="text-sm font-semibold text-slate-800">Drag & drop your file here</div>
        <div className="mt-1 text-xs text-slate-500">or tap to browse</div>
      </button>
    </div>
  );
}