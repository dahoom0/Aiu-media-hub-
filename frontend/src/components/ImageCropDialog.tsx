import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { useTheme } from './ThemeProvider';
import { ZoomIn, ZoomOut, RotateCw, Check, X } from 'lucide-react';

interface ImageCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onCropComplete: (croppedImageUrl: string) => void;
}

export function ImageCropDialog({ isOpen, onClose, imageUrl, onCropComplete }: ImageCropDialogProps) {
  const { theme } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const getCroppedImage = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size to 400x400 (1:1 ratio)
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    // Calculate the center of the canvas
    const centerX = size / 2;
    const centerY = size / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Save context state
    ctx.save();

    // Move to center for rotation
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Calculate image position
    const imgX = position.x / zoom;
    const imgY = position.y / zoom;

    // Draw image
    ctx.drawImage(
      image,
      imgX - centerX,
      imgY - centerY,
      image.width,
      image.height
    );

    // Restore context
    ctx.restore();

    return canvas.toDataURL('image/png');
  }, [zoom, rotation, position]);

  const handleSave = () => {
    const croppedImage = getCroppedImage();
    if (croppedImage) {
      onCropComplete(croppedImage);
      onClose();
    }
  };

  const handleCancel = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    onClose();
  };
  
  if (!imageUrl) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className={`max-w-2xl ${theme === 'light' ? 'bg-white' : 'bg-gray-900'}`}>
        <DialogHeader>
          <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
            Crop Profile Picture
          </DialogTitle>
          <DialogDescription className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>
            Adjust the image to fit the crop area.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop Area */}
          <div 
            className={`relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden border-2 ${
              theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-gray-950 border-gray-700'
            }`}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                ref={(el) => {
                  if (el) imageRef.current = el;
                }}
                src={imageUrl}
                alt="Crop preview"
                className="max-w-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                }}
                draggable={false}
              />
            </div>

            {/* Crop Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            </div>

            {/* Center Guide */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-1 h-full bg-white/10" />
              <div className="absolute h-1 w-full bg-white/10" />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  Zoom
                </label>
                <span className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ZoomOut className={`h-4 w-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                <Slider
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <ZoomIn className={`h-4 w-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
            </div>

            {/* Rotation Button */}
            <Button
              onClick={handleRotate}
              variant="outline"
              className={`w-full ${
                theme === 'light' 
                  ? 'border-gray-300 hover:bg-gray-50' 
                  : 'border-gray-700 hover:bg-gray-800'
              }`}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Rotate 90°
            </Button>
          </div>

          {/* Hidden canvas for cropping */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter>
          <Button
            onClick={handleCancel}
            variant="outline"
            className={theme === 'light' ? 'border-gray-300' : 'border-gray-700'}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
          >
            <Check className="h-4 w-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}