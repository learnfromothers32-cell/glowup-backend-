import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Comment } from '../../hooks/useLiveSession';

interface FloatingCommentsProps {
  comments: Comment[];
  maxVisible?: number;
  shiftUp?: boolean;
}

interface FloatingItem {
  id: string;
  userName: string;
  text: string;
}

const MAX_ITEMS = 50;
const STAGGER_MS = 40;

export default function FloatingComments({ comments, shiftUp = false }: FloatingCommentsProps) {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let added = false;
    for (const c of comments) {
      if (c.type !== 'comment') continue;
      if (seenIdsRef.current.has(c.id)) continue;
      seenIdsRef.current.add(c.id);

      added = true;
      const item: FloatingItem = { id: c.id, userName: c.userName, text: c.text };

      setItems((prev) => {
        const next = [...prev, item];
        return next.length > MAX_ITEMS ? next.slice(next.length - MAX_ITEMS) : next;
      });
    }

    if (added) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [comments]);

  useEffect(() => {
    return () => { seenIdsRef.current.clear(); };
  }, []);

  const bottomOffset = shiftUp
    ? 'max(env(safe-area-inset-bottom, 20px), 250px)'
    : 'max(env(safe-area-inset-bottom, 20px), 120px)';

  return (
    <div
      className="absolute left-3 right-[60px] sm:right-[68px] z-[25] pointer-events-none"
      style={{ bottom: bottomOffset, height: '30vh' }}
      aria-live="polite"
      aria-label="Live comments"
    >
      <div
        className="absolute inset-0 rounded-xl overflow-hidden pointer-events-auto"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.25) 20%, rgba(0,0,0,0.25) 100%)' }}
      >
        {/* fade mask at top */}
        <div
          className="absolute top-0 inset-x-0 h-10 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          }}
        />

        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto flex flex-col justify-end gap-1 p-2 pb-3"
          style={{ scrollbarWidth: 'none' }}
        >
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0.05 : 0.25,
                  ease: 'easeOut',
                  layout: { duration: 0.2 },
                }}
                className="w-fit max-w-[90%]"
              >
                <div
                  className="rounded-full px-3 py-1.5 backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
                >
                  <span className="text-[13px] font-bold text-white">{item.userName}</span>
                  <span className="text-[13px] text-white ml-1">{item.text}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
