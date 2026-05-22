import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

function Settings() {
  const [groups, setGroups] = useState([]);
  const [watchedGroup, setWatchedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [groupRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/groups`),
        fetch(`${API_BASE}/settings/group`),
      ]);

      if (groupRes.ok) {
        setGroups(await groupRes.json());
      } else {
        const err = await groupRes.json();
        setError(err.error || 'Failed to load groups');
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setWatchedGroup(data.watchedGroupJid || '');
      }
    } catch (err) {
      setError('Cannot reach backend');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(jid) {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings/group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupJid: jid || null }),
      });
      if (res.ok) {
        setWatchedGroup(jid || '');
      }
    } catch (err) {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="animate-pulse text-4xl mb-4">⚙️</div>
        <p className="text-gray-500 text-sm">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <h2 className="text-lg font-semibold text-gray-800">Watch Settings</h2>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          Choose which group the agent watches for birthday messages. 
          Only messages from this group will trigger auto-replies.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Current selection */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-500 mb-1">Currently watching:</p>
        <p className="text-sm font-semibold text-gray-800">
          {watchedGroup
            ? groups.find(g => g.jid === watchedGroup)?.name || watchedGroup
            : '🌐 All chats (no filter)'}
        </p>
      </div>

      {/* Group list */}
      <div className="space-y-2">
        {/* Option: Watch all */}
        <button
          onClick={() => handleSave('')}
          disabled={saving}
          className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
            !watchedGroup
              ? 'border-whatsapp-green bg-whatsapp-light/30'
              : 'border-gray-100 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-sm">🌐 All chats</p>
              <p className="text-xs text-gray-500">Watch every incoming message</p>
            </div>
            {!watchedGroup && <span className="text-whatsapp-green text-lg">✓</span>}
          </div>
        </button>

        {/* Group options */}
        {groups.map((group) => (
          <button
            key={group.jid}
            onClick={() => handleSave(group.jid)}
            disabled={saving}
            className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
              watchedGroup === group.jid
                ? 'border-whatsapp-green bg-whatsapp-light/30'
                : 'border-gray-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 text-sm">{group.name}</p>
                <p className="text-xs text-gray-400">{group.participants} members</p>
              </div>
              {watchedGroup === group.jid && <span className="text-whatsapp-green text-lg">✓</span>}
            </div>
          </button>
        ))}

        {groups.length === 0 && !error && (
          <p className="text-sm text-gray-400 text-center py-4">
            No groups found. Make sure WhatsApp is connected.
          </p>
        )}
      </div>
    </div>
  );
}

export default Settings;
