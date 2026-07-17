import { useState, useEffect } from "react";
import { ShoppingBag, ExternalLink, Package, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { getStylistProducts } from "@/api/products";

interface Product {
  _id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  description?: string;
}

interface ProductShelfProps {
  stylistId: string;
  visible: boolean;
  className?: string;
}

export function ProductShelf({ stylistId, visible, className }: ProductShelfProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !stylistId) return;
    setLoading(true);
    setError(null);
    getStylistProducts(stylistId)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.products ?? [];
        setProducts(list.filter((p: any) => p.isActive !== false).slice(0, 8));
      })
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, [stylistId, visible]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700/40">
        <ShoppingBag size={14} className="text-brand-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Shop Products
        </h3>
        <span className="ml-auto text-[10px] text-gray-400 font-medium">
          {products.length} items
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-center py-6 px-4">
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 px-4">
          <Package size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-400">No products available yet</p>
        </div>
      ) : (
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const isLowStock = product.stock <= 5 && product.stock > 0;
  const isOutOfStock = product.stock === 0;

  return (
    <div
      className={cn(
        "rounded-xl border transition-all overflow-hidden",
        isOutOfStock
          ? "border-gray-100 dark:border-gray-700/40 opacity-60"
          : "border-gray-100 dark:border-gray-700/40 hover:border-brand-200 dark:hover:border-brand-800/40 hover:shadow-md",
      )}
    >
      <div className="relative aspect-square bg-gray-50 dark:bg-gray-800/50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={20} className="text-gray-300 dark:text-gray-600" />
          </div>
        )}
        {isLowStock && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[8px] font-bold">
            Only {product.stock} left
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-gray-500 text-white text-[8px] font-bold">
            Sold Out
          </span>
        )}
      </div>
      <div className="p-2.5">
        <h4 className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 truncate">
          {product.name}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
            GHS {product.price.toLocaleString()}
          </span>
          {!isOutOfStock && (
            <button
              className="p-1 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
              aria-label={`View ${product.name}`}
            >
              <ExternalLink size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
