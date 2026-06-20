import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Phone, Mail, Calendar, Star, Tag, Loader2, MessageSquare, DollarSign } from 'lucide-react';
import { logger } from '../../utils/logger';
import { getMyClients, getClientDetail, updateClient } from '../../api/clients';
import { createConversation } from '../../api/conversations';
import { useNavigate } from 'react-router-dom';

interface ClientUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  location?: string;
}

interface StylistClient {
  _id: string;
  userId: ClientUser;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string | null;
  favorite: boolean;
  tags: string[];
  notes: string;
}

export default function Clients() {
  const [clients, setClients] = useState<StylistClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('visits');
  const [selected, setSelected] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, [search, sort]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getMyClients({ search: search || undefined, sort });
      setClients(data);
    } catch {
      logger.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (client: StylistClient) => {
    setSelected(client);
    setDetailLoading(true);
    try {
      const data = await getClientDetail(client._id);
      setDetailData(data);
      setEditNotes(data.client.notes || '');
      setEditTags((data.client.tags || []).join(', '));
    } catch {
      logger.error('Failed to load client detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    await updateClient(selected._id, {
      notes: editNotes,
      tags: editTags.split(',').map((t: string) => t.trim()).filter(Boolean)
    });
    loadClients();
  };

  const handleMessage = async (clientId: string) => {
    try {
      const conv = await createConversation({ clientId });
      navigate('/stylist/messages');
    } catch {
      logger.error('Failed to create conversation');
    }
  };

  const toggleFavorite = async (client: StylistClient) => {
    await updateClient(client._id, { favorite: !client.favorite });
    loadClients();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display mb-1">My Clients</h1>
      <p className="text-[#7A7168] text-sm mb-6">View and manage your client relationships</p>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search clients..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#E8E0D8] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355]" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355]">
          <option value="visits">Most Visits</option>
          <option value="recent">Most Recent</option>
          <option value="spent">Highest Spent</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#7A7168]" /></div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UsersIcon className="w-12 h-12 mx-auto mb-3" />
          <p>No clients yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => (
            <motion.div key={client._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#8B7355] flex items-center justify-center text-white text-sm font-medium">
                    {client.userId?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1A1A1A]">{client.userId?.name}</h3>
                    <p className="text-xs text-gray-400">{client.userId?.email}</p>
                  </div>
                </div>
                <button onClick={() => toggleFavorite(client)} className={`p-1 rounded transition-colors ${client.favorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}>
                  <Star className="w-4 h-4" fill={client.favorite ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1 shrink-0"><Calendar className="w-3 h-3" /> {client.totalVisits} visits</span>
                <span className="flex items-center gap-1 shrink-0"><DollarSign className="w-3 h-3" /> GH₵{client.totalSpent.toFixed(0)}</span>
                {client.lastVisit && (
                  <span className="text-gray-400 shrink-0">Last: {new Date(client.lastVisit).toLocaleDateString()}</span>
                )}
              </div>
              {client.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {client.tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-[#FAF8F4] text-[#7A7168] px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button onClick={() => openDetail(client)} className="flex-1 text-xs bg-[#FAF8F4] text-[#1A1A1A] py-1.5 rounded hover:bg-[#F0ECE6] transition-colors">View Profile</button>
                <button onClick={() => handleMessage(client.userId?._id)} className="px-3 text-xs bg-[#FAF8F4] text-[#7A7168] py-1.5 rounded hover:bg-[#F0ECE6] transition-colors">
                  <MessageSquare className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selected && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            {detailLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#8B7355] flex items-center justify-center text-white text-lg font-medium">
                      {detailData.client?.userId?.name?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1A1A1A]">{detailData.client?.userId?.name}</h2>
                      <p className="text-sm text-gray-500">{detailData.client?.userId?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6">
                  <div className="bg-[#FAF8F4] rounded-lg p-3 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-[#1A1A1A]">{detailData.client?.totalVisits || 0}</p>
                    <p className="text-xs text-gray-500">Total Visits</p>
                  </div>
                  <div className="bg-[#FAF8F4] rounded-lg p-3 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-[#1A1A1A]">GH₵{(detailData.client?.totalSpent || 0).toFixed(0)}</p>
                    <p className="text-xs text-gray-500">Total Spent</p>
                  </div>
                  <div className="bg-[#FAF8F4] rounded-lg p-3 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-[#1A1A1A]">{detailData.bookings?.length || 0}</p>
                    <p className="text-xs text-gray-500">Bookings</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Notes</label>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-[#8B7355]" />
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Tags (comma separated)</label>
                  <input value={editTags} onChange={e => setEditTags(e.target.value)}
                    className="w-full border border-[#E8E0D8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355]" />
                </div>
                <button onClick={handleSaveNotes} className="w-full bg-[#1A1A1A] text-white py-2 rounded-lg text-sm hover:bg-[#333] transition-colors">Save Notes</button>

                <h3 className="font-medium text-[#1A1A1A] mt-6 mb-3">Booking History</h3>
                <div className="space-y-2">
                  {detailData.bookings?.map((b: any) => (
                    <div key={b._id} className="flex items-center justify-between p-3 bg-[#FAF8F4] rounded-lg gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A] truncate">{b.serviceId?.name || 'Service'}</p>
                        <p className="text-xs text-gray-500 truncate">{new Date(b.startTime).toLocaleDateString()} at {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${b.status === 'completed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                  {(!detailData.bookings || detailData.bookings.length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-4">No booking history</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}
