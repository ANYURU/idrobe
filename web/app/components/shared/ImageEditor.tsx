import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCw, Check, X, Move } from "lucide-react";

interface ImageEditSettings {
  imagePos: { x: number; y: number };
  cropSize: number | { width: number; height: number };
  rotation: number;
  brightness: number;
  contrast: number;
  zoom: number;
}

interface ImageEditorProps {
  imageSrc: string;
  onSave: (editedFile: File, settings: ImageEditSettings) => void;
  onCancel: () => void;
  cropShape?: 'rectangle' | 'circle';
  initialSettings?: Partial<ImageEditSettings>;
}

export function ImageEditor({ imageSrc, onSave, onCancel, cropShape = 'rectangle', initialSettings }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imagePos, setImagePos] = useState(initialSettings?.imagePos || { x: 0, y: 0 });
  const [cropSize, setCropSize] = useState<number | { width: number; height: number }>(
    initialSettings?.cropSize || (cropShape === 'circle' ? 200 : { width: 300, height: 200 })
  );
  const [maxCropSize, setMaxCropSize] = useState({ width: 320, height: 320 });
  const [rotation, setRotation] = useState(initialSettings?.rotation || 0);
  const [brightness, setBrightness] = useState(initialSettings?.brightness || 100);
  const [contrast, setContrast] = useState(initialSettings?.contrast || 100);
  const [zoom, setZoom] = useState(initialSettings?.zoom || 100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const isCircle = cropShape === 'circle';

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePos.x, y: e.clientY - imagePos.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setImagePos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setMaxCropSize({ width: rect.width - 40, height: rect.height - 40 });
    }
  }, []);

  const applyEdits = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const container = containerRef.current;
    if (!canvas || !img || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    
    const cropWidth = isCircle ? cropSize as number : (cropSize as { width: number; height: number }).width;
    const cropHeight = isCircle ? cropSize as number : (cropSize as { width: number; height: number }).height;
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    const sourceX = (centerX - cropWidth / 2 - (imgRect.left - containerRect.left)) * scaleX;
    const sourceY = (centerY - cropHeight / 2 - (imgRect.top - containerRect.top)) * scaleY;
    const sourceWidth = cropWidth * scaleX;
    const sourceHeight = cropHeight * scaleY;

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    
    if (isCircle) {
      ctx.beginPath();
      ctx.arc(cropWidth / 2, cropHeight / 2, cropWidth / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height
    );
    
    ctx.restore();

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });
        const currentSettings = {
          imagePos,
          cropSize,
          rotation,
          brightness,
          contrast,
          zoom
        };
        onSave(file, currentSettings);
      }
    }, 'image/jpeg', 0.9);
  }, [imageSrc, imagePos, cropSize, rotation, brightness, contrast, zoom, onSave, isCircle]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Edit Image</h3>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="space-y-4">
            <div 
              ref={containerRef}
              className="relative w-full h-80 border rounded-lg overflow-hidden bg-black/20"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Preview"
                className={`absolute object-contain max-w-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                  transform: `translate(${imagePos.x}px, ${imagePos.y}px) rotate(${rotation}deg) scale(${zoom / 100})`,
                  width: 'auto',
                  height: '120%',
                }}
                onMouseDown={handleMouseDown}
                draggable={false}
              />
              
              {/* Crop overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/50" />
                <div 
                  className={`absolute border-2 border-white shadow-lg ${
                    isCircle ? 'rounded-full' : ''
                  }`}
                  style={{
                    left: '50%',
                    top: '50%',
                    width: isCircle ? `${cropSize as number}px` : `${(cropSize as { width: number; height: number }).width}px`,
                    height: isCircle ? `${cropSize as number}px` : `${(cropSize as { width: number; height: number }).height}px`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`,
                  }}
                />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Move className="h-4 w-4 inline mr-2" />
                Crop Size
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">{isCircle ? 'Size' : 'Width'}</label>
                  <Slider
                    value={[isCircle ? cropSize as number : (cropSize as { width: number; height: number }).width]}
                    onValueChange={([value]) => setCropSize(isCircle ? value : { ...(cropSize as { width: number; height: number }), width: value })}
                    min={100}
                    max={isCircle ? Math.min(maxCropSize.width, maxCropSize.height) : maxCropSize.width}
                    step={10}
                  />
                </div>
                {!isCircle && (
                  <div>
                    <label className="text-xs text-muted-foreground">Height</label>
                    <Slider
                      value={[(cropSize as { width: number; height: number }).height]}
                      onValueChange={([height]) => setCropSize({ ...(cropSize as { width: number; height: number }), height })}
                      min={100}
                      max={maxCropSize.height}
                      step={10}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Zoom</label>
              <Slider
                value={[zoom]}
                onValueChange={([z]) => setZoom(z)}
                min={50}
                max={200}
                step={5}
              />
              <div className="text-xs text-muted-foreground mt-1">{zoom}%</div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                <RotateCw className="h-4 w-4 inline mr-2" />
                Rotation
              </label>
              <Slider
                value={[rotation]}
                onValueChange={([r]) => setRotation(r)}
                min={-180}
                max={180}
                step={15}
              />
              <div className="text-xs text-muted-foreground mt-1">{rotation}°</div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Brightness</label>
              <Slider
                value={[brightness]}
                onValueChange={([b]) => setBrightness(b)}
                min={50}
                max={150}
                step={5}
              />
              <div className="text-xs text-muted-foreground mt-1">{brightness}%</div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Contrast</label>
              <Slider
                value={[contrast]}
                onValueChange={([c]) => setContrast(c)}
                min={50}
                max={150}
                step={5}
              />
              <div className="text-xs text-muted-foreground mt-1">{contrast}%</div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={applyEdits} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}