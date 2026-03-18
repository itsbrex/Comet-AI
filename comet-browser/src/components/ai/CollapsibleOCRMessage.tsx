import React, { useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleOCRMessageProps {
  label: string;
  content: string;
}

const CollapsibleOCRMessage = memo(function CollapsibleOCRMessage({
  label,
  content,
}: CollapsibleOCRMessageProps) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(120);
  const dragStartY = useRef<number | null>(null);
  const dragStartH = useRef<number>(120);

  const onDragStart = (e: React.MouseEvent) => {
    dragStartY.current = e.clientY;
    dragStartH.current = height;
    const onMove = (ev: MouseEvent) => {
      if (dragStartY.current === null) return;
      const delta = ev.clientY - dragStartY.current;
      setHeight(Math.max(60, Math.min(600, dragStartH.current + delta)));
    };
    const onUp = () => {
      dragStartY.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="w-full mt-1 rounded-xl border border-white/10 overflow-hidden bg-black/30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          {open ? <EyeOff size={11} /> : <Eye size={11} />}
          <span>[{label}]</span>
          <span className="text-white/20 font-normal normal-case tracking-normal">
            {open ? 'click to hide' : `${content.length} chars — click to view`}
          </span>
        </div>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ height }}
            className="overflow-y-auto modern-scrollbar bg-black/40"
          >
            <pre className="p-3 text-[10px] text-white/60 leading-relaxed whitespace-pre-wrap break-all font-mono">
              {content}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {open && (
        <div
          onMouseDown={onDragStart}
          className="w-full flex items-center justify-center py-1 cursor-ns-resize hover:bg-white/10 transition-colors border-t border-white/5"
          title="Drag to resize"
        >
          <div className="w-8 h-0.5 rounded-full bg-white/20" />
        </div>
      )}
    </div>
  );
});

export default CollapsibleOCRMessage;
