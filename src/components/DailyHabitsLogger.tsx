// src/components/DailyHabitsLogger.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DailyHabits } from '@/types';
import { Timer, Play, Pause, RotateCcw, Plus, Minus, Music, Compass, ChevronDown, Check } from 'lucide-react';

interface DailyHabitsLoggerProps {
  day: string;
  dailyHabits: DailyHabits;
  onChange: (habits: DailyHabits) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function DailyHabitsLogger({
  day,
  dailyHabits,
  onChange,
  isCollapsed = false,
  onToggleCollapse,
}: DailyHabitsLoggerProps) {
  const [activeTimer, setActiveTimer] = useState<'hang' | 'squat' | null>(null);

  // Use a ref to keep track of the latest habits state to avoid closure issues in setInterval
  const habitsRef = useRef(dailyHabits);
  useEffect(() => {
    habitsRef.current = dailyHabits;
  }, [dailyHabits]);

  // Handle page/day change: pause any active timers
  useEffect(() => {
    setActiveTimer(null);
  }, [day]);

  // Interval timer tick
  useEffect(() => {
    if (!activeTimer) return;
    const interval = setInterval(() => {
      const current = habitsRef.current;
      if (activeTimer === 'hang') {
        onChange({
          ...current,
          hangSeconds: current.hangSeconds + 1,
        });
      } else if (activeTimer === 'squat') {
        onChange({
          ...current,
          squatSeconds: current.squatSeconds + 1,
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer, onChange]);

  const toggleTimer = (timerType: 'hang' | 'squat') => {
    if (activeTimer === timerType) {
      setActiveTimer(null);
    } else {
      setActiveTimer(timerType);
    }
  };

  const resetTimer = (timerType: 'hang' | 'squat') => {
    if (activeTimer === timerType) {
      setActiveTimer(null);
    }
    onChange({
      ...dailyHabits,
      [timerType === 'hang' ? 'hangSeconds' : 'squatSeconds']: 0,
    });
  };

  const adjustSeconds = (timerType: 'hang' | 'squat', amount: number) => {
    const field = timerType === 'hang' ? 'hangSeconds' : 'squatSeconds';
    const nextVal = Math.max(0, dailyHabits[field] + amount);
    onChange({
      ...dailyHabits,
      [field]: nextVal,
    });
  };

  const toggleCheckbox = (field: 'practiceInstrument' | 'mobilityWork') => {
    onChange({
      ...dailyHabits,
      [field]: !dailyHabits[field],
    });
  };

  // Targets in seconds
  const HANG_TARGET = 300; // 5 mins
  const SQUAT_TARGET = 900; // 15 mins

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getPercent = (sec: number, target: number) => {
    return Math.min(100, Math.round((sec / target) * 100));
  };

  const hangPercent = getPercent(dailyHabits.hangSeconds || 0, HANG_TARGET);
  const squatPercent = getPercent(dailyHabits.squatSeconds || 0, SQUAT_TARGET);

  return (
    <div className="bg-washi border border-sumi/10 shadow-sm p-6 md:p-8 relative">
      {/* Corner Shoji details */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sumi/20"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-sumi/20"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-sumi/20"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-sumi/20"></div>

      {/* Header */}
      <div className="border-b border-shibu pb-4 mb-6 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone">Daily Disciplines</span>
          <h2 className="text-xl font-serif font-light text-sumi mt-0.5 flex items-center gap-2">
            <Timer className="w-5 h-5 text-aizome" /> Daily Habits
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
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[1200px] opacity-100'}`}>
        
        {/* Stopwatch Timers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          
          {/* Hanging Timer Card */}
          <div className="p-4 bg-tatami/40 border border-shibu rounded-sm flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] uppercase tracking-wider font-mono text-stone">Spine Hang</span>
                {hangPercent === 100 && (
                  <span className="text-[9px] font-mono text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> COMPLETED
                  </span>
                )}
              </div>
              <h3 className="text-sm font-serif text-sumi font-medium">Decompress Spine</h3>
              <p className="text-xs text-stone font-mono mt-0.5">Goal: 5:00 min</p>
            </div>

            {/* Time display and Progress */}
            <div className="my-4">
              <div className="text-3xl font-mono font-light text-sumi tracking-tight text-center mb-2">
                {formatTime(dailyHabits.hangSeconds || 0)}
              </div>
              {/* Progress bar */}
              <div className="w-full h-1 bg-shibu/60 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${hangPercent === 100 ? 'bg-emerald-600' : 'bg-aizome'}`}
                  style={{ width: `${hangPercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-stone mt-1">
                <span>{hangPercent}%</span>
                <span>{formatTime(HANG_TARGET)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => toggleTimer('hang')}
                  className={`flex items-center gap-1 text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-sm transition-all border ${
                    activeTimer === 'hang' 
                      ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                      : 'bg-aizome text-washi border-aizome hover:bg-aizome/90'
                  }`}
                >
                  {activeTimer === 'hang' ? (
                    <>
                      <Pause className="w-3 h-3" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" /> Start
                    </>
                  )}
                </button>
                <button
                  onClick={() => resetTimer('hang')}
                  className="p-1.5 border border-shibu text-stone hover:text-sumi hover:bg-tatami transition-all rounded-sm"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Adjustments */}
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => adjustSeconds('hang', -60)}
                  className="px-1.5 py-0.5 border border-shibu/60 text-[9px] font-mono text-stone hover:bg-tatami rounded-sm"
                >
                  -1m
                </button>
                <button
                  onClick={() => adjustSeconds('hang', -30)}
                  className="px-1.5 py-0.5 border border-shibu/60 text-[9px] font-mono text-stone hover:bg-tatami rounded-sm"
                >
                  -30s
                </button>
                <button
                  onClick={() => adjustSeconds('hang', 30)}
                  className="px-1.5 py-0.5 border border-shibu/60 text-[9px] font-mono text-stone hover:bg-tatami rounded-sm"
                >
                  +30s
                </button>
                <button
                  onClick={() => adjustSeconds('hang', 60)}
                  className="px-1.5 py-0.5 border border-shibu/60 text-[9px] font-mono text-stone hover:bg-tatami rounded-sm"
                >
                  +1m
                </button>
              </div>
            </div>
          </div>

          {/* Deep Squat Timer Card */}
          <div className="p-4 bg-tatami/40 border border-shibu rounded-sm flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] uppercase tracking-wider font-mono text-stone">Deep Squat</span>
                {squatPercent === 100 && (
                  <span className="text-[9px] font-mono text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> COMPLETED
                  </span>
                )}
              </div>
              <h3 className="text-sm font-serif text-sumi font-medium">Deep Squat Hold</h3>
              <p className="text-xs text-stone font-mono mt-0.5">Goal: 15:00 min</p>
            </div>

            {/* Time display and Progress */}
            <div className="my-4">
              <div className="text-3xl font-mono font-light text-sumi tracking-tight text-center mb-2">
                {formatTime(dailyHabits.squatSeconds || 0)}
              </div>
              {/* Progress bar */}
              <div className="w-full h-1 bg-shibu/60 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${squatPercent === 100 ? 'bg-emerald-600' : 'bg-aizome'}`}
                  style={{ width: `${squatPercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-stone mt-1">
                <span>{squatPercent}%</span>
                <span>{formatTime(SQUAT_TARGET)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => toggleTimer('squat')}
                  className={`flex items-center gap-1 text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-sm transition-all border ${
                    activeTimer === 'squat' 
                      ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                      : 'bg-aizome text-washi border-aizome hover:bg-aizome/90'
                  }`}
                >
                  {activeTimer === 'squat' ? (
                    <>
                      <Pause className="w-3 h-3" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" /> Start
                    </>
                  )}
                </button>
                <button
                  onClick={() => resetTimer('squat')}
                  className="p-1.5 border border-shibu text-stone hover:text-sumi hover:bg-tatami transition-all rounded-sm"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Adjustments */}
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => adjustSeconds('squat', -60)}
                  className="px-1.5 py-0.5 border border-shibu/60 text-[9px] font-mono text-stone hover:bg-tatami rounded-sm"
                >
                  -1m
                </button>
                <button
                  onClick={() => adjustSeconds('squat', -30)}
                  className="px-1.5 py-0.5 border border-shibu/60 text-[9px] font-mono text-stone hover:bg-tatami rounded-sm"
                >
                  -30s
                </button>
                <button
                  onClick={() => adjustSeconds('squat', 30)}
                  className="px-1.5 py-0.5 border border-shibu/60 text-[9px] font-mono text-stone hover:bg-tatami rounded-sm"
                >
                  +30s
                </button>
                <button
                  onClick={() => adjustSeconds('squat', 60)}
                  className="px-1.5 py-0.5 border border-shibu/60 text-[9px] font-mono text-stone hover:bg-tatami rounded-sm"
                >
                  +1m
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Checkbox Habits Section */}
        <div className="p-4 bg-tatami/40 border border-shibu rounded-sm">
          <span className="text-[9px] uppercase tracking-wider font-mono text-stone block mb-3 border-b border-shibu/60 pb-1">
            Checklist Habits
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Practice Instrument Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-tatami/60 transition-colors rounded-sm text-sm text-sumi">
              <input
                type="checkbox"
                checked={dailyHabits.practiceInstrument || false}
                onChange={() => toggleCheckbox('practiceInstrument')}
                className="accent-aizome w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-2">
                <Music className="w-4 h-4 text-stone" />
                <span className={dailyHabits.practiceInstrument ? 'line-through text-stone/50' : 'text-stone font-medium hover:text-sumi transition-colors'}>
                  Practice Instrument
                </span>
              </span>
            </label>

            {/* Mobility Work Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-tatami/60 transition-colors rounded-sm text-sm text-sumi">
              <input
                type="checkbox"
                checked={dailyHabits.mobilityWork || false}
                onChange={() => toggleCheckbox('mobilityWork')}
                className="accent-aizome w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-stone" />
                <span className={dailyHabits.mobilityWork ? 'line-through text-stone/50' : 'text-stone font-medium hover:text-sumi transition-colors'}>
                  Mobility Work
                </span>
              </span>
            </label>

          </div>
        </div>

      </div>
    </div>
  );
}
