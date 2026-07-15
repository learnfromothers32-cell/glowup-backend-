// src/pages/consumer/components/ServicePage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Star, Users, BadgeCheck } from "lucide-react";
import { getStylists } from "../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";

export default function ServicePage() {
  const { service } = useParams<{ service: string }>();
  const navigate = useNavigate();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStylists()
      .then(({ stylists: all }) => {
        if (service) {
          const filtered = all.filter(
            (s) => s.category?.toLowerCase() === service.toLowerCase(),
          );
          setStylists(filtered);
        } else {
          setStylists(all);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [service]);

  const categoryName = service
    ? service.charAt(0).toUpperCase() + service.slice(1)
    : "All";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-dark flex items-center justify-center">
        <div className="skeleton-pulse w-10 h-10 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <div className="max-w-5xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary mb-6"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-3xl font-bold text-text-primary dark:text-text-dark-primary mb-2">
          {categoryName} Stylists
        </h1>
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-8">
          {stylists.length} stylist{stylists.length !== 1 && "s"} found
        </p>

        {stylists.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-text-muted dark:text-text-dark-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">
              No stylists in this category yet
            </h3>
            <p className="text-sm text-text-muted dark:text-text-dark-muted mt-1">
              Try browsing all stylists or another category.
            </p>
            <button
              onClick={() => navigate("/app")}
              className="mt-4 text-brand-500 underline text-sm"
            >
              Browse all stylists
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stylists.map((stylist, i) => (
              <motion.div
                key={stylist.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/app/stylist/${stylist.id}`}
                  className="group block card-hover"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gray-100 dark:bg-surface-dark-tertiary">
                    {stylist.image ? (
                      <img
                        src={stylist.image}
                        alt={stylist.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-text-muted dark:text-text-dark-muted">
                        {stylist.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <Star size={10} fill="#fbbf24" stroke="#fbbf24" />
                      <span className="text-xs font-bold text-white">
                        {stylist.rating}
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">
                        {stylist.name}
                      </p>
                      {stylist.isVerified && (
                        <BadgeCheck size={13} className="text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted dark:text-text-dark-muted">
                      <MapPin size={9} />
                      {getLocationString(stylist.location)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {stylist.services?.slice(0, 3).map((svc, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-gray-50 dark:bg-surface-dark-tertiary text-[10px] text-text-secondary dark:text-text-dark-secondary"
                        >
                          {typeof svc === "string" ? svc : svc.name}
                        </span>
                      ))}
                    </div>
                    <div className="btn-primary btn-sm mt-3 w-full text-center">
                      View Profile
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
