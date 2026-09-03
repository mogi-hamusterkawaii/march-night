import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageSrc, isOpen]);

  if (!isOpen) return null;

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleConfirmCrop = () => {
    playClickSound();
    const img = imgRef.current;
    if (!img) return;

    const outputSize = 400;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const viewSize = 240;
    const cropRatio = outputSize / viewSize;

    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.scale(scale * cropRatio, scale * cropRatio);
    ctx.translate(position.x / scale, position.y / scale);

    const naturalWidth = img.naturalWidth || 400;
    const naturalHeight = img.naturalHeight || 400;
    
    const renderWidth = viewSize;
    const renderHeight = (naturalHeight / naturalWidth) * viewSize;

    ctx.drawImage(
      img,
      -renderWidth / 2,
      -renderHeight / 2,
      renderWidth,
      renderHeight
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="bg-[#0b0f17] border border-white/20 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col items-center">
        <div className="w-full flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Move className="w-4 h-4 text-blue-400" />
            <span>裁切頭貼 / 調整位置與縮放</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-white/60 mt-3 text-center">
          💡 請按住滑鼠或手指拖曳照片移動位置，並透過下方滑桿放大特寫
        </p>

        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-64 h-64 my-6 bg-black/60 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing border-2 border-white/10 flex items-center justify-center select-none shadow-inner"
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop source"
            crossOrigin="anonymous"
            draggable={false}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
              maxWidth: '100%',
              pointerEvents: 'none',
            }}
            className="object-contain"
          />

          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-56 rounded-full border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]" />
          </div>
        </div>

        <div className="w-full space-y-4">
          <div className="flex items-center gap-3 px-2">
            <ZoomOut className="w-4 h-4 text-white/40" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-blue-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono text-white/70 w-10 text-right">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置置中
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                完成裁切
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
