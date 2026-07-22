import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import LiveCommentFeed from './LiveCommentFeed';
import type { Comment } from '../../hooks/useLiveSession';

interface CommentModalProps {
  open: boolean;
  onClose: () => void;
  comments: Comment[];
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onSendComment: () => void;
  user?: { name?: string; avatar?: string } | null;
  isBroadcaster?: boolean;
  isLoading?: boolean;
  maxCommentLength?: number;
  cooldownRemaining?: number;
  commentFailed?: boolean;
  placeholder?: string;
}

export default function CommentModal({
  open,
  onClose,
  comments,
  commentText,
  onCommentTextChange,
  onSendComment,
  user,
  isBroadcaster = false,
  isLoading = false,
  maxCommentLength = 200,
  cooldownRemaining = 0,
  commentFailed = false,
  placeholder,
}: CommentModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const vp = window.visualViewport;
    if (!vp) return;
    const onResize = () => {
      const height = window.innerHeight;
      const diff = height - vp.height - vp.offsetTop;
      setKeyboardHeight(Math.max(0, diff));
    };
    vp.addEventListener('resize', onResize);
    vp.addEventListener('scroll', onResize);
    onResize();
    return () => {
      vp.removeEventListener('resize', onResize);
      vp.removeEventListener('scroll', onResize);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 450);
    }
  }, [open]);

  const handleDragEnd = (_: any, info: { offset: { y: number } }) => {
    if (info.offset.y > 100) onClose();
  };

  const charCount = commentText.length;
  const isOverLimit = charCount > maxCommentLength;
  const canType = cooldownRemaining <= 0;
  const showSend = commentText.trim().length > 0 && !isOverLimit;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="comment-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
          />

          {/* Sheet */}
          <motion.div
            key="comment-modal-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 350, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="absolute bottom-0 inset-x-0 z-50 bg-gray-950/98 backdrop-blur-2xl rounded-t-[20px] sm:rounded-t-[24px] border-t border-white/[0.08] flex flex-col overflow-hidden"
            style={{ height: 'min(65vh, 480px)' }}
            role="dialog"
            aria-label={isBroadcaster ? 'Broadcaster comments' : 'Live comments'}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-9 h-[3px] rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 sm:py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[13px] font-bold text-white tracking-tight">Comments</h3>
                <span className="text-[11px] text-white/60 font-semibold tabular-nums bg-white/10 rounded-full px-2.5 py-0.5">
                  {comments.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center hover:bg-white/[0.15] transition-colors active:scale-90"
                aria-label="Close comments"
              >
                <X size={14} className="text-white/50" />
              </button>
            </div>

            {/* Comment feed */}
            <div className="flex-1 overflow-hidden">
              <LiveCommentFeed comments={comments} isBroadcaster={isBroadcaster} isLoading={isLoading} />
            </div>

            {/* Input bar */}
            <div
              className="px-3 py-3 border-t border-white/[0.06]"
              style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 12 : undefined }}
            >
              <div className="flex items-center gap-2.5">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div
                  className={`flex-1 flex items-center rounded-full px-4 py-2.5 border transition-all duration-200 ${
                    commentFailed
                      ? 'bg-red-500/15 border-red-500/30'
                      : isOverLimit
                        ? 'bg-white/[0.08] border-red-400/30'
                        : 'bg-white/[0.08] border-white/[0.06] focus-within:border-white/[0.12] focus-within:bg-white/[0.1]'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => onCommentTextChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (showSend) onSendComment();
                      }
                    }}
                    placeholder={
                      cooldownRemaining > 0
                        ? `Wait ${cooldownRemaining}s...`
                        : commentFailed
                          ? 'Failed to send'
                          : placeholder || 'Add a comment...'
                    }
                    disabled={cooldownRemaining > 0}
                    maxLength={maxCommentLength + 20}
                    aria-label="Type a comment"
                    className="flex-1 bg-transparent text-white text-[13px] placeholder:text-white/25 focus:outline-none disabled:opacity-40"
                  />

                  {charCount > 0 && (
                    <span
                      className={`text-[10px] tabular-nums mr-2 shrink-0 font-medium ${
                        isOverLimit ? 'text-red-400' : charCount > maxCommentLength * 0.8 ? 'text-amber-400' : 'text-white/20'
                      }`}
                    >
                      {charCount}/{maxCommentLength}
                    </span>
                  )}

                  {showSend && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={onSendComment}
                      aria-label="Send comment"
                      className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shrink-0 ml-2 hover:bg-red-400 transition-colors active:scale-90 shadow-lg shadow-red-500/30"
                    >
                      <Send size={11} className="text-white ml-0.5" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
