// src/components/AutoregulationCard.tsx
'use client';

import React, { useState } from 'react';
import { OuraMetrics } from '@/types';
import { RefreshCw, Activity, Moon, Zap, ShieldAlert, ChevronDown } from 'lucide-react';

interface AutoregulationCardProps {
  day: string;
  oura: OuraMetrics | null;
  recommendation: string | null;
  onSync: (metrics: OuraMetrics, recommendation: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AutoregulationCard({
  day,
  oura,
  recommendation,
  onSync,
  isCollapsed = false,
  onToggleCollapse,
}: AutoregulationCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const res = await fetch(`/api/sync?day=${day}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to sync with Oura Cloud API');
      }
      const data = await res.json();
      if (data.oura) {
        onSync(data.oura, data.recommendation);
      } else {
        throw new Error('No Oura data returned for this day.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to communicate with API.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-washi border border-sumi/10 shadow-sm p-6 md:p-8 relative transition-all duration-300">
      {/* Shoji Corner Decorators */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sumi/20"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-sumi/20"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-sumi/20"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-sumi/20"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-shibu pb-4 mb-6 gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone">Autoregulation</span>
          <h2 className="text-xl font-serif font-light text-sumi mt-0.5">Morning Status</h2>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-center">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-aizome border border-aizome/30 px-3 py-1.5 hover:bg-aizome hover:text-washi transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Oura'}
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="text-stone hover:text-sumi transition-colors"
              aria-label={isCollapsed ? "Expand card" : "Collapse card"}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Body */}
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[1000px] opacity-100'}`}>
        {error && (
          <div className="mb-6 p-3 bg-red-50 border-l-2 border-red-500 text-xs text-red-700 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error} (Verify environment variables setup for Oura Cloud API)</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {/* Readiness */}
          <div className="p-4 bg-tatami/40 border-l-2 border-aizome">
            <div className="flex items-center justify-between text-stone mb-1">
              <span className="text-[9px] uppercase tracking-wider font-mono">Readiness</span>
              <Activity className="w-3.5 h-3.5 text-aizome/70" />
            </div>
            <p className="text-3xl font-light text-sumi">{oura?.readinessScore ?? '—'}</p>
            <span className="text-[9px] text-stone font-medium">
              {oura ? (oura.readinessScore >= 85 ? 'Optimal' : oura.readinessScore >= 70 ? 'Good' : 'Pay Attention') : 'No Sync'}
            </span>
          </div>

          {/* HRV */}
          <div className="p-4 bg-tatami/40 border-l-2 border-stone">
            <div className="flex items-center justify-between text-stone mb-1">
              <span className="text-[9px] uppercase tracking-wider font-mono">HRV (Avg)</span>
              <Zap className="w-3.5 h-3.5 text-stone" />
            </div>
            <p className="text-3xl font-light text-sumi">
              {oura?.hrvAverage ? `${oura.hrvAverage}` : '—'}
              {oura?.hrvAverage ? <span className="text-xs text-stone ml-0.5">ms</span> : ''}
            </p>
            <span className="text-[9px] text-stone font-medium">Heart rate variability</span>
          </div>

          {/* Sleep Score */}
          <div className="p-4 bg-tatami/40 border-l-2 border-stone">
            <div className="flex items-center justify-between text-stone mb-1">
              <span className="text-[9px] uppercase tracking-wider font-mono">Sleep Score</span>
              <Moon className="w-3.5 h-3.5 text-stone" />
            </div>
            <p className="text-3xl font-light text-sumi">{oura?.sleepScore ?? '—'}</p>
            <span className="text-[9px] text-stone font-medium">Rest and regeneration</span>
          </div>

          {/* Resting Heart Rate */}
          <div className="p-4 bg-tatami/40 border-l-2 border-stone">
            <div className="flex items-center justify-between text-stone mb-1">
              <span className="text-[9px] uppercase tracking-wider font-mono">Resting HR</span>
              <Activity className="w-3.5 h-3.5 text-stone" />
            </div>
            <p className="text-3xl font-light text-sumi">
              {oura?.restingHeartRate ?? '—'}
              {oura?.restingHeartRate ? <span className="text-xs text-stone ml-0.5">bpm</span> : ''}
            </p>
            <span className="text-[9px] text-stone font-medium">Cardiovascular base</span>
          </div>
        </div>

        {/* Autoregulation Recommendation */}
        <div className="p-5 bg-tatami border border-shibu relative rounded-sm">
          <span className="text-[9px] uppercase tracking-widest text-stone font-mono block mb-1">
            Zen Autoregulation Guide
          </span>
          <p className="text-sm italic font-serif leading-relaxed text-sumi">
            {recommendation
              ? `“${recommendation}”`
              : '“Awaiting telemetry data. Sync with Oura to generate a personalized daily training recommendation.”'}
          </p>
        </div>
      </div>
    </div>
  );
}
  );
}
