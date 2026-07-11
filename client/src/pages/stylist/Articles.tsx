import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMyArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadArticleImage,
  type Article,
} from '../../api/tips';
import api from '../../api/axios';
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
  Upload,
  Save,
  ChevronDown,
  RefreshCcw,
} from 'lucide-react';

type Status = 'idle' | 'loading' | 'error';
type EditorMode = 'none' | 'create' | 'edit';

const CATEGORIES = [
  { value: 'Hair', label: 'Hair', color: 'bg-pink-100 text-pink-700' },
  { value: 'Barber', label: 'Barber', color: 'bg-blue-100 text-blue-700' },
  { value: 'Skin', label: 'Skin', color: 'bg-amber-100 text-amber-700' },
  { value: 'Nails', label: 'Nails', color: 'bg-purple-100 text-purple-700' },
  { value: 'Lashes', label: 'Lashes', color: 'bg-green-100 text-green-700' },
];

interface ArticleForm {
  title: string;
  excerpt: string;
  content: string[];
  image: string;
  category: string;
  tags: string;
}

const emptyForm: ArticleForm = {
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
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editorMode, setEditorMode] = useState<EditorMode>('none');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadLimitMB, setUploadLimitMB] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ data: { maxUploadSizeMB: number } }>('/config/public')
      .then(({ data }) => {
        if (data?.data?.maxUploadSizeMB) setUploadLimitMB(data.data.maxUploadSizeMB);
      })
      .catch(() => {});
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const fetchArticles = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const publishedFilter = filter === 'all' ? undefined : filter === 'published' ? 'true' : 'false';
      const result = await getMyArticles({ published: publishedFilter, page, limit: 20 });
      setArticles(
        result.items.filter(
          (a) =>
            !search ||
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.category.toLowerCase().includes(search.toLowerCase())
        )
      );
      setTotalPages(result.totalPages);
      setStatus('idle');
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
    setImagePreview(null);
    setEditorMode('create');
    setEditId(null);
    setError('');
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
    setImagePreview(a.image);
    setEditId(a.id);
    setEditorMode('edit');
    setError('');
  };

  const closeEditor = () => {
    setEditorMode('none');
    setEditId(null);
    setImagePreview(null);
    setError('');
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > uploadLimitMB * 1024 * 1024) {
      setError(`File exceeds ${uploadLimitMB}MB limit`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    setError('');
    try {
      const url = await uploadArticleImage(file);
      setForm((f) => ({ ...f, image: url }));
    } catch (err: any) {
      setImagePreview(null);
      setError(err?.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > uploadLimitMB * 1024 * 1024) {
        setError(`File exceeds ${uploadLimitMB}MB limit`);
        return;
      }
      handleImageUpload(file);
    } else if (file) {
      setError('Please select an image file (PNG, JPG, WebP)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const addParagraph = () => setForm((f) => ({ ...f, content: [...f.content, ''] }));
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
    if (!form.title.trim() || !form.excerpt.trim()) {
      setError('Title and excerpt are required');
      return;
    }
    if (!form.image.trim()) {
      setError('Please upload an image');
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
        showSuccess('Article created');
      } else if (editId) {
        await updateArticle(editId, payload);
        showSuccess('Article saved');
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
      showSuccess(a.published ? 'Article unpublished' : 'Article published');
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
      showSuccess('Article deleted');
      fetchArticles();
    } catch {
      setError('Failed to delete article');
    } finally {
      setDeleting(false);
    }
  };

  const categoryMeta = (val: string) => CATEGORIES.find((c) => c.value === val) || CATEGORIES[0];

  const publishCount = articles.filter((a) => a.published).length;
  const draftCount = articles.filter((a) => !a.published).length;
  const catOptions = ['All', ...new Set(articles.map(a => a.category))].slice(0, 8);
  const filteredArticles = categoryFilter === 'All'
    ? articles
    : articles.filter(a => a.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-[60] flex items-center gap-2.5 px-5 py-3 bg-green-50 border border-green-200 rounded-2xl shadow-lg text-sm font-medium text-green-700 animate-in slide-in-from-right-2">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary dark:text-text-dark-primary">Articles</h1>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-0.5">
            Create and manage beauty tips & articles
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-stylist-500 text-white rounded-xl text-sm font-medium hover:bg-stylist-600 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', count: articles.length, icon: FileText, color: 'text-stylist-600 bg-stylist-50' },
          { label: 'Published', count: publishCount, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
          { label: 'Drafts', count: draftCount, icon: Clock, color: 'text-amber-600 bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-dark-primary">{s.count}</p>
                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search articles..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary placeholder:text-text-muted dark:placeholder:text-text-dark-muted focus:outline-none focus:ring-2 focus:ring-stylist-500/20 focus:border-stylist-500"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-stylist-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-surface-dark-tertiary text-text-secondary dark:text-text-dark-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'published' ? 'Published' : 'Drafts'}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {catOptions.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(cat); setPage(1); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              categoryFilter === cat
                ? 'bg-stylist-500 text-white shadow-sm'
                : 'bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-700/40 text-text-secondary dark:text-text-dark-secondary hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && !deleteId && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Editor Side Panel / Modal */}
      {editorMode !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl mx-4 bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-surface-dark-tertiary">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stylist-50 dark:bg-stylist-950/20 flex items-center justify-center">
                  {editorMode === 'create' ? (
                    <Plus size={16} className="text-stylist-600" />
                  ) : (
                    <Edit2 size={16} className="text-stylist-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary dark:text-text-dark-primary">
                    {editorMode === 'create' ? 'New Article' : 'Edit Article'}
                  </h2>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                    {editorMode === 'create' ? 'Create a beauty tip article' : 'Update your article'}
                  </p>
                </div>
              </div>
              <button onClick={closeEditor} className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-text-muted dark:text-text-dark-muted transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Editor Body */}
            <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary dark:text-text-dark-secondary mb-2">Cover Image *</label>
                <div
                  ref={dropRef}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={`relative rounded-xl border-2 border-dashed transition-all ${
                    imagePreview
                      ? 'border-stylist-200 bg-stylist-50/30 dark:border-stylist-800 dark:bg-stylist-950/10'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-surface-dark-tertiary hover:border-stylist-300 dark:hover:border-stylist-600'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative aspect-[2/1] rounded-xl overflow-hidden group">
                      <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); setForm((f) => ({ ...f, image: '' })); }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-text-secondary dark:text-text-dark-secondary hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-white/80 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                        <Upload size={12} />
                        Click to replace
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-10 cursor-pointer">
                      {uploadingImage ? (
                        <Loader2 size={28} className="animate-spin text-stylist-500 mb-3" />
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-full bg-stylist-50 dark:bg-stylist-950/20 flex items-center justify-center mb-3">
                            <Upload size={22} className="text-stylist-500" />
                          </div>
                          <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
                            Drop an image here or click to browse
                          </p>
                          <p className="text-xs text-text-muted dark:text-text-dark-muted">
                            {`PNG, JPG or WebP · Max ${uploadLimitMB}MB`}
                          </p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary dark:text-text-dark-secondary mb-1.5">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. 10 Braid Styles for the Summer"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary placeholder:text-text-muted dark:placeholder:text-text-dark-muted focus:outline-none focus:ring-2 focus:ring-stylist-500/20 focus:border-stylist-500"
                  maxLength={120}
                />
              </div>

              {/* Category & Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary dark:text-text-dark-secondary mb-1.5">Category *</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full appearance-none px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-stylist-500/20 focus:border-stylist-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary dark:text-text-dark-secondary mb-1.5">Tags</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="braids, summer, hair"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary placeholder:text-text-muted dark:placeholder:text-text-dark-muted focus:outline-none focus:ring-2 focus:ring-stylist-500/20 focus:border-stylist-500"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary dark:text-text-dark-secondary mb-1.5">Excerpt *</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="A short summary of the article..."
                  rows={2}
                  maxLength={300}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary placeholder:text-text-muted dark:placeholder:text-text-dark-muted focus:outline-none focus:ring-2 focus:ring-stylist-500/20 focus:border-stylist-500 resize-none"
                />
                <p className="text-[10px] text-text-muted dark:text-text-dark-muted mt-1 text-right">{form.excerpt.length}/300</p>
              </div>

              {/* Content Paragraphs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-text-secondary dark:text-text-dark-secondary">Content (paragraphs) *</label>
                  <button
                    type="button"
                    onClick={addParagraph}
                    className="inline-flex items-center gap-1 text-xs font-medium text-stylist-600 dark:text-stylist-400 hover:text-stylist-700 px-2.5 py-1 rounded-xl hover:bg-stylist-50 dark:hover:bg-stylist-950/20 transition-colors"
                  >
                    <Plus size={12} />
                    Add paragraph
                  </button>
                </div>
                <div className="space-y-2.5">
                  {form.content.map((p, i) => (
                    <div key={i} className="flex gap-2.5 items-start group">
                      <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary text-[10px] font-bold text-text-secondary dark:text-text-dark-secondary shrink-0 mt-2.5 group-hover:bg-stylist-50 group-hover:text-stylist-600 transition-colors">
                        {i + 1}
                      </div>
                      <div className="flex-1 relative">
                        <textarea
                          value={p}
                          onChange={(e) => updateParagraph(i, e.target.value)}
                          placeholder={`Write paragraph ${i + 1}...`}
                          rows={2}
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary placeholder:text-text-muted dark:placeholder:text-text-dark-muted focus:outline-none focus:ring-2 focus:ring-stylist-500/20 focus:border-stylist-500 resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeParagraph(i)}
                        className="p-2 mt-2.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/20 text-text-muted dark:text-text-dark-muted hover:text-red-500 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Editor Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-surface-dark-tertiary">
              <button
                onClick={closeEditor}
                className="px-5 py-2.5 text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploadingImage}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-stylist-500 text-white rounded-xl text-sm font-medium hover:bg-stylist-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                {editorMode === 'create' ? 'Publish Article' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600 p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-text-primary dark:text-text-dark-primary text-center mb-2">Delete Article?</h3>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary text-center mb-6">
              This action cannot be undone. The article will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-text-secondary dark:text-text-dark-secondary bg-gray-100 dark:bg-surface-dark-tertiary rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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

      {/* Content */}
      {status === 'loading' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary overflow-hidden">
              <div className="aspect-[2/1] bg-gray-100 dark:bg-surface-dark-tertiary skeleton-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-20 skeleton-pulse rounded-full" />
                <div className="h-5 w-full skeleton-pulse rounded-lg" />
                <div className="h-4 w-3/4 skeleton-pulse rounded-lg" />
                <div className="flex gap-2">
                  <div className="h-4 w-16 skeleton-pulse rounded-lg" />
                  <div className="h-4 w-12 skeleton-pulse rounded-lg" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-9 flex-1 skeleton-pulse rounded-xl" />
                  <div className="h-9 w-9 skeleton-pulse rounded-xl" />
                  <div className="h-9 w-9 skeleton-pulse rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : status === 'error' && !articles.length ? (
        <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center px-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-error" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-text-primary dark:text-text-dark-primary mb-1">Failed to load articles</h3>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-6 max-w-xs">{error || 'Something went wrong. Please try again.'}</p>
          <button onClick={fetchArticles} className="h-12 px-6 inline-flex items-center gap-2 bg-stylist-500 text-white rounded-xl text-sm font-semibold hover:bg-stylist-600 transition-all shadow-sm">
            <RefreshCcw size={16} />
            Try Again
          </button>
        </div>
      ) : !articles.length ? (
        <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-50 dark:bg-surface-dark-tertiary flex items-center justify-center mb-5">
            <FileText size={28} className="text-text-muted dark:text-text-dark-muted" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-text-primary dark:text-text-dark-primary mb-1.5 font-display">No articles yet</h3>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-6 max-w-xs">Create your first beauty tip article to share with clients</p>
          <button
            onClick={openCreate}
            className="h-12 px-6 inline-flex items-center gap-2 bg-stylist-500 text-white rounded-xl text-sm font-semibold hover:bg-stylist-600 transition-all shadow-sm"
          >
            <Plus size={18} />
            Create Article
          </button>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-surface-dark-tertiary flex items-center justify-center mb-3">
            <Search size={20} className="text-text-muted dark:text-text-dark-muted" />
          </div>
          <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-0.5">No articles found</p>
          <p className="text-caption text-text-muted dark:text-text-dark-muted">Try a different category or search term</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredArticles.map((a) => {
              const cat = categoryMeta(a.category);
              return (
                <div key={a.id} className="group flex flex-col bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-card transition-all duration-200 overflow-hidden">
                  <div className="relative aspect-[2/1] overflow-hidden bg-gray-100 dark:bg-surface-dark-tertiary">
                    {a.image ? (
                      <img src={a.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={28} className="text-text-muted dark:text-text-dark-muted" />
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm ${cat.color}`}>{a.category}</span>
                    </div>
                    <div className="absolute top-2.5 right-2.5 flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm ${a.published ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {a.published ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {a.published ? 'Published' : 'Draft'}
                      </span>
                      {a.featured && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-purple-600 dark:text-purple-400">
                          <Sparkles size={10} /> Featured
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-bold text-text-primary dark:text-text-dark-primary font-display line-clamp-2 leading-snug">{a.title}</h3>
                    <p className="text-xs sm:text-sm text-text-secondary dark:text-text-dark-secondary mt-1.5 line-clamp-2 leading-relaxed">{a.excerpt}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-caption text-text-muted dark:text-text-dark-muted">
                      <span className="inline-flex items-center gap-1"><Clock size={12} className="shrink-0" />{a.readTime}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span>{a.viewCount} views</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span>{new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/30">
                      <button onClick={() => openEdit(a)} className="flex-1 h-9 sm:h-10 inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-stylist-600 dark:text-stylist-400 bg-stylist-50 dark:bg-stylist-950/30 hover:bg-stylist-100 dark:hover:bg-stylist-950/50 rounded-xl transition-colors">
                        <Edit2 size={14} /> Edit
                      </button>
                      <button onClick={() => togglePublish(a)} className={`h-9 sm:h-10 w-9 sm:w-10 rounded-xl flex items-center justify-center transition-colors ${a.published ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50' : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50'}`} title={a.published ? 'Unpublish' : 'Publish'}>
                        {a.published ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => setDeleteId(a.id)} className="h-9 sm:h-10 w-9 sm:w-10 rounded-xl flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-error hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`min-w-[36px] h-10 rounded-xl text-xs font-semibold transition-all px-3 ${page === p ? 'bg-stylist-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-surface-dark-tertiary text-text-secondary dark:text-text-dark-secondary hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
