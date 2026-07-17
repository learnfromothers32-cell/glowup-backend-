import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { MessageSquare, ShoppingBag, CalendarCheck, Heart, Flame, Sparkles, Reply, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useLiveChat } from "../hooks/useLiveChat";
import type { ChatMessage } from "@/domain/live/live.types";

interface ChatPanelProps {
  onOpenBooking?: (serviceId?: string) => void;
  onOpenProduct?: (productId: string) => void;
  className?: string;
}

export function ChatPanel({ onOpenBooking, onOpenProduct, className }: ChatPanelProps) {
  const {
    messages,
    hasMoreHistory,
    isLoadingHistory,
    pinnedMessageId,
    sendMessage,
    loadHistory,
  } = useLiveChat();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const pinnedMessage = pinnedMessageId
    ? messages.find((m) => m.id === pinnedMessageId || m.messageId === pinnedMessageId)
    : null;

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 80);

    if (scrollTop < 40 && hasMoreHistory && !isLoadingHistory) {
      const prevHeight = scrollRef.current.scrollHeight;
      loadHistory();
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
        }
      });
    }
  }, [hasMoreHistory, isLoadingHistory, loadHistory]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text, replyTo?.messageId);
    setInput("");
    setReplyTo(null);
  }, [input, sendMessage, replyTo]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape") {
        setReplyTo(null);
      }
    },
    [handleSend],
  );

  const quickReactions = useMemo(() => [
    { emoji: "❤️", label: "Love" },
    { emoji: "🔥", label: "Fire" },
    { emoji: "✨", label: "Glow" },
    { emoji: "👏", label: "Clap" },
  ], []);

  const handleQuickReaction = useCallback((emoji: string) => {
    sendMessage(emoji);
  }, [sendMessage]);

  const canSend = input.trim().length > 0;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white dark:bg-gray-900",
        "border-l border-gray-100 dark:border-gray-700/40",
        className,
      )}
      role="log"
      aria-label="Live chat"
      aria-live="polite"
    >
      {/* Pinned message */}
      {pinnedMessage && (
        <div
          className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-800/30"
          role="status"
          aria-label="Pinned message"
        >
          <p className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide mb-0.5">
            📌 Pinned
          </p>
          <p className="text-xs text-yellow-800 dark:text-yellow-200 truncate">
            {pinnedMessage.content}
          </p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
        role="log"
        aria-label="Chat messages"
      >
        {isLoadingHistory && (
          <div className="text-center py-2" role="status" aria-label="Loading chat history">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading history...
            </span>
          </div>
        )}

        {!isLoadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare size={24} className="text-gray-300 dark:text-gray-600 mb-2" aria-hidden="true" />
            <p className="text-xs text-gray-400 dark:text-gray-500">No messages yet</p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">Be the first to say something!</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble
            key={msg.id || msg.messageId}
            message={msg}
            prevMessage={i > 0 ? messages[i - 1] : undefined}
            onReply={(m) => setReplyTo(m)}
            onOpenProduct={onOpenProduct}
          />
        ))}
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
          <Reply size={12} className="text-brand-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
              Replying to {replyTo.senderName}
            </p>
            <p className="text-[11px] text-gray-500 truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Cancel reply"
          >
            <X size={12} className="text-gray-400" />
          </button>
        </div>
      )}

      {/* Quick reactions */}
      <div className="px-3 pt-2 flex items-center gap-1">
        {quickReactions.map((r) => (
          <button
            key={r.emoji}
            onClick={() => handleQuickReaction(r.emoji)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
            aria-label={`Send ${r.label} reaction`}
            title={r.label}
          >
            {r.emoji}
          </button>
        ))}
        {onOpenBooking && (
          <button
            onClick={() => onOpenBooking()}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
            aria-label="Book appointment"
          >
            <CalendarCheck size={12} />
            <span className="text-[10px] font-semibold">Book</span>
          </button>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="chat-input" className="sr-only">Type a message</label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyTo ? `Reply to ${replyTo.senderName}...` : "Type a message..."}
            aria-label="Chat message input"
            autoComplete="off"
            className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "p-2 rounded-xl transition-all",
              canSend
                ? "bg-brand-500 text-white hover:bg-brand-600"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed",
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

interface ChatBubbleProps {
  message: ChatMessage;
  prevMessage?: ChatMessage;
  onReply: (message: ChatMessage) => void;
  onOpenProduct?: (productId: string) => void;
}

function ChatBubble({ message, prevMessage, onReply, onOpenProduct }: ChatBubbleProps) {
  const isLocal = message.senderId === "local";
  const isSystem = message.type === "system";
  const isProduct = message.type === "product";
  const isBooking = message.type === "booking";
  const isReaction = message.type === "reaction";

  // Parse product/booking data from content (server sends JSON in content field)
  const parsedData = useMemo(() => {
    if (isProduct || isBooking) {
      try {
        return JSON.parse(message.content);
      } catch {
        return null;
      }
    }
    return null;
  }, [message.content, isProduct, isBooking]);

  // Deduplicate consecutive same-sender messages (hide avatar for consecutive)
  const showAvatar = !isLocal && !isSystem && (
    !prevMessage || prevMessage.senderId !== message.senderId || prevMessage.type === "system"
  );

  if (isSystem) {
    return (
      <div className="text-center py-1" role="status">
        <span className="text-[11px] text-gray-400 dark:text-gray-500 italic">
          {message.content}
        </span>
      </div>
    );
  }

  if (isProduct && parsedData) {
    return (
      <div className="mx-1 my-2" role="article" aria-label={`Product shared: ${parsedData.name}`}>
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-50 to-pink-50 dark:from-brand-900/20 dark:to-pink-900/10 border border-brand-100 dark:border-brand-800/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ShoppingBag size={10} className="text-brand-500" />
            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide">Shared Product</span>
          </div>
          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{parsedData.name}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">GHS {parsedData.price?.toLocaleString()}</p>
          <button
            onClick={() => onOpenProduct?.(parsedData.productId || parsedData._id)}
            className="mt-2 w-full py-1.5 rounded-lg bg-brand-500 text-white text-[10px] font-semibold hover:bg-brand-600 transition-colors"
          >
            View Product
          </button>
        </div>
      </div>
    );
  }

  if (isBooking && parsedData) {
    return (
      <div className="mx-1 my-2" role="article" aria-label={`Booking confirmed: ${parsedData.serviceName}`}>
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CalendarCheck size={10} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Booked</span>
          </div>
          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{parsedData.serviceName}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">with {parsedData.stylistName}</p>
        </div>
      </div>
    );
  }

  if (isReaction) {
    return (
      <div className="text-center py-0.5" role="img" aria-label={`${message.senderName} reacted ${message.content}`}>
        <span className="text-lg">{message.content}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 py-0.5 group",
        isLocal && "flex-row-reverse",
      )}
      role="article"
      aria-label={`${isLocal ? "You" : message.senderName} said: ${message.content}`}
    >
      {showAvatar ? (
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 mt-0.5">
          {message.senderAvatar ? (
            <img src={message.senderAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-400">
              {message.senderName?.[0] || "?"}
            </div>
          )}
        </div>
      ) : (
        !isLocal && <div className="w-6 shrink-0" />
      )}

      <div className={cn("max-w-[80%]", isLocal && "flex flex-col items-end")}>
        {!isLocal && showAvatar && (
          <p className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 mb-0.5 px-1">
            {message.senderName}
          </p>
        )}
        <div
          className={cn(
            "rounded-2xl px-3 py-1.5 relative",
            isLocal
              ? "bg-brand-500 text-white rounded-br-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md",
          )}
        >
          <p className="text-xs leading-relaxed break-words">{message.content}</p>

          {/* Reply button — visible on hover */}
          {!isLocal && (
            <button
              onClick={() => onReply(message)}
              className="absolute -top-1 -right-1 p-0.5 rounded-full bg-gray-200 dark:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Reply to ${message.senderName}`}
            >
              <Reply size={8} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
