// src/components/GrapplingLogger.tsx
'use client';

import React from 'react';
import { GrapplingLog } from '@/types';
import { Shield, Flame, BookOpen, ChevronDown } from 'lucide-react';

interface GrapplingLoggerProps {
  grappling: GrapplingLog | null;
  onChange: (grappling: GrapplingLog | null) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const INTENSITY_DESCRIPTIONS = {
  1: 'Flow Rolling / Drilling (Gentle pace, technical exchange)',
  2: 'Technical Sparring (Moderate pace, focus on clean application)',
  3: 'Competitive Rolling (Hard sparring, solid resistance)',
  4: 'Competition Prep (Heavy rolls, tournament pace and pressure)',
  5: 'Absolute Battle (Maximal effort, competition simulation)',
};

export default function GrapplingLogger({
  grappling,
  onChange,
  isCollapsed = false,
  onToggleCollapse,
}: GrapplingLoggerProps) {
  
  const handleToggleActive = (active: boolean) => {
    if (active) {
      onChange({
        durationMinutes: 60,
        matIntensity: 3,
        technicalFocus: '',
      });
    } else {
      onChange(null);
    }
  };

  const updateField = (field: keyof GrapplingLog, value: any) => {
    if (!grappling) return;
    onChange({
      ...grappling,
      [field]: value,
    });
  };

  return (
    <div className="bg-washi border border-sumi/10 shadow-sm p-6 md:p-8 relative">
      {/* Corner Shoji details */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sumi/20"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-sumi/20"></div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-shibu pb-4 mb-6">
        <div className="flex items-center justify-between flex-1 mr-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone">Grappling Sessions</span>
            <h2 className="text-xl font-serif font-light text-sumi mt-0.5 flex items-center gap-2">
              <Shield className="w-5 h-5 text-aizome" /> BJJ & Wrestling Log
            </h2>
          </div>
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
        <label className="flex items-center gap-2 cursor-pointer text-xs font-mono uppercase text-stone flex-shrink-0">
          <input
            type="checkbox"
            checked={!!grappling}
            onChange={(e) => handleToggleActive(e.target.checked)}
            className="accent-aizome"
          />
          Logged Grappling Today
        </label>
      </div>

      {/* Collapsible Body */}
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[1000px] opacity-100'}`}>

      {grappling ? (
        <div className="space-y-6">
          {/* Duration and Focus Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone mb-2 font-mono">
                Session Duration
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  value={grappling.durationMinutes}
                  onChange={(e) => updateField('durationMinutes', parseInt(e.target.value) || 0)}
                  placeholder="60"
                  className="w-full bg-washi border border-shibu pl-3 pr-12 py-1.5 text-sm outline-none focus:border-aizome"
                />
                <span className="absolute right-3 text-xs text-stone font-mono">mins</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-stone mb-2 font-mono flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Technical Focus / Notes
              </label>
              <input
                type="text"
                value={grappling.technicalFocus}
                onChange={(e) => updateField('technicalFocus', e.target.value)}
                placeholder="e.g. Half-guard underhook sweeps, escaping side control"
                className="w-full bg-washi border border-shibu px-3 py-1.5 text-sm outline-none focus:border-aizome"
              />
            </div>
          </div>

          {/* Mat Intensity Selector */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone mb-3 font-mono flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-aizome" /> Mat Intensity: {grappling.matIntensity} / 5
            </label>
            
            {/* Buttons 1 to 5 */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {([1, 2, 3, 4, 5] as const).map((intensity) => (
                <button
                  key={intensity}
                  type="button"
                  onClick={() => updateField('matIntensity', intensity)}
                  className={`py-3 text-sm font-mono border transition-all duration-300 ${
                    grappling.matIntensity === intensity
                      ? 'bg-aizome text-washi border-aizome font-semibold'
                      : 'bg-washi text-stone border-shibu hover:border-aizome hover:text-aizome'
                  }`}
                >
                  {intensity}
                </button>
              ))}
            </div>

            {/* Description Text */}
            <p className="text-xs text-stone italic bg-tatami/40 p-3 border border-shibu/60 rounded-sm">
              {INTENSITY_DESCRIPTIONS[grappling.matIntensity]}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-shibu text-xs text-stone italic">
          No grappling logged today. Toggle the switch above to record a BJJ or Wrestling session.
        </div>
      )}
      </div>
    </div>
  );
}
