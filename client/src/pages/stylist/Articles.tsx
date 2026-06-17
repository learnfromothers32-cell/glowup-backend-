import { useState, useEffect, useCallback } from 'react';
import {
  getMyArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  type Article,
} from '../../api/tips';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  ImageIcon,
  Sparkles,
} from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';
type EditorMode = 'none' | 'create' | 'edit';

const CATEGORIES = ['Hair', 'Barber', 'Skin', 'Nails', 'Lashes'];

const emptyForm = {
  title: '',
  excerpt: '',
  content: [''],
  image: '',
  category: 'Hair',
  tags: '',
};

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editorMode, setEditorMode] = useState<EditorMode>('none');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchArticles = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const publishedFilter = filter === 'all' ? undefined : filter === 'published' ? 'true' : 'false';
      const result = await getMyArticles({ published: publishedFilter, page, limit: 20 });
      const items = result.items.filter(
        (a) =>
          !search ||
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.category.toLowerCase().includes(search.toLowerCase())
      );
      setArticles(items);
      setTotalPages(result.totalPages);
      setStatus('success');
    } catch {
      setError('Failed to load articles');
      setStatus('error');
    }
  }, [filter, page, search]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditorMode('create');
    setEditId(null);
  };

  const openEdit = (a: Article) => {
    setForm({
      title: a.title,
      excerpt: a.excerpt,
      content: a.content.length ? a.content : [''],
      image: a.image,
      category: a.category,
      tags: a.tags.join(', '),
    });
    setEditId(a.id);
    setEditorMode('edit');
  };

  const closeEditor = () => {
    setEditorMode('none');
    setEditId(null);
  };

  const addParagraph = () => {
    setForm((f) => ({ ...f, content: [...f.content, ''] }));
  };

  const removeParagraph = (i: number) => {
    setForm((f) => ({
      ...f,
      content: f.content.length > 1 ? f.content.filter((_, idx) => idx !== i) : [''],
    }));
  };

  const updateParagraph = (i: number, value: string) => {
    setForm((f) => {
      const next = [...f.content];
      next[i] = value;
      return { ...f, content: next };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.image.trim()) {
      setError('Title, excerpt, and image URL are required');
      return;
    }
    const validContent = form.content.filter((p) => p.trim());
    if (!validContent.length) {
      setError('At least one paragraph is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: validContent,
        image: form.image.trim(),
        category: form.category,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editorMode === 'create') {
        await createArticle(payload);
      } else if (editId) {
        await updateArticle(editId, payload);
      }
      closeEditor();
      fetchArticles();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (a: Article) => {
    try {
      await updateArticle(a.id, { published: !a.published });
      fetchArticles();
    } catch {
      setError('Failed to update article');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteArticle(deleteId);
      setDeleteId(null);
      fetchArticles();
    } catch {
      setError('Failed to delete article');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Articles</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Create and manage beauty tips & articles
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search articles..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'published' ? 'Published' : 'Drafts'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Editor Modal */}
      {editorMode !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editorMode === 'create' ? 'New Article' : 'Edit Article'}
              </h2>
              <button onClick={closeEditor} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. 10 Braid Styles for the Summer"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  maxLength={120}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="braids, summer, hair"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Excerpt *</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="A short summary of the article..."
                  rows={2}
                  maxLength={300}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Image URL *</label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  {form.image && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shrink-0 bg-gray-100 dark:bg-gray-800">
                      <img src={form.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">Content (paragraphs) *</label>
                  <button
                    type="button"
                    onClick={addParagraph}
                    className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Add paragraph
                  </button>
                </div>
                <div className="space-y-2">
                  {form.content.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 shrink-0 mt-2">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={p}
                          onChange={(e) => updateParagraph(i, e.target.value)}
                          placeholder={`Paragraph ${i + 1}...`}
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeParagraph(i)}
                        className="p-1.5 mt-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-500 transition-colors h-fit"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
              <button
                onClick={closeEditor}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {editorMode === 'create' ? 'Create Article' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Delete Article?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              This action cannot be undone. The article will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Articles List */}
      {status === 'loading' ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : status === 'error' && !articles.length ? (
        <div className="text-center py-20">
          <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">{error || 'Failed to load articles'}</p>
          <button onClick={fetchArticles} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">
            Try again
          </button>
        </div>
      ) : !articles.length ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No articles yet</h3>
          <p className="text-sm text-gray-500 mb-5">Create your first beauty tip article</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <Plus size={16} />
            Create Article
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {articles.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 hidden sm:block">
                  <img src={a.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/e2e8f0/94a3b8?text=No+Img'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400">
                      {a.category}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      a.published
                        ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400'
                        : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {a.published ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                      {a.published ? 'Published' : 'Draft'}
                    </span>
                    {a.featured && (
                      <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400">
                        <Sparkles size={10} />
                        Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{a.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{a.excerpt}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                    <span>{a.readTime}</span>
                    <span>{a.viewCount} views</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePublish(a)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title={a.published ? 'Unpublish' : 'Publish'}
                  >
                    {a.published ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-brand-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteId(a.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === p
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
