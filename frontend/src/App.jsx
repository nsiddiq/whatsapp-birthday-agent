import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import TheBrain from './pages/TheBrain';
import Roster from './pages/Roster';
import TemplateBuilder from './pages/TemplateBuilder';
import Setup from './pages/Setup';
import Settings from './pages/Settings';

function App() {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-xl">
      {/* Header */}
      <header className="bg-whatsapp-dark text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <span className="text-2xl">🎂</span>
        <h1 className="text-lg font-semibold tracking-tight">Birthday Agent</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<TheBrain />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/templates" element={<TemplateBuilder />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 safe-bottom sticky bottom-0 z-50">
        <div className="flex justify-around py-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-whatsapp-teal font-semibold' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-0.5">🧠</span>
            Brain
          </NavLink>
          <NavLink
            to="/roster"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-whatsapp-teal font-semibold' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-0.5">👥</span>
            Roster
          </NavLink>
          <NavLink
            to="/templates"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-whatsapp-teal font-semibold' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-0.5">✏️</span>
            Templates
          </NavLink>
          <NavLink
            to="/setup"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-whatsapp-teal font-semibold' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-0.5">📡</span>
            Setup
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 text-xs ${
                isActive ? 'text-whatsapp-teal font-semibold' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl mb-0.5">⚙️</span>
            Settings
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

export default App;
