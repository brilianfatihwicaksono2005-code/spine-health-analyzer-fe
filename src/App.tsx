// ============================================================
// src/App.tsx — Top navbar + tab-based view router + API status indicator
// ============================================================

import { useState, useEffect } from 'react';
import {
  ScanLine,
  Sliders,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';
import { checkHealth } from './services/api';
import type { PageId } from './types/spine';

import XrayAnalyzerPage from './pages/XrayAnalyzerPage';
import ManualSimulatorPage from './pages/ManualSimulatorPage';
import BatchPage from './pages/BatchPage';
import GuidePage from './pages/GuidePage';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface TabDef {
  id: PageId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'xray',   label: 'X-Ray Analyzer',  icon: <ScanLine className="h-4 w-4" /> },
  { id: 'manual', label: 'Manual Simulator', icon: <Sliders className="h-4 w-4" /> },
  { id: 'batch',  label: 'Batch CSV',        icon: <FileSpreadsheet className="h-4 w-4" /> },
  { id: 'guide',  label: 'Anatomy Guide',    icon: <BookOpen className="h-4 w-4" /> },
];

function App() {
  const [activePage, setActivePage] = useState<PageId>('xray');
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const resp = await checkHealth();
        if (!cancelled) setApiStatus(resp.status === 'ok' ? 'connected' : 'disconnected');
      } catch {
        if (!cancelled) setApiStatus('disconnected');
      }
    }

    ping();
    const interval = setInterval(ping, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'xray':   return <XrayAnalyzerPage />;
      case 'manual': return <ManualSimulatorPage />;
      case 'batch':  return <BatchPage />;
      case 'guide':  return <GuidePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-[#00183A]">
      {/* ── Top Navbar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#00183A] bg-[#00183A] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 md:flex-nowrap md:py-3">
          {/* Brand */}
          <div className="flex shrink-0 items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-white md:text-lg">
              Spine Analyzer
            </h1>
          </div>

          {/* Tab Navigation */}
          <nav
            aria-label="Application navigation"
            className="order-3 flex w-full justify-between gap-1 md:order-none md:w-auto md:flex-1 md:justify-center"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePage(tab.id)}
                title={tab.label}
                className={`flex min-w-10 items-center justify-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium transition-colors md:px-3 ${
                  activePage === tab.id
                    ? 'border-b-2 border-[#F59659] text-white'
                    : 'border-b-2 border-transparent text-[#CBD5E1] hover:border-[#64748B] hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Status Indicator */}
          <div className="ml-auto flex shrink-0 items-center gap-2 text-xs md:ml-0">
            {USE_MOCK && (
              <span className="hidden items-center gap-1.5 text-[11px] text-[#CBD5E1] sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]" />
                Mock Mode
              </span>
            )}
            {apiStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0F766E]" />
                <span className="hidden sm:inline">API Connected</span>
              </span>
            )}
            {apiStatus === 'disconnected' && (
              <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B91C1C]" />
                <span className="hidden sm:inline">API Offline</span>
              </span>
            )}
            {apiStatus === 'checking' && (
              <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]" />
                <span className="hidden sm:inline">Checking…</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Page Content ─────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
