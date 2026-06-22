import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Send, Loader2, MessageSquare, ChevronLeft, Phone } from 'lucide-react';
import { logger } from '../../utils/logger';
import { getMyConversations, getConversationMessages, sendMessage, getSocketConversationUrl } from '../../api/conversations';
import { getAccessToken } from '../../api/axios';
import { io, Socket } from 'socket.io-client';

interface Conversation {
  _id: string;
  clientId: { _id: string; name: string; avatar?: string };
  lastMessage?: { content: string; senderId: string; createdAt: string };
  unreadStylist: number;
  updatedAt: string;
}

interface MessageItem {
  _id: string;
  conversationId: string;
  senderId: { _id: string; name: string; avatar?: string };
  senderRole: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = getAccessToken();

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (activeChat) {
      const s = io(getSocketConversationUrl(), { auth: { token } });
      setSocket(s);
      s.on('connect', () => s.emit('conversation:join', activeChat));
      s.on('message:new', (msg: MessageItem) => setMessages(prev => [...prev, msg]));
      return () => { s.emit('conversation:leave', activeChat); s.disconnect(); };
    }
  }, [activeChat, token]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    try { setConversations(await getMyConversations()); }
    catch { logger.error('Failed to load conversations'); }
    finally { setLoading(false); }
  };

  const openChat = async (id: string) => {
    setActiveChat(id);
    try {
      const data = await getConversationMessages(id);
      setMessages(data.messages);
      loadConversations();
    } catch { logger.error('Failed to load messages'); }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChat || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(activeChat, input.trim());
      setMessages(prev => [...prev, msg]);
      setInput('');
      loadConversations();
    } catch { logger.error('Failed to send'); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const filteredConversations = conversations.filter(c =>
    c.clientId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeConv = conversations.find(c => c._id === activeChat);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-8rem)]">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 font-display text-text-primary dark:text-text-dark-primary">Messages</h1>

      <div className="flex h-[calc(100%-4rem)] rounded-2xl overflow-hidden bg-white dark:bg-surface-dark-secondary shadow-md border border-gray-100 dark:border-gray-700/40">
        {/* ── Conversation List ── */}
        <div className={`w-80 flex flex-col border-r border-gray-100 dark:border-gray-700/40 ${activeChat ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-3 border-b border-gray-100 dark:border-gray-700/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-text-dark-muted" />
              <input type="text" placeholder="Search conversations..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary text-text-primary dark:text-text-dark-primary caret-brand-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-text-muted dark:text-text-dark-muted" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-sm text-text-muted dark:text-text-dark-muted">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-text-muted dark:text-text-dark-muted" />
                No conversations yet
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button key={conv._id} onClick={() => openChat(conv._id)}
                  className={`w-full text-left p-3 transition-colors border-b border-gray-100 dark:border-gray-700/40 ${activeChat === conv._id ? 'bg-brand-50 dark:bg-brand-950/20' : 'bg-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 bg-gradient-to-br from-brand-700 to-brand-900">
                      {conv.clientId?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold truncate text-text-primary dark:text-text-dark-primary">{conv.clientId?.name}</p>
                        {conv.lastMessage && (
                          <span className="text-xs shrink-0 text-text-muted dark:text-text-dark-muted">
                            {new Date(conv.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadStylist > 0 ? 'text-text-secondary dark:text-text-dark-secondary' : 'text-text-muted dark:text-text-dark-muted'}`}>
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                    {conv.unreadStylist > 0 && (
                      <span className="w-5 h-5 text-white text-xs rounded-full flex items-center justify-center shrink-0 font-bold bg-gradient-to-br from-brand-700 to-brand-900">
                        {conv.unreadStylist}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden lg:flex' : 'flex'}`}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center text-text-muted dark:text-text-dark-muted">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gray-50 dark:bg-surface-dark-tertiary">
                  <MessageSquare className="w-7 h-7 text-text-muted dark:text-text-dark-muted" />
                </div>
                <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">Select a conversation</p>
                <p className="text-xs mt-1 text-text-muted dark:text-text-dark-muted">Choose a conversation from the left to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary">
                <button onClick={() => setActiveChat(null)} className="lg:hidden p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors text-text-secondary dark:text-text-dark-secondary">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 bg-gradient-to-br from-brand-700 to-brand-900">
                  {activeConv?.clientId?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{activeConv?.clientId?.name}</p>
                  <p className="text-xs text-success dark:text-success">Online</p>
                </div>
                <button onClick={() => { const p = (activeConv as any)?.clientId?.phone; if (p) window.open(`tel:${p}`); else alert('No phone number available'); }} className="p-2 rounded-xl transition-colors text-text-secondary dark:text-text-dark-secondary bg-gray-50 dark:bg-surface-dark-tertiary">
                  <Phone size={15} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50 dark:bg-surface-dark-tertiary">
                {messages.map(msg => {
                  const isMe = msg.senderRole === 'stylist';
                  return (
                    <motion.div key={msg._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe
                        ? 'rounded-br-md bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md'
                        : 'rounded-bl-md bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary shadow-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1.5 font-medium ${isMe ? 'opacity-60' : 'text-text-muted dark:text-text-dark-muted'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary">
                <div className="flex items-center gap-2">
                  <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Type a message..." rows={1}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 transition-all border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary text-text-primary dark:text-text-dark-primary caret-brand-500"
                  />
                  <button onClick={handleSend} disabled={!input.trim() || sending}
                    className="p-2.5 rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-brand-700 to-brand-900 shadow-md">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
