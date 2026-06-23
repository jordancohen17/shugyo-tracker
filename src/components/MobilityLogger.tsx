// src/components/MobilityLogger.tsx
'use client';

import React from 'react';
import { MobilityLog, MobilityCategory } from '@/types';
import { Compass, Clock, ChevronDown } from 'lucide-react';

interface MobilityLoggerProps {
  mobility: MobilityLog;
  onChange: (mobility: MobilityLog) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function MobilityLogger({ mobility, onChange, isCollapsed = false, onToggleCollapse }: MobilityLoggerProps) {
  
  // Toggles the completion of a specific exercise in a category
  const toggleExercise = (catIndex: number, exIndex: number) => {
    const newCategories = [...mobility.categories];
    const targetEx = newCategories[catIndex].exercises[exIndex];
    newCategories[catIndex].exercises[exIndex] = {
      ...targetEx,
      completed: !targetEx.completed,
    };
    onChange({
      ...mobility,
      categories: newCategories,
    });
  };

  // Updates the duration field
  const updateDuration = (mins: number) => {
    onChange({
      ...mobility,
      durationMinutes: mins,
    });
  };

  // Updates the notes field
  const updateNotes = (notes: string) => {
    onChange({
      ...mobility,
      notes,
    });
  };

  return (
    <div className="bg-washi border border-sumi/10 shadow-sm p-6 md:p-8 relative">
      {/* Corner Shoji details */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sumi/20"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-sumi/20"></div>

      {/* Title */}
      <div className="border-b border-shibu pb-4 mb-6 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone">Daily Accountability</span>
          <h2 className="text-xl font-serif font-light text-sumi mt-0.5 flex items-center gap-2">
            <Compass className="w-5 h-5 text-aizome" /> Mobility Tracker
          </h2>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-stone hover:text-sumi transition-colors pb-1"
            aria-label={isCollapsed ? "Expand card" : "Collapse card"}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
          </button>
        )}
      </div>

      {/* Collapsible Body */}
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[1500px] opacity-100'}`}>

      {/* Duration and Notes Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-stone mb-2 font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Session Duration
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              min="0"
              value={mobility.durationMinutes || ''}
              onChange={(e) => updateDuration(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-washi border border-shibu pl-3 pr-10 py-1.5 text-sm outline-none focus:border-aizome"
            />
            <span className="absolute right-3 text-xs text-stone font-mono">mins</span>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs uppercase tracking-wider text-stone mb-2 font-mono">Session Notes</label>
          <input
            type="text"
            value={mobility.notes || ''}
            onChange={(e) => updateNotes(e.target.value)}
            placeholder="e.g. focused on thoracic extension, hips felt tight"
            className="w-full bg-washi border border-shibu px-3 py-1.5 text-sm outline-none focus:border-aizome"
          />
        </div>
      </div>

      {/* Categorized Stretches Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {mobility.categories.map((cat, catIndex) => {
          const completedCount = cat.exercises.filter((e) => e.completed).length;
          const totalCount = cat.exercises.length;

          return (
            <div key={catIndex} className="p-4 bg-tatami/40 border border-shibu rounded-sm">
              <div className="flex justify-between items-baseline mb-3 pb-1.5 border-b border-shibu/60">
                <h3 className="text-xs uppercase tracking-widest font-mono font-semibold text-sumi">
                  {cat.categoryName}
                </h3>
                <span className="text-[10px] text-stone font-mono">
                  {completedCount}/{totalCount}
                </span>
              </div>

              <div className="space-y-2">
                {cat.exercises.map((ex, exIndex) => (
                  <label
                    key={exIndex}
                    className="flex items-start gap-2.5 text-xs text-stone hover:text-sumi cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={ex.completed}
                      onChange={() => toggleExercise(catIndex, exIndex)}
                      className="accent-aizome mt-0.5"
                    />
                    <span className={ex.completed ? 'line-through text-stone/50' : ''}>
                      {ex.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
