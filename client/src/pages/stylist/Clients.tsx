import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Loader2, MessageSquare, DollarSign, Calendar, X } from 'lucide-react';
import { logger } from '../../utils/logger';
import { getMyClients, getClientDetail, updateClient } from '../../api/clients';
import { createConversation } from '../../api/conversations';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">My Clients</h1>
          <p className="text-sm text-text-secondary mt-0.5">View and manage your client relationships</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-text-dark-muted" />
          <input type="text" placeholder="Search clients..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field text-sm" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="input-field text-sm w-auto min-w-[140px]">
          <option value="visits">Most Visits</option>
          <option value="recent">Most Recent</option>
          <option value="spent">Highest Spent</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full skeleton-pulse" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28 skeleton-pulse" />
                  <Skeleton className="h-3 w-36 skeleton-pulse" />
                </div>
              </div>
              <Skeleton className="h-4 w-48 skeleton-pulse" />
              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/40">
                <Skeleton className="h-8 flex-1 rounded-xl skeleton-pulse" />
                <Skeleton className="h-8 w-8 rounded-xl skeleton-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-surface-dark-tertiary flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-body-sm font-semibold text-text-primary mb-1">No clients yet</p>
          <p className="text-caption text-text-muted">Clients will appear here after their first booking</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => (
            <Card key={client._id} hover padding="md" className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-gold-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                    {client.userId?.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-body-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">{client.userId?.name}</h3>
                    <p className="text-caption text-text-muted dark:text-text-dark-muted truncate">{client.userId?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(client)}
                  className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                    client.favorite
                      ? 'text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                      : 'text-text-muted hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                  }`}
                  aria-label={client.favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className="w-4 h-4" fill={client.favorite ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3 text-caption text-text-muted dark:text-text-dark-secondary flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {client.totalVisits} visit{client.totalVisits !== 1 ? 's' : ''}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> GH₵{client.totalSpent.toFixed(0)}</span>
                {client.lastVisit && (
                  <span className="text-text-muted dark:text-text-dark-muted">Last {new Date(client.lastVisit).toLocaleDateString()}</span>
                )}
              </div>
              {client.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {client.tags.map((tag, i) => (
                    <span key={i} className="text-caption bg-gray-50 dark:bg-surface-dark-tertiary text-text-secondary px-2 py-0.5 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/40">
                <Button variant="secondary" size="sm" onClick={() => openDetail(client)} className="flex-1">
                  View Profile
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleMessage(client.userId?._id)} aria-label="Send message">
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-modal animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-gold-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                      {detailData.client?.userId?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h2 className="text-h4 text-text-primary dark:text-text-dark-primary">{detailData.client?.userId?.name}</h2>
                      <p className="text-body-sm text-text-secondary dark:text-text-dark-secondary">{detailData.client?.userId?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-gray-50 dark:bg-surface-dark-tertiary rounded-2xl p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary">{detailData.client?.totalVisits || 0}</p>
                    <p className="text-caption text-text-muted dark:text-text-dark-secondary mt-0.5">Total Visits</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-surface-dark-tertiary rounded-2xl p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary">GH₵{(detailData.client?.totalSpent || 0).toFixed(0)}</p>
                    <p className="text-caption text-text-muted dark:text-text-dark-secondary mt-0.5">Total Spent</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-surface-dark-tertiary rounded-2xl p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary">{detailData.bookings?.length || 0}</p>
                    <p className="text-caption text-text-muted dark:text-text-dark-secondary mt-0.5">Bookings</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="label block mb-1.5">Notes</label>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                    className="input-field text-sm min-h-[80px] resize-none" />
                </div>
                <div className="mb-4">
                  <label className="label block mb-1.5">Tags (comma separated)</label>
                  <input value={editTags} onChange={e => setEditTags(e.target.value)}
                    className="input-field text-sm" />
                </div>
                <Button onClick={handleSaveNotes} className="w-full">
                  Save Notes
                </Button>

                <h3 className="text-body-sm font-semibold text-text-primary dark:text-text-dark-primary mt-6 mb-3">Booking History</h3>
                <div className="space-y-2">
                  {detailData.bookings?.length > 0 ? (
                    detailData.bookings.map((b: any) => (
                      <div key={b._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-dark-tertiary rounded-2xl gap-2">
                        <div className="min-w-0">
                          <p className="text-body-sm font-medium text-text-primary dark:text-text-dark-primary truncate">{b.serviceId?.name || 'Service'}</p>
                          <p className="text-caption text-text-muted dark:text-text-dark-muted truncate">
                            {new Date(b.startTime).toLocaleDateString()} at{' '}
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`text-caption px-2 py-1 rounded-xl font-medium shrink-0 ${
                          b.status === 'completed'
                            ? 'bg-success/10 text-success dark:text-success'
                            : b.status === 'cancelled'
                            ? 'bg-error/10 text-error dark:text-error'
                            : 'bg-warning/10 text-warning dark:text-warning'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-body-sm text-text-muted dark:text-text-dark-muted text-center py-4">No booking history</p>
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
