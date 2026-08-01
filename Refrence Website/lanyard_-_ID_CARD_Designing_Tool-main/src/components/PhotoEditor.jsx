import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, RotateCw, Check, X, Sliders, Image as ImageIcon } from 'lucide-react';

export default function PhotoEditor({ initialImageSrc, onClose, onSave }) {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Image adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [scale, setScale] = useState(1);
  const [bgColor, setBgColor] = useState('transparent');
  const [rotation, setRotation] = useState(0);
  
  const [activeTab, setActiveTab] = useState('adjust');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (initialImageSrc) {
      loadImageFromSrc(initialImageSrc);
    }
  }, [initialImageSrc]);

  useEffect(() => {
    if (image && canvasRef.current) {
      drawImage();
    }
  }, [image, brightness, contrast, saturation, scale, bgColor, rotation]);

  const loadImageFromSrc = (src) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setScale(300 / Math.max(img.width, img.height));
    };
    img.src = src;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        loadImageFromSrc(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const drawImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    // Set canvas size to a square (e.g. 300x300 for ID photo)
    canvas.width = 300;
    canvas.height = 300;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
    ctx.restore();
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    
    // Get cropped/edited image as base64
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-black text-slate-800">Photo Cropper & Editor</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row p-6 gap-8 h-[60vh] min-h-[400px]">
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl relative overflow-hidden">
            {image ? (
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full shadow-lg rounded-lg border border-slate-200 bg-transparent checkerboard-bg"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23f1f5f9\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23f1f5f9\'/%3E%3C/svg%3E")'
                }}
              />
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto text-slate-300">
                  <ImageIcon size={32} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600">No photo selected</p>
                  <p className="text-xs font-medium text-slate-400 mb-4">Upload a photo to start cropping</p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto"
                >
                  <Upload size={16} /> Choose Photo
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
            )}
          </div>

          {/* Controls Area */}
          <div className="w-full md:w-80 flex flex-col gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('adjust')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'adjust' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Sliders size={14} className="inline mr-1.5 align-text-bottom" /> Adjust
              </button>
              <button 
                onClick={() => setActiveTab('background')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'background' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <div className="inline-block w-3 h-3 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 mr-1.5 align-text-bottom" /> Background
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {activeTab === 'adjust' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-600">Zoom / Scale</label>
                      <span className="text-xs font-medium text-slate-400">{(scale * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min="10" max="200" step="5" value={scale * 100} onChange={(e) => setScale(Number(e.target.value) / 100)} className="w-full accent-indigo-600" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-600">Rotation</label>
                      <span className="text-xs font-medium text-slate-400">{rotation}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="range" min="0" max="360" step="15" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-indigo-600" />
                      <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1.5 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200">
                        <RotateCw size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-600">Brightness</label>
                      <span className="text-xs font-medium text-slate-400">{brightness}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-indigo-600" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-600">Contrast</label>
                      <span className="text-xs font-medium text-slate-400">{contrast}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full accent-indigo-600" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-600">Saturation</label>
                      <span className="text-xs font-medium text-slate-400">{saturation}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full accent-indigo-600" />
                  </div>
                </div>
              )}

              {activeTab === 'background' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">Background Fill</label>
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => setBgColor('transparent')} className={`h-10 rounded-xl border-2 transition-all flex items-center justify-center checkerboard-bg ${bgColor === 'transparent' ? 'border-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}>
                        <X size={14} className="text-slate-400" />
                      </button>
                      {['#ffffff', '#e2e8f0', '#0f172a', '#3b82f6', '#ef4444', '#22c55e', '#eab308'].map(color => (
                        <button 
                          key={color} 
                          onClick={() => setBgColor(color)} 
                          className={`h-10 rounded-xl border-2 transition-all ${bgColor === color ? 'border-indigo-600 scale-110 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <p className="text-[10px] font-bold text-indigo-800 leading-relaxed">
                      💡 Tip: Use a transparent background for seamless ID card integration.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {image && (
              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all mb-2"
                >
                  Change Photo
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl shadow-sm hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={!image || isProcessing}
            className="px-6 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? 'Processing...' : <><Check size={16} /> Confirm Crop</>}
          </button>
        </div>
      </div>
    </div>
  );
}
