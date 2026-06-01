// src/pages/stylist/Live.tsx
import { motion } from "framer-motion";
import { Video, Users, MessageSquare } from "lucide-react";

const T = {
  canvas: "#FFFFFF",
  ink: "#0A1424",
  inkSoft: "#5A6E8A",
  shadowCard: "0 2px 12px rgba(10,20,40,0.06), 0 0 0 1px rgba(10,20,40,0.04)",
  navy: "#0B1A33",
  green: "#059669",
};

export default function Live() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: T.ink, fontFamily: "'Playfair Display', serif" }}>
        Go Live
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Preview */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: T.canvas, boxShadow: T.shadowCard, minHeight: "400px" }}>
          <div className="flex items-center justify-center h-full text-sm" style={{ color: T.inkSoft }}>
            <Video size={48} />
            <p className="ml-3">Camera preview will appear here</p>
          </div>
        </div>

        {/* Live Chat / Controls */}
        <div className="rounded-2xl p-5" style={{ background: T.canvas, boxShadow: T.shadowCard }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: T.ink }}>Live Chat</h2>
          <div className="h-64 flex items-center justify-center text-xs" style={{ color: T.inkSoft }}>
            <MessageSquare size={32} className="mr-2" /> No messages yet
          </div>
          <button
            className="w-full mt-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            style={{ background: T.green, color: "white", boxShadow: "0 4px 20px rgba(5, 150, 105, 0.3)" }}
          >
            Start Streaming
          </button>
          <div className="flex items-center justify-center gap-1 mt-3 text-xs" style={{ color: T.inkSoft }}>
            <Users size={12} /> 0 viewers
          </div>
        </div>
      </div>
    </div>
  );
}