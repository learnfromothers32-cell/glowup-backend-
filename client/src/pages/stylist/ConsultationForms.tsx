import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, FileText, Plus, Eye, Trash2, X } from 'lucide-react';
import { getMyForms, createForm, updateForm, deleteForm, getFormResponses } from '../../api/consultations';
import { Button } from '../../components/ui/Button';

export default function ConsultationForms() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editForm, setEditForm] = useState<any>({ name: '', description: '', questions: [] });
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [viewResponses, setViewResponses] = useState<string | null>(null);
  const [responses, setResponses] = useState<any>(null);

  useEffect(() => { loadForms(); }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await getMyForms();
      setForms(data);
    } catch { setError('Failed to load'); } finally { setLoading(false); }
  };

  const addQuestion = () => {
    setEditForm({
      ...editForm,
      questions: [...editForm.questions, { id: Date.now().toString(), type: 'text', label: '', required: false, options: [], placeholder: '' }]
    });
  };

  const updateQuestion = (idx: number, updates: any) => {
    const questions = [...editForm.questions];
    questions[idx] = { ...questions[idx], ...updates };
    setEditForm({ ...editForm, questions });
  };

  const removeQuestion = (idx: number) => {
    setEditForm({ ...editForm, questions: editForm.questions.filter((_: any, i: number) => i !== idx) });
  };

  const handleSave = async () => {
    if (!editForm.name) { setError('Form name required'); return; }
    setSaving(true);
    try {
      if (editing) await updateForm(editing, editForm);
      else await createForm(editForm);
      setShowAdd(false); setEditing(null); loadForms();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  const viewFormResponses = async (formId: string) => {
    try {
      setViewResponses(formId);
      const data = await getFormResponses(formId);
      setResponses(data);
    } catch { setError('Failed to load responses'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Consultation Forms</h1>
          <p className="text-text-secondary dark:text-text-dark-secondary text-sm mt-1">Create pre-booking questionnaires for clients</p>
        </div>
        <Button onClick={() => { setShowAdd(true); setEditing(null); setEditForm({ name: '', description: '', questions: [] }); }} size="sm">
          <Plus className="w-4 h-4" /> Create Form
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 p-4 skeleton-pulse h-32" />
            ))}
          </div>
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-16 text-text-muted dark:text-text-dark-muted"><FileText className="w-12 h-12 mx-auto mb-3" /><p>No consultation forms yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map(form => (
            <div key={form._id} className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-text-primary dark:text-text-dark-primary">{form.name}</h3>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-0.5">{form.description}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${form.isActive ? 'bg-success/10 text-success-dark dark:text-success' : 'bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-text-dark-secondary'}`}>
                  {form.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-text-muted dark:text-text-dark-muted mt-2">{form.questions?.length || 0} questions</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => viewFormResponses(form._id)}
                  className="flex-1 text-xs bg-stylist-50 text-stylist-600 py-1.5 rounded-xl hover:bg-stylist-500 hover:text-white transition-colors flex items-center justify-center gap-1 dark:bg-stylist-950/20 dark:text-stylist-400 dark:hover:bg-stylist-600">
                  <Eye className="w-3 h-3" /> View Responses
                </button>
                <button onClick={() => { setEditing(form._id); setEditForm(form); setShowAdd(true); }}
                  className="px-3 text-xs bg-stylist-50 text-stylist-600 py-1.5 rounded-xl hover:bg-stylist-500 hover:text-white transition-colors dark:bg-stylist-950/20 dark:text-stylist-400 dark:hover:bg-stylist-600">Edit</button>
                <button onClick={() => { if (confirm('Delete this form?')) deleteForm(form._id).then(loadForms); }}
                  className="px-3 text-xs bg-red-50 text-red-600 py-1.5 rounded-xl hover:bg-red-600 hover:text-white transition-colors dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-600"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto" onClick={() => { setShowAdd(false); setEditing(null); }}>
          <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl w-full max-w-2xl m-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary mb-4">{editing ? 'Edit Form' : 'Create Consultation Form'}</h2>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Form Name *</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-field-sm" />
              </div>
              <div>
                <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="input-field-sm" rows={2} />
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-primary dark:text-text-dark-primary">Questions</label>
                  <button onClick={addQuestion} className="text-xs text-stylist-500 hover:underline">+ Add Question</button>
                </div>
                {editForm.questions.map((q: any, idx: number) => (
                  <div key={q.id} className="p-3 mb-2 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <input value={q.label} onChange={e => updateQuestion(idx, { label: e.target.value })}
                        className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-2 py-1 text-sm bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary" placeholder="Question label *" />
                      <button onClick={() => removeQuestion(idx)} className="ml-2 text-text-muted dark:text-text-dark-muted hover:text-error"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-text-dark-secondary">
                      <select value={q.type} onChange={e => updateQuestion(idx, { type: e.target.value })}
                        className="border border-gray-200 dark:border-gray-600 rounded-xl px-2 py-1 bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary">
                        <option value="text">Text</option>
                        <option value="textarea">Paragraph</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio</option>
                      </select>
                      <label className="flex items-center gap-1 text-text-primary dark:text-text-dark-primary">
                        <input type="checkbox" checked={q.required} onChange={e => updateQuestion(idx, { required: e.target.checked })} />
                        Required
                      </label>
                    </div>
                    {(q.type === 'select' || q.type === 'radio' || q.type === 'checkbox') && (
                      <input value={(q.options || []).join(', ')} onChange={e => updateQuestion(idx, { options: e.target.value.split(',').map((s: string) => s.trim()) })}
                        className="w-full mt-1 border border-gray-200 dark:border-gray-600 rounded-xl px-2 py-1 text-xs bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary" placeholder="Options (comma separated)" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={() => { setShowAdd(false); setEditing(null); }} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">{editing ? 'Save Changes' : 'Create Form'}</Button>
            </div>
          </div>
        </div>
      )}

      {viewResponses && responses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setViewResponses(null); setResponses(null); }}>
          <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">{responses.form?.name} - Responses</h2>
              <button onClick={() => { setViewResponses(null); setResponses(null); }} className="text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary">&times;</button>
            </div>
            {responses.responses?.length === 0 ? (
              <p className="text-center text-text-muted dark:text-text-dark-muted py-8">No responses yet</p>
            ) : (
              <div className="space-y-4">
                {responses.responses?.map((r: any) => (
                  <div key={r._id} className="p-3 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl">
                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-2">From: {r.clientId?.name || 'Unknown'} • {new Date(r.createdAt).toLocaleDateString()}</p>
                    {r.answers?.map((a: any, i: number) => (
                      <p key={i} className="text-sm text-text-primary dark:text-text-dark-primary"><span className="text-text-secondary dark:text-text-dark-secondary">{a.questionId}:</span> {String(a.value)}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
