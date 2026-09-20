import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Draggable bottom sheet component for mobile.
 * Usage:
 *   <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Create Task">
 *     <YourContent />
 *   </BottomSheet>
 */
export default function BottomSheet({ isOpen, onClose, title, children, snapPoints = ['50%', '90%'] }) {
  const sheetRef = useRef(null);
  const dragStartY = useRef(null);
  const dragStartHeight = useRef(null);
  const [height, setHeight] = useState(null);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setTimeout(() => {
        setAnimating(true);
        setHeight(snapPoints[0]);
      }, 10);
    } else {
      setAnimating(false);
      setTimeout(() => {
        setVisible(false);
        setHeight(null);
      }, 320);
    }
  }, [isOpen]);

  const handleDragStart = (e) => {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
    dragStartHeight.current = sheetRef.current?.getBoundingClientRect().height ?? 0;
  };

  const handleDrag = (e) => {
    if (dragStartY.current === null) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const delta = dragStartY.current - clientY;
    const newH = Math.max(80, Math.min(dragStartHeight.current + delta, window.innerHeight * 0.95));
    setHeight(`${newH}px`);
  };

  const handleDragEnd = (e) => {
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const delta = dragStartY.current - clientY;
    if (delta < -80) {
      onClose();
    } else {
      const windowH = window.innerHeight;
      const currentH = sheetRef.current?.getBoundingClientRect().height ?? 0;
      const pct = currentH / windowH;
      const snapped = pct > 0.7 ? snapPoints[snapPoints.length - 1] : snapPoints[0];
      setHeight(snapped);
    }
    dragStartY.current = null;
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: animating ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
        style={{
          height: height ?? snapPoints[0],
          transform: animating ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '95vh',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handleDragStart}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDrag}
          onTouchEnd={handleDragEnd}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0 border-b border-gray-100">
            <h2 className="text-base font-semibold text-[#0A1628]">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
