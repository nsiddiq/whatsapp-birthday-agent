import React, { useState, useEffect } from 'react';
import { getTodayWishes, getStatus } from '../api';

function TheBrain() {
  const [wishes, setWishes] = useState([]);
  const [status, setStatus] = useState({ connection: 'unknown', qr: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [wishData, statusData] = await Promise.all([
        getTodayWishes(),
        getStatus(),
      ]);
      setWishes(wishData);
      setStatus(statusData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  const statusColor = {
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    qr_ready: 'bg-yellow-500',
  };

  const statusLabel = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    qr_ready: 'Scan QR Code',
  };

  return (
    <div className="p-4 space-y-4">
      {/* Connection Status */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">WhatsApp Status</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${statusColor[status.connection] || 'bg-gray-400'}`}
            />
            <span className="text-sm font-medium">
              {statusLabel[status.connection] || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Today's Activity Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Today's Activity</h2>
        <span className="text-xs bg-whatsapp-green/10 text-whatsapp-dark px-2 py-1 rounded-full font-medium">
          {wishes.length} wish{wishes.length !== 1 ? 'es' : ''} sent
        </span>
      </div>

      {/* Wish Log */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-pulse text-4xl mb-2">🧠</div>
          <p className="text-sm">Loading brain activity...</p>
        </div>
      ) : wishes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">😴</div>
          <p className="text-gray-500 text-sm">No birthday wishes sent today.</p>
          <p className="text-gray-400 text-xs mt-1">
            The agent is listening for incoming birthday messages...
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {wishes.map((wish) => (
            <div
              key={wish.id}
              className="bg-whatsapp-light/40 border border-whatsapp-green/20 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎉</span>
                  <span className="font-semibold text-gray-800">{wish.contact_name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(wish.sent_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {wish.message_sent}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-gray-400">Template:</span>
                <span className="text-xs font-medium text-whatsapp-teal">
                  {wish.template_used}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TheBrain;
