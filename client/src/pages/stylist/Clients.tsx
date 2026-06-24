import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Star, Loader2, MessageSquare, DollarSign, Calendar, X, Users,
  Mail, Phone, MapPin, ShoppingBag, Check, Clock, ArrowRight, RefreshCw,
} from 'lucide-react';
import { logger } from '../../utils/logger';
import { getMyClients, getClientDetail, updateClient } from '../../api/clients';
import { createConversation } from '../../api/conversations';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';

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
  const [detailError, setDetailError] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');
  const navigate = useNavigate();

  const closeDetail = useCallback(() => {
    setSelected(null);
    setDetailData(null);
    setDetailError(false);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected) closeDetail();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selected, closeDetail]);

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
    setDetailError(false);
    try {
      const data = await getClientDetail(client._id);
      setDetailData(data);
      setEditNotes(data.client.notes || '');
      setEditTags((data.client.tags || []).join(', '));
    } catch {
      setDetailError(true);
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-2 sm:px-0">
      <div className="flex flex-col xs:flex-row xs:items-end justify-between gap-2 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">My Clients</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">View and manage your client relationships</p>
        </div>
      </div>

      <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-text-dark-muted" />
          <input type="text" placeholder="Search clients..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field text-sm w-full pl-9" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="input-field text-sm w-full xs:w-auto min-w-0 xs:min-w-[140px]">
          <option value="visits">Most Visits</option>
          <option value="recent">Most Recent</option>
          <option value="spent">Highest Spent</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full skeleton-pulse shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-4 w-28 skeleton-pulse" />
                  <Skeleton className="h-3 w-36 skeleton-pulse" />
                </div>
              </div>
              <Skeleton className="h-4 w-48 skeleton-pulse" />
              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/40">
                <Skeleton className="h-9 flex-1 rounded-xl skeleton-pulse" />
                <Skeleton className="h-9 w-9 rounded-xl skeleton-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-50 dark:bg-surface-dark-tertiary flex items-center justify-center mb-4">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-text-muted" />
          </div>
          <p className="text-sm sm:text-base font-semibold text-text-primary mb-1">No clients yet</p>
          <p className="text-xs sm:text-sm text-text-muted max-w-xs">Clients will appear here after their first booking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {clients.map(client => (
            <Card key={client._id} hover padding="md" className="relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-stylist-500 to-stylist-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                    {client.userId?.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-body-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">{client.userId?.name}</h3>
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
              <div className="mt-2.5 sm:mt-3 flex items-center gap-2 sm:gap-3 text-caption text-text-muted dark:text-text-dark-secondary flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 shrink-0" /> {client.totalVisits} visit{client.totalVisits !== 1 ? 's' : ''}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 shrink-0" /> GH₵{client.totalSpent.toFixed(0)}</span>
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
                <Button variant="secondary" size="sm" onClick={() => openDetail(client)} className="flex-1 h-9 text-xs sm:text-sm">
                  View Profile
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleMessage(client.userId?._id)} aria-label="Send message" className="h-9 w-9 sm:w-auto">
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={closeDetail}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-xl lg:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-surface-dark-secondary rounded-t-2xl sm:rounded-2xl shadow-modal animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* ─── Loading State ─── */}
            {detailLoading && (
              <div className="overflow-y-auto flex-1 min-h-0 p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full skeleton-pulse shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <Skeleton className="h-5 w-40 skeleton-pulse" />
                    <Skeleton className="h-4 w-56 skeleton-pulse" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2 p-4 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl">
                      <Skeleton className="h-6 w-12 skeleton-pulse mx-auto" />
                      <Skeleton className="h-3 w-16 skeleton-pulse mx-auto" />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32 skeleton-pulse" />
                  <Skeleton className="h-20 w-full skeleton-pulse rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36 skeleton-pulse" />
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-14 w-full skeleton-pulse rounded-xl" />
                  ))}
                </div>
              </div>
            )}

            {/* ─── Error State ─── */}
            {detailError && !detailLoading && (
              <div className="overflow-y-auto flex-1 min-h-0 flex flex-col items-center justify-center py-20 sm:py-24 px-6 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
                  <X className="w-7 h-7 sm:w-8 sm:h-8 text-error" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-text-primary dark:text-text-dark-primary mb-1">Failed to load details</h3>
                <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-6 max-w-xs">Something went wrong while fetching client information. Please try again.</p>
                <Button onClick={() => openDetail(selected)} className="h-12 px-6 text-sm font-semibold gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              </div>
            )}

            {/* ─── Content State ─── */}
            {!detailLoading && !detailError && detailData && (
              <>
                <div className="overflow-y-auto flex-1 min-h-0">
                  {/* ─── Hero Header ─── */}
                  <div className="relative bg-gradient-to-br from-stylist-600 via-stylist-500 to-indigo-500 dark:from-stylist-800 dark:via-stylist-700 dark:to-indigo-800 px-5 sm:px-7 pt-6 sm:pt-8 pb-8 sm:pb-10">
                    <button
                      onClick={closeDetail}
                      className="absolute top-3 sm:top-4 right-3 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all flex items-center justify-center"
                      aria-label="Close detail view"
                    >
                      <X size={20} />
                    </button>
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl sm:text-2xl font-bold ring-4 ring-white/30 shadow-lg">
                          {detailData.client?.userId?.name?.charAt(0) || '?'}
                        </div>
                        {detailData.client?.tags?.length > 0 && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white dark:border-stylist-800 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-white font-display truncate">
                          {detailData.client?.userId?.name}
                        </h2>
                        <p className="text-sm text-white/80 mt-0.5 truncate">{detailData.client?.userId?.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4">
                      {detailData.client?.userId?.phone && (
                        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white/90 bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          {detailData.client?.userId?.phone}
                        </span>
                      )}
                      {detailData.client?.userId?.location && (
                        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white/90 bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {detailData.client?.userId?.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-5 sm:px-7 pt-0 pb-6 sm:pb-8">
                    {/* ─── Quick Stats ─── */}
                    <div className="grid grid-cols-3 gap-3 -mt-4 sm:-mt-5 relative z-10">
                      <div className="bg-white dark:bg-surface-dark-secondary rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-card border border-gray-100 dark:border-gray-700/40">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-stylist-50 dark:bg-stylist-950/30 flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-stylist-500" />
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">
                          {detailData.client?.totalVisits || 0}
                        </p>
                        <p className="text-[11px] sm:text-xs text-text-muted dark:text-text-dark-muted font-medium">Visits</p>
                      </div>
                      <div className="bg-white dark:bg-surface-dark-secondary rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-card border border-gray-100 dark:border-gray-700/40">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">
                          GH₵{(detailData.client?.totalSpent || 0).toFixed(0)}
                        </p>
                        <p className="text-[11px] sm:text-xs text-text-muted dark:text-text-dark-muted font-medium">Spent</p>
                      </div>
                      <div className="bg-white dark:bg-surface-dark-secondary rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-card border border-gray-100 dark:border-gray-700/40">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">
                          {detailData.bookings?.length || 0}
                        </p>
                        <p className="text-[11px] sm:text-xs text-text-muted dark:text-text-dark-muted font-medium">Bookings</p>
                      </div>
                    </div>

                    {/* ─── Profile Information ─── */}
                    <div className="mt-5 sm:mt-6">
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="w-5 h-0.5 rounded-full bg-stylist-400" />
                        <h3 className="text-sm sm:text-base font-bold text-text-primary dark:text-text-dark-primary font-display">Profile Information</h3>
                      </div>
                      <div className="bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl sm:rounded-2xl divide-y divide-gray-100 dark:divide-gray-700/30">
                        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white dark:bg-surface-dark-secondary flex items-center justify-center shrink-0 shadow-sm">
                            <Mail className="w-4 h-4 text-text-muted dark:text-text-dark-muted" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-text-muted dark:text-text-dark-muted font-medium">Email</p>
                            <p className="text-sm sm:text-body-sm text-text-primary dark:text-text-dark-primary truncate">{detailData.client?.userId?.email || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white dark:bg-surface-dark-secondary flex items-center justify-center shrink-0 shadow-sm">
                            <Phone className="w-4 h-4 text-text-muted dark:text-text-dark-muted" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-text-muted dark:text-text-dark-muted font-medium">Phone</p>
                            <p className="text-sm sm:text-body-sm text-text-primary dark:text-text-dark-primary">{detailData.client?.userId?.phone || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white dark:bg-surface-dark-secondary flex items-center justify-center shrink-0 shadow-sm">
                            <MapPin className="w-4 h-4 text-text-muted dark:text-text-dark-muted" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-text-muted dark:text-text-dark-muted font-medium">Location</p>
                            <p className="text-sm sm:text-body-sm text-text-primary dark:text-text-dark-primary">{detailData.client?.userId?.location || '—'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─── Notes & Tags ─── */}
                    <div className="mt-5 sm:mt-6">
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="w-5 h-0.5 rounded-full bg-stylist-400" />
                        <h3 className="text-sm sm:text-base font-bold text-text-primary dark:text-text-dark-primary font-display">Notes & Tags</h3>
                      </div>
                      <div className="bg-white dark:bg-surface-dark-secondary rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700/40 shadow-sm overflow-hidden">
                        <div className="p-4 sm:p-5 space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider mb-1.5">Notes</label>
                            <textarea
                              value={editNotes}
                              onChange={e => setEditNotes(e.target.value)}
                              placeholder="Add private notes about this client..."
                              className="input-field text-sm min-h-[80px] sm:min-h-[96px] resize-none w-full"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider mb-1.5">Tags</label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {(editTags.split(',').map(t => t.trim()).filter(Boolean) || detailData.client?.tags || []).map((tag: string, i: number) => (
                                <span key={i} className="inline-flex items-center gap-1 text-caption bg-stylist-50 dark:bg-stylist-950/30 text-stylist-600 dark:text-stylist-400 px-2.5 py-1 rounded-lg font-medium border border-stylist-100 dark:border-stylist-900/30">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <input
                              value={editTags}
                              onChange={e => setEditTags(e.target.value)}
                              placeholder="e.g. bridal, repeat, vip"
                              className="input-field text-sm w-full"
                            />
                            <p className="text-caption text-text-muted dark:text-text-dark-muted mt-1">Separate tags with commas</p>
                          </div>
                        </div>
                        <div className="px-4 sm:px-5 py-3 bg-gray-50 dark:bg-surface-dark-tertiary border-t border-gray-100 dark:border-gray-700/30">
                          <Button
                            onClick={handleSaveNotes}
                            className="w-full h-11 sm:h-12 text-sm font-semibold gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* ─── Booking History ─── */}
                    <div className="mt-5 sm:mt-6">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-0.5 rounded-full bg-stylist-400" />
                          <h3 className="text-sm sm:text-base font-bold text-text-primary dark:text-text-dark-primary font-display">Booking History</h3>
                        </div>
                        <Badge variant="stylist" pill>{detailData.bookings?.length || 0} booking{(detailData.bookings?.length || 0) !== 1 ? 's' : ''}</Badge>
                      </div>
                      <div className="space-y-2">
                        {detailData.bookings?.length > 0 ? (
                          detailData.bookings.map((b: any, i: number) => (
                            <motion.div
                              key={b._id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03, duration: 0.2 }}
                              className="group flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-surface-dark-secondary rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700/40 shadow-sm hover:shadow-card hover:border-gray-200 dark:hover:border-gray-600/50 transition-all duration-200 gap-3"
                            >
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-stylist-50 dark:bg-stylist-950/30 flex items-center justify-center shrink-0 mt-0.5">
                                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-stylist-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm sm:text-body-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">
                                      {b.serviceId?.name || 'Service'}
                                    </p>
                                    {b.serviceId?.price && (
                                      <span className="text-caption font-semibold text-text-muted dark:text-text-dark-muted shrink-0">GH₵{b.serviceId.price}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <Clock className="w-3 h-3 text-text-muted dark:text-text-dark-muted shrink-0" />
                                    <p className="text-caption text-text-muted dark:text-text-dark-muted truncate">
                                      {new Date(b.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                      {' · '}
                                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  b.status === 'completed' ? 'success' :
                                  b.status === 'cancelled' ? 'error' : 'warning'
                                }
                                pill
                                dot
                              >
                                {b.status}
                              </Badge>
                            </motion.div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 sm:py-12 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl sm:rounded-2xl">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-surface-dark-secondary flex items-center justify-center mb-3 shadow-sm">
                              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-text-muted dark:text-text-dark-muted" />
                            </div>
                            <p className="text-sm sm:text-body-sm font-semibold text-text-primary dark:text-text-dark-primary mb-0.5">No booking history yet</p>
                            <p className="text-caption text-text-muted dark:text-text-dark-muted">Bookings will appear once the client schedules a visit</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Bottom Action Bar (always visible) ─── */}
                <div className="shrink-0 bg-white dark:bg-surface-dark-secondary border-t border-gray-100 dark:border-gray-700/40 px-5 sm:px-7 py-3 sm:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleMessage(detailData.client?.userId?._id)}
                      className="flex-1 h-12 sm:h-12 text-sm font-semibold gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => navigate('/stylist/bookings')}
                      className="flex-1 h-12 sm:h-12 text-sm font-semibold gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      View Bookings
                      <ArrowRight className="w-4 h-4 hidden sm:block" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
