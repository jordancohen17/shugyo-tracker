// src/components/RecoveryLogger.tsx
'use client';

import React from 'react';
import { RecoveryHabits } from '@/types';
import { Leaf, Flame, Snowflake, Sparkles } from 'lucide-react';

interface RecoveryLoggerProps {
  recovery: RecoveryHabits;
  onChange: (recovery: RecoveryHabits) => void;
}

export default function RecoveryLogger({ recovery, onChange }: RecoveryLoggerProps) {
  
  const updateSaunaField = (field: 'completed' | 'temperatureFahrenheit' | 'durationMinutes', value: any) => {
    onChange({
      ...recovery,
      sauna: {
        ...recovery.sauna,
        [field]: value,
      },
    });
  };

  const updateColdPlungeField = (field: 'completed' | 'temperatureFahrenheit' | 'durationMinutes', value: any) => {
    onChange({
      ...recovery,
      coldPlunge: {
        ...recovery.coldPlunge,
        [field]: value,
      },
    });
  };

  const updateSleepField = (field: keyof RecoveryHabits['sleepHygiene'], value: boolean) => {
    onChange({
      ...recovery,
      sleepHygiene: {
        ...recovery.sleepHygiene,
        [field]: value,
      },
    });
  };

  return (
    <div className="bg-washi border border-sumi/10 shadow-sm p-6 md:p-8 relative">
      {/* Corner Shoji details */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sumi/20"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-sumi/20"></div>

      {/* Title */}
      <div className="border-b border-shibu pb-4 mb-6">
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone">Regeneration Practices</span>
        <h2 className="text-xl font-serif font-light text-sumi mt-0.5 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-aizome" /> Recovery Habit Tracker
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Infrared Sauna Section */}
        <div className="p-4 bg-tatami/40 border border-shibu rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-shibu pb-2">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs uppercase tracking-wider text-sumi">
                <input
                  type="checkbox"
                  checked={recovery.sauna.completed}
                  onChange={(e) => updateSaunaField('completed', e.target.checked)}
                  className="accent-aizome"
                />
                <Flame className="w-4 h-4 text-orange-500" />
                Infrared Sauna
              </label>
            </div>

            {recovery.sauna.completed && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-stone mb-1 font-mono">
                    Temp (Fahrenheit)
                  </label>
                  <input
                    type="number"
                    value={recovery.sauna.temperatureFahrenheit || ''}
                    onChange={(e) => updateSaunaField('temperatureFahrenheit', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 150"
                    className="w-full bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-stone mb-1 font-mono">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={recovery.sauna.durationMinutes || ''}
                    onChange={(e) => updateSaunaField('durationMinutes', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 30"
                    className="w-full bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome"
                  />
                </div>
              </div>
            )}
          </div>
          {!recovery.sauna.completed && (
            <p className="text-[10px] text-stone italic mt-4">Log sauna details here.</p>
          )}
        </div>

        {/* Cold Plunge Section */}
        <div className="p-4 bg-tatami/40 border border-shibu rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-shibu pb-2">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs uppercase tracking-wider text-sumi">
                <input
                  type="checkbox"
                  checked={recovery.coldPlunge.completed}
                  onChange={(e) => updateColdPlungeField('completed', e.target.checked)}
                  className="accent-aizome"
                />
                <Snowflake className="w-4 h-4 text-blue-400" />
                Cold Plunge
              </label>
            </div>

            {recovery.coldPlunge.completed && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-stone mb-1 font-mono">
                    Temp (Fahrenheit)
                  </label>
                  <input
                    type="number"
                    value={recovery.coldPlunge.temperatureFahrenheit || ''}
                    onChange={(e) => updateColdPlungeField('temperatureFahrenheit', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 45"
                    className="w-full bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-stone mb-1 font-mono">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={recovery.coldPlunge.durationMinutes || ''}
                    onChange={(e) => updateColdPlungeField('durationMinutes', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 3"
                    className="w-full bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome"
                  />
                </div>
              </div>
            )}
          </div>
          {!recovery.coldPlunge.completed && (
            <p className="text-[10px] text-stone italic mt-4">Log cold exposure here.</p>
          )}
        </div>

        {/* Sleep Hygiene Routine */}
        <div className="p-4 bg-tatami/40 border border-shibu rounded-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-shibu pb-2 font-mono text-xs uppercase tracking-wider text-sumi">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Sleep Hygiene Checklist
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-3 cursor-pointer text-xs text-stone hover:text-sumi transition-colors">
              <input
                type="checkbox"
                checked={recovery.sleepHygiene.noScreensBeforeBed}
                onChange={(e) => updateSleepField('noScreensBeforeBed', e.target.checked)}
                className="accent-aizome"
              />
              <span>No screens 1h before bed</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-xs text-stone hover:text-sumi transition-colors">
              <input
                type="checkbox"
                checked={recovery.sleepHygiene.magnesiumTaken}
                onChange={(e) => updateSleepField('magnesiumTaken', e.target.checked)}
                className="accent-aizome"
              />
              <span>Magnesium / zinc taken</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-xs text-stone hover:text-sumi transition-colors">
              <input
                type="checkbox"
                checked={recovery.sleepHygiene.coolRoomTemp}
                onChange={(e) => updateSleepField('coolRoomTemp', e.target.checked)}
                className="accent-aizome"
              />
              <span>Cool room temperature (&lt; 67°F)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
