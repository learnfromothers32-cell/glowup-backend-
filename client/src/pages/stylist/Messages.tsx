import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Send, Phone, MoreVertical, Loader2, MessageSquare } from "lucide-react";

const T = {
  navy: "#0B1A33",
  ink: "#0A1424",
  inkSoft: "#5A6E8A",
  shadowCard: "0 2px 12px rgba(10,20,40,0.06), 0 0 0 1px rgba(10,20,40,0.04)",
};

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
};

type Message = {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
};

const initialConversations: Conversation[] = [
  { id: "1", name: "Abena Mensah", avatar: "AM", lastMessage: "See you tomorrow at 2pm!", time: "5m ago", unread: 2 },
  { id: "2", name: "Kojo Asante", avatar: "KA", lastMessage: "Can I reschedule my appointment?", time: "2h ago", unread: 0 },
  { id: "3", name: "Esi Boateng", avatar: "EB", lastMessage: "Thank you, it looks amazing!", time: "1d ago", unread: 0 },
];

const threadMessages: Record<string, Message[]> = {
  "1": [
    { id: "m1", sender: "them", text: "Hi! I have a booking tomorrow at 2pm.", time: "3:45 PM" },
    { id: "m2", sender: "me", text: "Perfect, I'll see you then! 😊", time: "3:46 PM" },
    { id: "m3", sender: "them", text: "See you tomorrow at 2pm!", time: "3:47 PM" },
  ],
  "2": [
    { id: "m4", sender: "them", text: "Hi, I have an appointment next week but I need to move it.", time: "1:20 PM" },
    { id: "m5", sender: "them", text: "Can I reschedule my appointment?", time: "1:21 PM" },
  ],
  "3": [
    { id: "m6", sender: "them", text: "Just finished my appointment. I love the new style!", time: "5:00 PM" },
    { id: "m7", sender: "me", text: "So glad you love it! 💇‍♀️", time: "5:02 PM" },
    { id: "m8", sender: "them", text: "Thank you, it looks amazing!", time: "5:05 PM" },
  ],
};

export default function StylistMessages() {
  const [conversations] = useState(initialConversations);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  const openChat = (id: string) => {
    setActiveChat(id);
    setMessages(threadMessages[id] || []);
  };

  const sendMessage = () => {
    if (!input.trim() || !activeChat) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      sender: "me",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: T.ink, fontFamily: "'Playfair Display', serif" }}>
        Messages
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: T.shadowCard }}>
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openChat(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition hover:bg-gray-50 ${
                    activeChat === conv.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                    {conv.avatar}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{conv.name}</span>
                      <span className="text-[10px] text-gray-400">{conv.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {activeChat ? (
            <div className="flex-1 flex flex-col">
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    {conversations.find((c) => c.id === activeChat)?.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {conversations.find((c) => c.id === activeChat)?.name}
                    </p>
                    <p className="text-[10px] text-green-500">Online</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100">
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.sender === "me"
                          ? "bg-gray-900 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-bl-md"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === "me" ? "text-gray-400" : "text-gray-400"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="p-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
