import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RotateCw, Crop, Check, RefreshCw, ZoomIn, ZoomOut, Sliders, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface LanyardImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (croppedDataUrl: string) => void;
}

export default function LanyardImageCropModal({
  isOpen,
  onClose,
  imageUrl,
  onSave
}: LanyardImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Transformations
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | 'free'>('1:1');
  
  // Color & Image Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [borderRadius, setBorderRadius] = useState(0);

  // Position offsets
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
        setZoom(1);
        setRotation(0);
        setPosX(0);
        setPosY(0);
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  useEffect(() => {
    if (image && canvasRef.current) {
      renderCanvas();
    }
  }, [image, zoom, rotation, posX, posY, brightness, contrast, borderWidth, borderColor, borderRadius, aspectRatio]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on aspect ratio
    let targetW = 400;
    let targetH = 400;
    if (aspectRatio === '16:9') targetH = 225;
    if (aspectRatio === '4:3') targetH = 300;

    canvas.width = targetW;
    canvas.height = targetH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Background Fill / Border Container
    ctx.save();
    
    // Create Rounded Clip / Border
    if (borderRadius > 0) {
      const r = Math.min(borderRadius, Math.min(targetW, targetH) / 2);
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(targetW - r, 0);
      ctx.quadraticCurveTo(targetW, 0, targetW, r);
      ctx.lineTo(targetW, targetH - r);
      ctx.quadraticCurveTo(targetW, targetH, targetW - r, targetH);
      ctx.lineTo(r, targetH);
      ctx.quadraticCurveTo(0, targetH, 0, targetH - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.clip();
    }

    // Apply Image Filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Draw Image Transformed
    ctx.save();
    ctx.translate(canvas.width / 2 + posX, canvas.height / 2 + posY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const drawW = image.width;
    const drawH = image.height;
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Draw Border overlay
    if (borderWidth > 0) {
      ctx.lineWidth = borderWidth * 2;
      ctx.strokeStyle = borderColor;
      if (borderRadius > 0) {
        const r = Math.min(borderRadius, Math.min(targetW, targetH) / 2);
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(targetW - r, 0);
        ctx.quadraticCurveTo(targetW, 0, targetW, r);
        ctx.lineTo(targetW, targetH - r);
        ctx.quadraticCurveTo(targetW, targetH, targetW - r, targetH);
        ctx.lineTo(r, targetH);
        ctx.quadraticCurveTo(0, targetH, 0, targetH - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.strokeRect(0, 0, targetW, targetH);
      }
    }

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - posX, y: e.clientY - posY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPosX(e.clientX - dragStart.x);
    setPosY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const croppedDataUrl = canvas.toDataURL('image/png');
    onSave(croppedDataUrl);
    toast.success('Cropped image applied to lanyard!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-xl bg-white p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Crop className="w-5 h-5 text-indigo-600" />
            Edit & Crop Lanyard Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Canvas Display */}
          <div className="relative flex items-center justify-center p-4 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden min-h-[280px]">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-move shadow-md rounded-lg max-h-[300px] object-contain bg-checkered"
            />
            <span className="absolute bottom-2 left-3 text-[10px] font-bold text-slate-400">
              Drag to reposition image inside crop frame
            </span>
          </div>

          {/* Aspect Ratio Presets */}
          <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 pl-2">Aspect Ratio:</span>
            <div className="flex gap-1">
              {(['1:1', '16:9', '4:3'] as const).map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    aspectRatio === ratio
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Zoom Slider */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs font-bold text-slate-700">Zoom / Scale</Label>
                <span className="text-xs font-mono text-slate-500">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4 text-slate-400" />
                <Slider
                  value={[zoom]}
                  min={0.2}
                  max={3}
                  step={0.05}
                  onValueChange={([val]) => setZoom(val)}
                  className="flex-1"
                />
                <ZoomIn className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs font-bold text-slate-700">Rotation</Label>
                <span className="text-xs font-mono text-slate-500">{rotation}°</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-slate-400" />
                <Slider
                  value={[rotation]}
                  min={-180}
                  max={180}
                  step={5}
                  onValueChange={([val]) => setRotation(val)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Border Width */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs font-bold text-slate-700">Border Width</Label>
                <span className="text-xs font-mono text-slate-500">{borderWidth}px</span>
              </div>
              <Slider
                value={[borderWidth]}
                min={0}
                max={20}
                step={1}
                onValueChange={([val]) => setBorderWidth(val)}
              />
            </div>

            {/* Border Corner Radius */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs font-bold text-slate-700">Corner Radius</Label>
                <span className="text-xs font-mono text-slate-500">{borderRadius}px</span>
              </div>
              <Slider
                value={[borderRadius]}
                min={0}
                max={100}
                step={2}
                onValueChange={([val]) => setBorderRadius(val)}
              />
            </div>

            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs font-bold text-slate-700">Brightness</Label>
                <span className="text-xs font-mono text-slate-500">{brightness}%</span>
              </div>
              <Slider
                value={[brightness]}
                min={50}
                max={150}
                step={5}
                onValueChange={([val]) => setBrightness(val)}
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs font-bold text-slate-700">Contrast</Label>
                <span className="text-xs font-mono text-slate-500">{contrast}%</span>
              </div>
              <Slider
                value={[contrast]}
                min={50}
                max={150}
                step={5}
                onValueChange={([val]) => setContrast(val)}
              />
            </div>
          </div>

          {/* Border Color */}
          <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
            <Palette className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600">Border Color:</span>
            <input
              type="color"
              value={borderColor}
              onChange={e => setBorderColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
            />
            <input
              type="text"
              value={borderColor}
              onChange={e => setBorderColor(e.target.value)}
              className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg uppercase font-mono bg-white"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setZoom(1);
              setRotation(0);
              setPosX(0);
              setPosY(0);
              setBorderWidth(0);
              setBorderRadius(0);
              setBrightness(100);
              setContrast(100);
            }}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="text-xs font-bold">
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Apply Crop & Insert
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
