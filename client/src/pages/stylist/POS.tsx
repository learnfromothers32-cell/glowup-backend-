import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, AlertCircle, ShoppingCart, X, Search } from 'lucide-react';
import { getMyPosTransactions, createPosTransaction } from '../../api/pos';
import { getMyProducts } from '../../api/products';
import { Button } from '../../components/ui/Button';

export default function POS() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [clientName, setClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cart, setCart] = useState<{ productId: string; name: string; quantity: number; unitPrice: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [t, p] = await Promise.all([getMyPosTransactions(), getMyProducts()]);
      setTransactions(t);
      setProducts(p.filter((pr: any) => pr.isActive));
    } catch { setError('Failed to load'); } finally { setLoading(false); }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.productId === product._id);
      if (existing) {
        return prev.map(c => c.productId === product._id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { productId: product._id, name: product.name, quantity: 1, unitPrice: product.price }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(c => c.productId === productId ? { ...c, quantity } : c));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleCheckout = async () => {
    if (!clientName.trim()) { setError('Client name required'); return; }
    if (cart.length === 0) { setError('Add at least one item'); return; }
    setSaving(true);
    try {
      const items = cart.map(c => ({ type: 'product', itemId: c.productId, name: c.name, quantity: c.quantity, unitPrice: c.unitPrice }));
      await createPosTransaction({ clientName: clientName.trim(), items, paymentMethod, notes: '' });
      setCart([]);
      setClientName('');
      setShowNew(false);
      loadData();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to complete'); } finally { setSaving(false); }
  };

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Point of Sale</h1>
          <p className="text-text-secondary dark:text-text-dark-secondary text-sm mt-1">Process in-person sales and walk-in payments</p>
        </div>
        <Button onClick={() => setShowNew(true)} size="sm">
          <Plus className="w-4 h-4" /> New Sale
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-2xl bg-error/10 border border-error/20 text-error text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-8 w-48 skeleton-pulse rounded" />
          <div className="h-4 w-64 skeleton-pulse rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 p-4 skeleton-pulse h-64" />
            </div>
            <div>
              <div className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 p-4 skeleton-pulse h-64" />
            </div>
          </div>
        </div>
      ) : showNew ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 p-4">
              <h2 className="font-medium text-text-primary dark:text-text-dark-primary mb-3">Products</h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-text-dark-muted" />
                <input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredProducts.length === 0 && <p className="col-span-full text-center text-text-muted dark:text-text-dark-muted py-8 text-sm">No products available</p>}
                {filteredProducts.map((p: any) => (
                  <button key={p._id} onClick={() => addToCart(p)}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors bg-white dark:bg-surface-dark-secondary">
                    <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary truncate">{p.name}</p>
                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary">GH₵{p.price}</p>
                    <p className="text-xs text-text-muted dark:text-text-dark-muted">Stock: {p.stock}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 p-4 sticky top-4">
              <h2 className="font-medium text-text-primary dark:text-text-dark-primary mb-3">Cart</h2>
              <input type="text" placeholder="Client name *" value={clientName} onChange={e => setClientName(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary mb-3" />
              <div className="space-y-2 min-h-[100px]">
                {cart.length === 0 && <p className="text-sm text-text-muted dark:text-text-dark-muted text-center py-4">Cart is empty</p>}
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary dark:text-text-dark-primary truncate">{item.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="text-xs w-5 h-5 bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-600 rounded text-text-primary dark:text-text-dark-primary">-</button>
                        <span className="text-xs w-5 text-center text-text-primary dark:text-text-dark-primary">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="text-xs w-5 h-5 bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-600 rounded text-text-primary dark:text-text-dark-primary">+</button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-text-primary dark:text-text-dark-primary">GH₵{(item.quantity * item.unitPrice).toFixed(0)}</p>
                      <button onClick={() => removeFromCart(item.productId)} className="text-xs text-error">&times;</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 mt-3 pt-3">
                <div className="flex justify-between text-sm font-bold mb-3">
                  <span className="text-text-primary dark:text-text-dark-primary">Total</span>
                  <span className="text-text-primary dark:text-text-dark-primary">GH₵{subtotal.toFixed(0)}</span>
                </div>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary mb-3">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
                <Button onClick={handleCheckout} disabled={saving || cart.length === 0 || !clientName.trim()} loading={saving} className="w-full">
                  Charge GH₵{subtotal.toFixed(0)}
                </Button>
                <Button variant="secondary" onClick={() => setShowNew(false)} className="w-full mt-2">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-text-muted dark:text-text-dark-muted"><ShoppingCart className="w-12 h-12 mx-auto mb-3" /><p>No sales yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-surface-dark-tertiary">
                  <tr><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Receipt</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Client</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Items</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Total</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Payment</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Date</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Status</th></tr>
                </thead>
                <tbody>
                  {transactions.map((t: any) => (
                    <tr key={t._id} className="border-t border-gray-100 dark:border-gray-700/40">
                      <td className="p-3 text-text-primary dark:text-text-dark-primary font-mono text-xs whitespace-nowrap">{t.receiptNumber}</td>
                      <td className="p-3 text-text-primary dark:text-text-dark-primary whitespace-nowrap">{t.clientName}</td>
                      <td className="p-3 text-text-primary dark:text-text-dark-primary whitespace-nowrap">{t.items?.length || 0}</td>
                      <td className="p-3 font-medium text-text-primary dark:text-text-dark-primary whitespace-nowrap">GH₵{t.total.toFixed(0)}</td>
                      <td className="p-3 text-text-primary dark:text-text-dark-primary capitalize whitespace-nowrap">{t.paymentMethod?.replace('_', ' ')}</td>
                      <td className="p-3 text-xs text-text-secondary dark:text-text-dark-secondary whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'completed' ? 'bg-success/10 text-success-dark dark:text-success' : 'bg-error/10 text-error'}`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
