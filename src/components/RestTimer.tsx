// src/components/RestTimer.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Volume2, VolumeX, Timer, Bell, X, Maximize2, Minimize2 } from 'lucide-react';
import { playRestCompleteSound, playCountdownTickSound, triggerHaptic } from '@/lib/sound';

export interface RestTimerHandle {
  startRest: (durationSeconds?: number, label?: string) => void;
  startStopwatch: (label?: string) => void;
  stop: () => void;
}

interface RestTimerProps {
  onTimerRef?: (handle: RestTimerHandle) => void;
  className?: string;
}

const PRESET_DURATIONS = [
  { label: '30s', seconds: 30 },
  { label: '60s', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
];

const PREF_REST_DURATION_KEY = 'shugyo_preferred_rest_seconds';
const PREF_SOUND_KEY = 'shugyo_timer_sound_enabled';

export default function RestTimer({ onTimerRef, className = '' }: RestTimerProps) {
  const [mode, setMode] = useState<'rest' | 'stopwatch'>('rest');
  const [targetSeconds, setTargetSeconds] = useState<number>(90);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [label, setLabel] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFloatingMinimized, setIsFloatingMinimized] = useState<boolean>(false);

  // Load preferences
  useEffect(() => {
    try {
      const savedDuration = localStorage.getItem(PREF_REST_DURATION_KEY);
      if (savedDuration) {
        const val = parseInt(savedDuration, 10);
        if (!isNaN(val) && val > 0) {
          setTargetSeconds(val);
          setSecondsRemaining(val);
        }
      }
      const savedSound = localStorage.getItem(PREF_SOUND_KEY);
      if (savedSound !== null) {
        setSoundEnabled(savedSound === 'true');
      }
    } catch (e) {
      // Ignore localStorage error
    }
  }, []);

  const handleSetTargetSeconds = (sec: number) => {
    setTargetSeconds(sec);
    if (status === 'idle' || status === 'completed') {
      setSecondsRemaining(sec);
    }
    try {
      localStorage.setItem(PREF_REST_DURATION_KEY, sec.toString());
    } catch (e) {}
  };

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(PREF_SOUND_KEY, next.toString());
      } catch (e) {}
      return next;
    });
  };

  // Timer Tick Engine
  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(() => {
      if (mode === 'rest') {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer Finished
            if (soundEnabled) {
              playRestCompleteSound();
            }
            triggerHaptic([300, 150, 300]);
            setStatus('completed');
            return 0;
          }
          // Warning ticks for last 3 seconds
          if (soundEnabled && prev <= 4 && prev > 1) {
            playCountdownTickSound();
          }
          return prev - 1;
        });
      } else {
        // Stopwatch mode
        setStopwatchSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, mode, soundEnabled]);

  const startRest = useCallback((durationSeconds?: number, customLabel?: string) => {
    const dur = durationSeconds || targetSeconds;
    setMode('rest');
    setTargetSeconds(dur);
    setSecondsRemaining(dur);
    setLabel(customLabel || 'Rest Period');
    setStatus('running');
  }, [targetSeconds]);

  const startStopwatch = useCallback((customLabel?: string) => {
    setMode('stopwatch');
    setStopwatchSeconds(0);
    setLabel(customLabel || 'Timed Set / Hold');
    setStatus('running');
  }, []);

  const stop = useCallback(() => {
    setStatus('idle');
    setSecondsRemaining(targetSeconds);
    setStopwatchSeconds(0);
    setLabel('');
  }, [targetSeconds]);

  // Expose imperative handle
  useEffect(() => {
    if (onTimerRef) {
      onTimerRef({
        startRest,
        startStopwatch,
        stop,
      });
    }
  }, [onTimerRef, startRest, startStopwatch, stop]);

  const togglePlayPause = () => {
    if (status === 'running') {
      setStatus('paused');
    } else if (status === 'paused') {
      setStatus('running');
    } else if (status === 'idle' || status === 'completed') {
      if (mode === 'rest') {
        setSecondsRemaining(targetSeconds);
      }
      setStatus('running');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    if (mode === 'rest') {
      setSecondsRemaining(targetSeconds);
    } else {
      setStopwatchSeconds(0);
    }
  };

  const adjustRemaining = (delta: number) => {
    if (mode === 'rest') {
      setSecondsRemaining(prev => Math.max(5, prev + delta));
      if (status === 'completed') {
        setStatus('running');
      }
    } else {
      setStopwatchSeconds(prev => Math.max(0, prev + delta));
    }
  };

  const formatDisplay = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const currentSeconds = mode === 'rest' ? secondsRemaining : stopwatchSeconds;
  const progressPercent = mode === 'rest' 
    ? (targetSeconds > 0 ? Math.min(100, Math.max(0, ((targetSeconds - secondsRemaining) / targetSeconds) * 100)) : 0)
    : 100;

  return (
    <>
      {/* Inline Main Card */}
      <div className={`p-4 bg-tatami/40 border border-shibu rounded-sm relative transition-all ${className}`}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-shibu/60">
          <div className="flex items-center gap-2">
            <Timer className={`w-4 h-4 ${status === 'running' ? 'text-aizome animate-pulse' : 'text-stone'}`} />
            <span className="text-xs font-mono uppercase tracking-wider text-sumi font-medium">
              Rest & Set Timer
            </span>
            {label && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-washi border border-shibu text-aizome truncate max-w-[160px] sm:max-w-[240px]">
                {label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mode Switcher */}
            <div className="flex bg-washi border border-shibu rounded-sm p-0.5">
              <button
                type="button"
                onClick={() => {
                  setMode('rest');
                  setStatus('idle');
                  setSecondsRemaining(targetSeconds);
                }}
                className={`text-[9px] font-mono uppercase px-2 py-0.5 transition-colors ${
                  mode === 'rest' ? 'bg-aizome text-washi font-semibold' : 'text-stone hover:text-sumi'
                }`}
              >
                Rest
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('stopwatch');
                  setStatus('idle');
                  setStopwatchSeconds(0);
                }}
                className={`text-[9px] font-mono uppercase px-2 py-0.5 transition-colors ${
                  mode === 'stopwatch' ? 'bg-aizome text-washi font-semibold' : 'text-stone hover:text-sumi'
                }`}
              >
                Hold / Stopwatch
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              title={soundEnabled ? 'Mute bell chime' : 'Enable bell chime'}
              className="p-1 border border-shibu bg-washi text-stone hover:text-sumi rounded-sm transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-aizome" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Display + Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Main Time Display with Progress Ring / Bar */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className={`relative flex items-center justify-center px-4 py-2 bg-washi border ${
              status === 'completed' 
                ? 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/50' 
                : status === 'running' 
                  ? 'border-aizome' 
                  : 'border-shibu'
            } rounded-sm shadow-inner min-w-[130px]`}>
              <span className={`text-2xl sm:text-3xl font-mono font-light tracking-tight ${
                status === 'completed' 
                  ? 'text-emerald-700 font-medium' 
                  : status === 'running' 
                    ? 'text-aizome' 
                    : 'text-sumi'
              }`}>
                {formatDisplay(currentSeconds)}
              </span>
            </div>

            {/* Quick Play/Pause & Reset */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={togglePlayPause}
                className={`p-2.5 rounded-sm border transition-all ${
                  status === 'running'
                    ? 'bg-amber-600 border-amber-700 text-washi hover:bg-amber-700'
                    : status === 'completed'
                      ? 'bg-emerald-600 border-emerald-700 text-washi hover:bg-emerald-700'
                      : 'bg-aizome border-aizome text-washi hover:bg-aizome/90'
                }`}
                title={status === 'running' ? 'Pause' : 'Start'}
              >
                {status === 'running' ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2.5 border border-shibu bg-washi text-stone hover:text-sumi rounded-sm transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Quick +15s / +30s increment buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustRemaining(15)}
                className="text-[10px] font-mono px-2 py-1.5 bg-washi border border-shibu text-stone hover:text-aizome hover:border-aizome rounded-sm transition-all"
                title="Add 15 seconds"
              >
                +15s
              </button>
              <button
                type="button"
                onClick={() => adjustRemaining(30)}
                className="text-[10px] font-mono px-2 py-1.5 bg-washi border border-shibu text-stone hover:text-aizome hover:border-aizome rounded-sm transition-all"
                title="Add 30 seconds"
              >
                +30s
              </button>
            </div>
          </div>

          {/* Preset Buttons for Rest Mode */}
          {mode === 'rest' && (
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto sm:justify-end">
              <span className="text-[9px] font-mono uppercase text-stone mr-1">Presets:</span>
              {PRESET_DURATIONS.map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => {
                    handleSetTargetSeconds(preset.seconds);
                    setSecondsRemaining(preset.seconds);
                    if (status === 'running' || status === 'paused') {
                      setStatus('running');
                    }
                  }}
                  className={`text-[10px] font-mono px-2.5 py-1 border transition-all ${
                    targetSeconds === preset.seconds
                      ? 'bg-aizome/10 border-aizome text-aizome font-semibold'
                      : 'bg-washi border-shibu text-stone hover:text-sumi hover:border-sumi/40'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress Line */}
        {mode === 'rest' && status !== 'idle' && (
          <div className="w-full bg-shibu/50 h-1 mt-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                status === 'completed' ? 'bg-emerald-600' : 'bg-aizome'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Floating Mini HUD when timer is running or completed */}
      {(status === 'running' || status === 'paused' || status === 'completed') && (
        <div className="fixed bottom-4 right-4 z-40 animate-fade-in shadow-xl">
          <div className={`flex items-center gap-3 px-3.5 py-2.5 bg-washi/95 backdrop-blur-md border ${
            status === 'completed' 
              ? 'border-emerald-500 bg-emerald-50/95 ring-2 ring-emerald-300' 
              : 'border-aizome/40'
          } rounded-sm shadow-2xl transition-all`}>
            
            {/* Bell/Timer icon */}
            <div className="flex items-center gap-1.5">
              {status === 'completed' ? (
                <Bell className="w-4 h-4 text-emerald-600 animate-bounce" />
              ) : (
                <Timer className={`w-4 h-4 ${status === 'running' ? 'text-aizome animate-spin' : 'text-stone'}`} style={{ animationDuration: '4s' }} />
              )}
              <div className="flex flex-col">
                <span className={`text-base font-mono font-bold leading-none ${
                  status === 'completed' ? 'text-emerald-700' : 'text-sumi'
                }`}>
                  {formatDisplay(currentSeconds)}
                </span>
                {label ? (
                  <span className="text-[9px] font-mono text-stone truncate max-w-[120px]">
                    {label}
                  </span>
                ) : (
                  <span className="text-[8px] font-mono uppercase text-stone tracking-wider">
                    {mode === 'rest' ? 'Resting' : 'Hold'}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions in floating bar */}
            <div className="flex items-center gap-1 border-l border-shibu pl-2.5">
              <button
                type="button"
                onClick={togglePlayPause}
                className="p-1.5 bg-aizome text-washi rounded-sm hover:bg-aizome/90 transition-colors"
                title={status === 'running' ? 'Pause' : 'Start'}
              >
                {status === 'running' ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => adjustRemaining(30)}
                className="text-[9px] font-mono px-1.5 py-1 bg-tatami/60 border border-shibu text-stone hover:text-sumi rounded-sm"
                title="Add 30s"
              >
                +30s
              </button>

              <button
                type="button"
                onClick={stop}
                className="p-1 text-stone hover:text-red-500 transition-colors ml-0.5"
                title="Dismiss timer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
