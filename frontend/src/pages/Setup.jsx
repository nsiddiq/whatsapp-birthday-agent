import React, { useState, useEffect } from 'react';
import { getStatus } from '../api';

const API_BASE = '/api';

function Setup() {
  const [status, setStatus] = useState({ connection: 'unknown', qr: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      const data = await getStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Cannot reach backend. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/connect`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) setError(data.error);
    } catch (err) {
      setError('Network error');
    } finally {
      setBusy(false);
    }
  }

  async function handleReconnect() {
    setBusy(true);
    try {
      await fetch(`${API_BASE}/reconnect`, { method: 'POST' });
    } catch (err) { /* ignore */ }
    finally { setBusy(false); }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-500 text-sm">Connecting to backend...</p>
      </div>
    );
  }

  if (error && status.connection === 'unknown') {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-700 mb-1">Backend Offline</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">Run <strong>START.bat → Option 2</strong></p>
        </div>
      </div>
    );
  }

  // ✅ CONNECTED
  if (status.connection === 'connected') {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">WhatsApp Connected!</h2>
          <p className="text-sm text-gray-500">Birthday Agent is active and listening.</p>
        </div>
        <div className="bg-whatsapp-light/40 border border-whatsapp-green/20 rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-whatsapp-dark text-sm">Watching for:</h3>
          <p className="text-sm text-gray-600">"happy birthday", "hbd", "hbday" in incoming messages</p>
        </div>
      </div>
    );
  }

  // 📷 QR CODE READY — show the image
  if (status.connection === 'qr_ready' && status.qr) {
    return (
      <div className="p-6 space-y-5">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Scan QR Code</h2>
          <p className="text-sm text-gray-500">Use WhatsApp on your phone to scan</p>
        </div>

        {/* QR Code Image */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 mx-auto flex items-center justify-center">
          <img
            src={status.qr}
            alt="WhatsApp QR Code"
            className="w-64 h-64"
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
            <li>Open <strong>WhatsApp</strong> on your phone</li>
            <li>Go to <strong>Settings → Linked Devices</strong></li>
            <li>Tap <strong>Link a Device</strong></li>
            <li>Point your camera at the QR code above</li>
          </ol>
        </div>

        <p className="text-xs text-gray-400 text-center">
          QR refreshes automatically. Page updates once connected.
        </p>
      </div>
    );
  }

  // 📱 INITIAL / AWAITING SETUP
  return (
    <div className="p-6 space-y-6">
      <div className="text-center py-6">
        <div className="text-5xl mb-3">📱</div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Connect WhatsApp</h2>
        <p className="text-sm text-gray-500">Generate a QR code to link your phone</p>
      </div>

      <button
        onClick={handleConnect}
        disabled={busy}
        className="w-full bg-whatsapp-teal text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-transform text-lg"
      >
        {busy ? 'Generating QR...' : 'Generate QR Code'}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {status.connection === 'reconnecting' && (
        <div className="text-center py-4">
          <div className="animate-pulse text-3xl mb-2">📡</div>
          <p className="text-sm text-gray-500">Reconnecting...</p>
        </div>
      )}

      {status.connection === 'disconnected' && (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600 mb-2">Connection lost.</p>
          <button onClick={handleReconnect} className="text-sm text-whatsapp-teal font-medium underline">
            Retry
          </button>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 mb-2">HOW IT WORKS</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Tap the button above to generate a QR code. Then open WhatsApp on your phone,
          go to Linked Devices, and scan it. The agent connects instantly and starts
          listening for birthday messages.
        </p>
      </div>
    </div>
  );
}

export default Setup;
