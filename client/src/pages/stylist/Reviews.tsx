import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Loader2, AlertCircle, MessageSquare, X } from 'lucide-react';
import { getStylistReviews } from '../../api/reviews';
import { getMyStylistProfile } from '../../api/stylists';

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const profile = await getMyStylistProfile();
      const data = await getStylistReviews(profile.id);
      setReviews(data || []);
    } catch { setError('Failed to load reviews'); } finally { setLoading(false); }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
    ));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display mb-1">Reviews</h1>
      <p className="text-text-secondary dark:text-text-dark-secondary text-sm mb-6">Client feedback and ratings</p>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-2xl bg-error/10 border border-error/20 text-error text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div>
          <div className="h-7 w-24 skeleton-pulse rounded mb-1" />
          <div className="h-4 w-48 skeleton-pulse rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 p-4 skeleton-pulse h-28" />
            ))}
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-text-muted dark:text-text-dark-muted">
          <MessageSquare className="w-12 h-12 mx-auto mb-3" />
          <p>No reviews yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map(review => (
            <div key={review._id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-medium shrink-0">
                    {review.clientId?.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-text-primary dark:text-text-dark-primary truncate">{review.clientId?.name || 'Anonymous'}</h3>
                    <div className="flex items-center gap-1 mt-0.5">{renderStars(review.rating)}</div>
                  </div>
                </div>
                <span className="text-xs text-text-muted dark:text-text-dark-muted shrink-0">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              {review.comment && (
                <p className="mt-3 text-sm text-text-secondary dark:text-text-dark-secondary line-clamp-3">{review.comment}</p>
              )}
              {review.images?.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {review.images.map((img: string, i: number) => (
                    <img key={i} src={img} alt="Review" className="w-16 h-16 object-cover rounded-xl shrink-0" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
