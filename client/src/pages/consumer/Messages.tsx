import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Send, MessageSquare, ChevronLeft, Phone, ArrowLeft } from 'lucide-react';
import { logger } from '../../utils/logger';
import { getMyConversations, getConversationMessages, sendMessage, getSocketConversationUrl } from '../../api/conversations';
import { getAccessToken } from '../../api/axios';
import { io, Socket } from 'socket.io-client';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';

interface Conversation {
  _id: string;
  stylistId: { _id: string; name: string; image?: string };
  lastMessage?: { content: string; senderId: string; createdAt: string };
  unreadClient: number;
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

export default function ConsumerMessages() {
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
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    const convId = (location.state as { conversationId?: string })?.conversationId;
    if (convId && conversations.length > 0 && !activeChat) {
      const exists = conversations.find(c => c._id === convId);
      if (exists) {
        openChat(convId);
      }
      window.history.replaceState({}, document.title);
    }
  }, [conversations, location.state]);

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
    c.stylistId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeConv = conversations.find(c => c._id === activeChat);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="lg:hidden p-2 -ml-2 rounded-xl text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary">Messages</h1>
      </div>

      <div className="flex h-[calc(100%-4rem)] rounded-2xl overflow-hidden bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-600 shadow-md">
        {/* Conversation List */}
        <div className={`w-80 flex flex-col border-r border-gray-200 dark:border-gray-600 ${activeChat ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-text-dark-muted" />
              <input type="text" placeholder="Search conversations..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm input-field"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full skeleton-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 skeleton-pulse rounded" />
                      <div className="h-2.5 w-48 skeleton-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-sm text-text-muted dark:text-text-dark-muted">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-text-muted dark:text-text-dark-muted" />
                No conversations yet
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button key={conv._id} onClick={() => openChat(conv._id)}
                  className={`w-full text-left p-3 transition-colors border-b border-gray-200 dark:border-gray-600 ${activeChat === conv._id ? 'bg-brand-50 dark:bg-brand-950/20' : 'hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary'}`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={conv.stylistId?.name} src={conv.stylistId?.image} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold truncate text-text-primary dark:text-text-dark-primary">{conv.stylistId?.name}</p>
                        {conv.lastMessage && (
                          <span className="text-xs shrink-0 text-text-muted dark:text-text-dark-muted">
                            {new Date(conv.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadClient > 0 ? 'text-text-secondary dark:text-text-dark-secondary font-medium' : 'text-text-muted dark:text-text-dark-muted'}`}>
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                    {conv.unreadClient > 0 && (
                      <span className="w-5 h-5 text-white text-xs rounded-full flex items-center justify-center shrink-0 font-bold bg-brand-500">
                        {conv.unreadClient}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
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
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary">
                <Button variant="ghost" size="sm" icon onClick={() => setActiveChat(null)} className="lg:hidden">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Avatar name={activeConv?.stylistId?.name} src={activeConv?.stylistId?.image} size="md" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{activeConv?.stylistId?.name}</p>
                  <p className="text-xs text-green-500">Online</p>
                </div>
                <Button variant="ghost" size="sm" icon onClick={() => { const p = (activeConv as any)?.stylistId?.phone; if (p) window.open(`tel:${p}`); else alert('No phone number available'); }} className="bg-gray-50 dark:bg-surface-dark-tertiary">
                  <Phone size={15} />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50 dark:bg-surface-dark-tertiary">
                {messages.map(msg => {
                  const isMe = msg.senderRole === 'client';
                  return (
                    <motion.div key={msg._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe
                        ? 'bg-brand-500 text-white rounded-br-md'
                        : 'bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary rounded-bl-md shadow-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1.5 font-medium ${isMe ? 'text-white/60' : 'text-text-muted dark:text-text-dark-muted'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary">
                <div className="flex items-center gap-2">
                  <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Type a message..." rows={1}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm resize-none input-field"
                  />
                  <Button onClick={handleSend} disabled={!input.trim() || sending} loading={sending} icon size="md">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
