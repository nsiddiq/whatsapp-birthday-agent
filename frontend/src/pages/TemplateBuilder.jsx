import React, { useState, useEffect } from 'react';
import { getTemplates, createTemplate, updateTemplate, deleteTemplateApi } from '../api';

const AI_SIGNATURE = '\n\n🤖 [This is Nasir\'s AI Agent Assistant]';

function TemplateBuilder() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(template) {
    setEditingTemplate(template);
    setFormTitle(template.title);
    setFormContent(template.text_content);
    setIsCreating(false);
  }

  function startCreate() {
    setEditingTemplate(null);
    setFormTitle('');
    setFormContent('');
    setIsCreating(true);
  }

  function cancelEdit() {
    setEditingTemplate(null);
    setIsCreating(false);
    setFormTitle('');
    setFormContent('');
  }

  async function handleSave() {
    if (!formTitle.trim() || !formContent.trim()) return;

    try {
      if (isCreating) {
        await createTemplate({ title: formTitle, text_content: formContent });
      } else if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          title: formTitle,
          text_content: formContent,
        });
      }
      cancelEdit();
      loadTemplates();
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this template?')) return;
    try {
      await deleteTemplateApi(id);
      loadTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="animate-pulse text-4xl mb-2">✏️</div>
        <p className="text-sm">Loading templates...</p>
      </div>
    );
  }

  // Show editor form
  if (isCreating || editingTemplate) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {isCreating ? 'New Template' : 'Edit Template'}
          </h2>
          <button
            onClick={cancelEdit}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Warm & Friendly"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green/50"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Message Content
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Use <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> to insert the contact's name.
            </p>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={5}
              placeholder="Happy Birthday, {{name}}! 🎂..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green/50 resize-none"
            />
          </div>

          {/* AI Signature Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Auto-appended signature:</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{AI_SIGNATURE.trim()}</p>
          </div>

          {/* Live Preview */}
          <div className="bg-whatsapp-light/40 border border-whatsapp-green/20 rounded-lg p-3">
            <p className="text-xs font-medium text-whatsapp-dark mb-2">Preview:</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {(formContent || 'Your message here...').replace(/\{\{name\}\}/g, 'Ahmed')}
              {AI_SIGNATURE}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={!formTitle.trim() || !formContent.trim()}
            className="w-full bg-whatsapp-teal text-white font-medium py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          >
            {isCreating ? 'Create Template' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  // Template list view
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Templates</h2>
        <button
          onClick={startCreate}
          className="text-sm bg-whatsapp-teal text-white px-3 py-1.5 rounded-lg font-medium active:scale-95 transition-transform"
        >
          + New
        </button>
      </div>

      <div className="space-y-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{template.title}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(template)}
                  className="text-whatsapp-teal text-xs font-medium"
                  aria-label={`Edit ${template.title}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="text-red-400 text-xs font-medium"
                  aria-label={`Delete ${template.title}`}
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {template.text_content}
            </p>
            {/* Signature indicator */}
            <div className="mt-2 pt-2 border-t border-gray-50">
              <p className="text-xs text-gray-400 italic">
                + AI signature auto-appended on send
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TemplateBuilder;
