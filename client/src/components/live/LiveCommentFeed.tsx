import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, MessageCircle, Heart } from 'lucide-react';
import type { Comment } from '../../hooks/useLiveSession';

interface LiveCommentFeedProps {
  comments: Comment[];
  isBroadcaster?: boolean;
  isLoading?: boolean;
  inline?: boolean;
}

const TRUNCATE_LENGTH = 150;
const VISIBLE_COUNT = 60;
const SCROLL_BOTTOM_THRESHOLD = 50;

function formatTimestamp(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function SkeletonItem() {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <div className="w-8 h-8 rounded-full bg-white/[0.06] animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5 pt-0.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-16 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="h-2 w-6 rounded-full bg-white/[0.04] animate-pulse" />
        </div>
        <div className="h-3 w-3/4 rounded-full bg-white/[0.05] animate-pulse" />
        <div className="h-3 w-1/2 rounded-full bg-white/[0.04] animate-pulse" />
      </div>
    </div>
  );
}

export default function LiveCommentFeed({ comments, isBroadcaster = false, isLoading = false, inline = false }: LiveCommentFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newCommentCount, setNewCommentCount] = useState(0);
  const prevCommentCountRef = useRef(comments.length);
  const prefersReducedMotion = useReducedMotion();
  const [, setTick] = useState(0);

  useEffect(() => {
    const diff = comments.length - prevCommentCountRef.current;
    prevCommentCountRef.current = comments.length;

    if (diff > 0 && !isAtBottom) {
      setNewCommentCount((c) => c + diff);
    }
  }, [comments.length, isAtBottom]);

  useEffect(() => {
    if (isAtBottom && containerRef.current) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
      setNewCommentCount(0);
    }
  }, [comments, isAtBottom]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_BOTTOM_THRESHOLD;
    setIsAtBottom(atBottom);
    if (atBottom) setNewCommentCount(0);
  }, []);

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    setNewCommentCount(0);
  };

  const visible = comments.slice(-VISIBLE_COUNT);

  return (
    <div className={`relative flex flex-col h-full ${inline ? '' : ''}`} role="log" aria-live="polite" aria-label="Live comments">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`flex-1 flex flex-col overflow-y-auto scrollbar-none ${inline ? 'px-2 py-1.5 gap-0.5' : 'px-3 sm:px-4 py-2 sm:py-3'}`}
      >
        {/* Loading skeleton */}
        {isLoading && visible.length === 0 && (
          <div className="space-y-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && visible.length === 0 && (
          <div className={`flex-1 flex flex-col items-center justify-center gap-3 ${inline ? 'py-4' : 'py-10'}`}>
            {!inline && (
              <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center">
                <MessageCircle size={24} className="text-white/15" />
              </div>
            )}
            <div className="text-center space-y-1">
              <p className={`${inline ? 'text-[11px]' : 'text-[13px]'} text-white/30 font-medium`}>
                {isBroadcaster ? 'Waiting for comments...' : 'No comments yet'}
              </p>
              {!inline && (
                <p className="text-[11px] text-white/15">
                  {isBroadcaster ? 'Comments from viewers will appear here' : 'Be the first to say something'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Comment list */}
        <AnimatePresence initial={false}>
          {visible.map((item) => {
            if (item.type === 'system') {
              return (
                <motion.div
                  key={item.id}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: prefersReducedMotion ? 0.05 : 0.2, ease: 'easeOut' }}
                  className="flex justify-center py-1.5"
                  role="status"
                  aria-label={item.text}
                >
                  <span className="text-[11px] text-white/30 bg-white/[0.05] backdrop-blur-sm rounded-full px-3 py-1 font-medium">
                    {item.text}
                  </span>
                </motion.div>
              );
            }

            return <CommentItem key={item.id} comment={item} inline={inline} />;
          })}
        </AnimatePresence>
      </div>

      {/* New comments indicator */}
      <AnimatePresence>
        {!isAtBottom && newCommentCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToBottom}
            aria-label={`Scroll to ${newCommentCount} new comments`}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-3.5 py-1.5 text-[11px] text-white font-semibold hover:bg-white/25 transition-colors shadow-lg"
          >
            <ChevronDown size={14} />
            {newCommentCount} new {newCommentCount === 1 ? 'comment' : 'comments'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

const CommentItem = memo(function CommentItem({ comment, inline = false }: { comment: Comment; inline?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const needsTruncation = comment.text.length > TRUNCATE_LENGTH;
  const displayText = needsTruncation && !expanded ? comment.text.slice(0, TRUNCATE_LENGTH) + '...' : comment.text;

  if (inline) {
    return (
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
        transition={{ duration: prefersReducedMotion ? 0.05 : 0.2, ease: 'easeOut' }}
        className="flex items-center gap-1.5"
      >
        <span className="text-[12px] font-bold text-white/90 shrink-0">{comment.userName}</span>
        <span className="text-[12px] text-white/70 truncate">{comment.text}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
      transition={{ duration: prefersReducedMotion ? 0.05 : 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-start gap-2.5 py-2"
    >
      {/* Avatar */}
      {comment.userAvatar ? (
        <img
          src={comment.userAvatar}
          alt=""
          className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/10"
          loading="lazy"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
          {comment.userName?.[0]?.toUpperCase() || '?'}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[12px] font-bold text-white/90 leading-none truncate max-w-[160px]">
            {comment.userName}
          </span>
          <span className="text-[10px] text-white/20 leading-none shrink-0 tabular-nums">
            {formatTimestamp(comment.timestamp)}
          </span>
        </div>

        <div className="flex items-start gap-2">
          <p className="text-[13px] text-white/70 leading-[1.4] whitespace-pre-wrap break-words flex-1">
            {displayText}
          </p>

          {/* Like button */}
          <button
            onClick={() => setLiked((v) => !v)}
            className="shrink-0 mt-0.5 p-0.5 active:scale-90 transition-transform"
            aria-label={liked ? 'Unlike comment' : 'Like comment'}
          >
            <Heart
              size={12}
              className={`transition-colors ${liked ? 'text-red-400 fill-red-400' : 'text-white/15 hover:text-white/30'}`}
            />
          </button>
        </div>

        {needsTruncation && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Show less' : 'See more of this comment'}
            className="text-[10px] text-white/25 hover:text-white/50 mt-0.5 transition-colors font-medium"
          >
            {expanded ? 'Show less' : 'See more'}
          </button>
        )}
      </div>
    </motion.div>
  );
});
