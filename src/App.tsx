import { useState, useEffect } from 'react';
import {
  LuScan,
  LuSlidersHorizontal,
  LuFileSpreadsheet,
  LuBookOpen,
  LuMenu,
  LuX,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { checkHealth } from './services/api';
import type { PageId } from './types/spine';

import XrayAnalyzerPage from './pages/XrayAnalyzerPage';
import ManualSimulatorPage from './pages/ManualSimulatorPage';
import BatchPage from './pages/BatchPage';
import GuidePage from './pages/GuidePage';

interface NavItem {
  id: PageId;
  label: string;
  icon: IconType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'xray',   label: 'Radiographic Analysis', icon: LuScan },
  { id: 'manual', label: 'Parameter Entry',       icon: LuSlidersHorizontal },
  { id: 'batch',  label: 'Cohort Analysis',        icon: LuFileSpreadsheet },
  { id: 'guide',  label: 'Clinical Reference',    icon: LuBookOpen },
];

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('xray');
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    const interval = setInterval(ping, 25_000);
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-[#1E293B]">
      {/* Mobile Top Header */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:hidden">
        <span className="text-sm font-semibold tracking-tight text-[#1E293B]">
          Spine Health Prediction
        </span>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-[6px] p-1.5 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
          aria-label="Open navigation menu"
        >
          <LuMenu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Unscrollable Fixed Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-shrink-0 flex-col justify-between border-r border-[#E2E8F0] bg-white transition-transform duration-200 select-none md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Header Title: Clean text only, no logo/circle */}
          <div className="flex h-14 items-center justify-between border-b border-[#E2E8F0] px-5">
            <span className="text-sm font-semibold tracking-tight text-[#1E293B]">
              Spine Health Prediction
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-[6px] p-1 text-[#64748B] hover:bg-[#F8FAFC] md:hidden"
              aria-label="Close menu"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav aria-label="Main navigation" className="space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActivePage(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-xs transition-colors ${
                    active
                      ? 'bg-[#F0F6F9] font-semibold text-[#0F5C7A]'
                      : 'font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Server Status (Unscrollable bottom dock) */}
        <div className="border-t border-[#E2E8F0] p-3">
          <div className="flex items-center justify-between rounded-[6px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#64748B]">
            <span className="font-medium">
              {apiStatus === 'connected' ? 'Server Connected' : apiStatus === 'checking' ? 'Connecting...' : 'Server Offline'}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                apiStatus === 'connected'
                  ? 'bg-[#15803D]'
                  : apiStatus === 'checking'
                  ? 'animate-pulse bg-[#94A3B8]'
                  : 'bg-[#B91C1C]'
              }`}
            />
          </div>
        </div>
      </aside>

      {/* Main Content Area: Only this pane scrolls */}
      <main className="flex-1 h-full overflow-y-auto px-4 pt-18 pb-10 md:px-8 md:pt-8 md:pb-12">
        <div className="mx-auto max-w-6xl">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
