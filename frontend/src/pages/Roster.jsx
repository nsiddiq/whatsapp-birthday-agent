import React, { useState, useEffect } from 'react';
import { getContacts, getTemplates, updateContact, deleteContact } from '../api';

function Roster() {
  const [contacts, setContacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [contactData, templateData] = await Promise.all([
        getContacts(),
        getTemplates(),
      ]);
      setContacts(contactData);
      setTemplates(templateData);
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTemplateChange(contactId, templateId) {
    try {
      await updateContact(contactId, { template_id: templateId });
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, template_id: templateId } : c))
      );
    } catch (err) {
      console.error('Failed to update template:', err);
    }
  }

  async function handleDelete(contactId) {
    if (!confirm('Remove this contact from the roster?')) return;
    try {
      await deleteContact(contactId);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="animate-pulse text-4xl mb-2">👥</div>
        <p className="text-sm">Loading roster...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Birthday Roster</h2>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">No contacts learned yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Contacts are added automatically when the agent detects birthday messages.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{contact.name}</span>
                    {contact.birthday && (
                      <span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">
                        🎂 {contact.birthday}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{contact.jid}</p>
                </div>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="text-red-400 hover:text-red-600 p-1 -mr-1"
                  aria-label={`Delete ${contact.name}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Template Selector */}
              <div className="mt-3 pt-3 border-t border-gray-50">
                <label className="text-xs text-gray-500 block mb-1">Greeting Template</label>
                <select
                  value={contact.template_id || ''}
                  onChange={(e) => handleTemplateChange(contact.id, e.target.value || null)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-whatsapp-green/50"
                >
                  <option value="">Default (first template)</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Last wished info */}
              {contact.last_wished_year && (
                <p className="text-xs text-gray-400 mt-2">
                  ✅ Last wished: {contact.last_wished_year}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Roster;
