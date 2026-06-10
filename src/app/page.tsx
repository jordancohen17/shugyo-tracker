// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DailyLogEntry, OuraMetrics, StrengthExercise, EmsTraining, MobilityLog, GrapplingLog, RecoveryHabits } from '@/types';
import AutoregulationCard from '@/components/AutoregulationCard';
import WorkoutLogger from '@/components/WorkoutLogger';
import MobilityLogger from '@/components/MobilityLogger';
import GrapplingLogger from '@/components/GrapplingLogger';
import RecoveryLogger from '@/components/RecoveryLogger';
import { Calendar, Save, CheckCircle, AlertTriangle } from 'lucide-react';

const DEFAULT_MOBILITY_CATEGORIES = [
  {
    categoryName: 'Hips',
    exercises: [
      { name: 'Active Pigeon', completed: false },
      { name: 'Internal Rotation', completed: false },
      { name: '90/90 Work', completed: false },
    ],
  },
  {
    categoryName: 'Spine',
    exercises: [
      { name: 'Jefferson Curl', completed: false },
      { name: 'QL Extensions', completed: false },
      { name: 'Back Extensions', completed: false },
    ],
  },
  {
    categoryName: 'Hamstrings',
    exercises: [
      { name: 'Elephant Walks', completed: false },
      { name: 'Standing Fold', completed: false },
    ],
  },
  {
    categoryName: 'Hip Flexors',
    exercises: [
      { name: 'Couch Stretch', completed: false },
      { name: 'Diagonal Stretch', completed: false },
    ],
  },
];

const DEFAULT_RECOVERY: RecoveryHabits = {
  sauna: { completed: false, temperatureFahrenheit: 150, durationMinutes: 30 },
  coldPlunge: { completed: false, temperatureFahrenheit: 45, durationMinutes: 3 },
  sleepHygiene: {
    noScreensBeforeBed: false,
    magnesiumTaken: false,
    coolRoomTemp: false,
  },
};

const DEFAULT_EMS: EmsTraining = {
  isEmsDay: false,
  programType: 'None',
  coreIntensity: 0,
  upperIntensity: 0,
  lowerIntensity: 0,
};

export default function Home() {
  const [day, setDay] = useState<string>('');
  
  // Daily metrics states
  const [oura, setOura] = useState<OuraMetrics | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  
  // Workouts and Habits states
  const [strength, setStrength] = useState<StrengthExercise[]>([]);
  const [ems, setEms] = useState<EmsTraining>(DEFAULT_EMS);
  const [mobility, setMobility] = useState<MobilityLog>({
    categories: DEFAULT_MOBILITY_CATEGORIES,
    durationMinutes: 15,
  });
  const [grappling, setGrappling] = useState<GrapplingLog | null>(null);
  const [recovery, setRecovery] = useState<RecoveryHabits>(DEFAULT_RECOVERY);

  // Sync / Save statuses
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  // History states
  const [logs, setLogs] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/log');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logs) {
          const sorted = [...data.logs].sort((a, b) => b.day.localeCompare(a.day));
          setLogs(sorted);
        }
      }
    } catch (e) {
      console.error('Error fetching logs', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Client-side date initialization to prevent hydration issues
  useEffect(() => {
    let todayStr = '';
    try {
      // Format in Eastern Time (EST/EDT) YYYY-MM-DD
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(new Date());
      const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
      todayStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
    } catch (e) {
      console.warn('Failed to format in America/New_York, falling back to local timezone:', e);
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      todayStr = `${year}-${month}-${date}`;
    }
    setDay(todayStr);
    fetchHistory();
  }, []);

  // Fetch local cache or existing metrics when day changes (optional enhancement)
  useEffect(() => {
    if (!day) return;
    setSaveStatus({ type: null, message: '' });
    
    // Clear page states for fresh date (or load from localStorage if cached)
    const cached = localStorage.getItem(`shugyo_log_${day}`);
    if (cached) {
      try {
        const parsed: DailyLogEntry = JSON.parse(cached);
        setOura(parsed.oura);
        setRecommendation(parsed.llmRecommendation || null);
        if (parsed.workout) {
          setStrength(parsed.workout.strength);
          setEms(parsed.workout.ems);
          setMobility(parsed.workout.mobility);
        } else {
          resetWorkoutFields();
        }
        setGrappling(parsed.grappling);
        setRecovery(parsed.recovery);
        return;
      } catch (e) {
        console.error('Error loading cache', e);
      }
    }
    
    // Fallback reset
    setOura(null);
    setRecommendation(null);
    resetWorkoutFields();
    setGrappling(null);
    setRecovery(DEFAULT_RECOVERY);
  }, [day]);

  const resetWorkoutFields = () => {
    setStrength([]);
    setEms(DEFAULT_EMS);
    setMobility({
      categories: DEFAULT_MOBILITY_CATEGORIES.map(cat => ({
        ...cat,
        exercises: cat.exercises.map(ex => ({ ...ex, completed: false }))
      })),
      durationMinutes: 15,
    });
  };

  // Called when OuraCard finishes fetching new scores
  const handleOuraSync = (metrics: OuraMetrics, rec: string) => {
    setOura(metrics);
    setRecommendation(rec);
    
    // Save snapshot to cache
    const currentEntry = buildEntry(metrics, rec);
    localStorage.setItem(`shugyo_log_${day}`, JSON.stringify(currentEntry));
  };

  const buildEntry = (currentOura = oura, currentRec = recommendation): DailyLogEntry => {
    return {
      day,
      oura: currentOura,
      workout: {
        strength,
        ems,
        mobility,
      },
      grappling,
      recovery,
      llmRecommendation: currentRec || undefined,
    };
  };

  // Saves the completed daily entry to Google Sheets
  const handleSaveLog = async () => {
    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });
    
    const entry = buildEntry();

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to sync with Google Sheet.');
      }

      const data = await res.json();
      setSaveStatus({
        type: 'success',
        message: `Session logged successfully! Google Sheet row ${data.action}.`,
      });

      // Cache the saved state
      localStorage.setItem(`shugyo_log_${day}`, JSON.stringify(entry));
      
      // Refresh history list
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setSaveStatus({
        type: 'error',
        message: err.message || 'Error writing to Google Sheets.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!day) {
    return (
      <div className="flex-1 flex items-center justify-center bg-washi text-stone text-sm font-mono">
        Loading journal...
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col gap-8">
      {/* Zen Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-sumi pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-light tracking-wide text-sumi flex items-baseline gap-2">
            SHUGYO JOURNAL
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-stone mt-1">
            Bespoke Personal Autoregulation & Fitness Tracker
          </p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto border border-shibu bg-tatami/40 px-3 py-1.5 rounded-sm">
          <Calendar className="w-4 h-4 text-stone" />
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="bg-transparent text-sm text-sumi outline-none font-mono cursor-pointer"
          />
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Hand: Autoregulation and Recovery */}
        <section className="lg:col-span-5 flex flex-col gap-8">
          <AutoregulationCard
            day={day}
            oura={oura}
            recommendation={recommendation}
            onSync={handleOuraSync}
          />
          <RecoveryLogger
            recovery={recovery}
            onChange={setRecovery}
          />
        </section>

        {/* Right Hand: Workouts, Mobility, and Grappling */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          <WorkoutLogger
            strength={strength}
            ems={ems}
            onChangeStrength={setStrength}
            onChangeEms={setEms}
          />
          <MobilityLogger
            mobility={mobility}
            onChange={setMobility}
          />
          <GrapplingLogger
            grappling={grappling}
            onChange={setGrappling}
          />
        </section>
      </main>

      {/* Collapsible History Section */}
      <section className="bg-washi border border-sumi/10 shadow-sm p-6 md:p-8 relative mt-4">
        {/* Corner Shoji details */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sumi/20"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-sumi/20"></div>

        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="w-full flex justify-between items-center text-left focus:outline-none"
        >
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone">Historical Log</span>
            <h2 className="text-xl font-serif font-light text-sumi mt-0.5 flex items-center gap-2">
              Log History & Archives
            </h2>
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-aizome border border-aizome/30 px-3 py-1.5 hover:bg-aizome hover:text-washi transition-all duration-300">
            {isHistoryOpen ? 'Hide History' : 'Show History'}
          </span>
        </button>

        {isHistoryOpen && (
          <div className="mt-8 border-t border-shibu pt-6">
            {isLoadingHistory ? (
              <div className="text-center py-8 text-xs text-stone italic font-mono">
                Loading database rows...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone italic">
                No past logs found in sheet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-sumi/20 font-mono uppercase tracking-wider text-stone bg-tatami/40">
                      <th className="py-3 px-4 w-32 font-semibold">Date</th>
                      <th className="py-3 px-4 w-48 font-semibold">Oura Telemetry</th>
                      <th className="py-3 px-4 font-semibold">Logged Activity (Strength / EMS / Mobility)</th>
                      <th className="py-3 px-4 w-48 font-semibold">BJJ Intensity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={index} className="border-b border-shibu/50 hover:bg-tatami/10 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-sumi align-top whitespace-nowrap">
                          {log.day}
                        </td>
                        <td className="py-3.5 px-4 text-stone align-top whitespace-pre-line leading-relaxed">
                          {log.oura || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-stone align-top whitespace-pre-line leading-relaxed">
                          {log.workout || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-stone align-top whitespace-pre-line leading-relaxed">
                          {log.grappling || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Sticky Save / Sync Status Bar at bottom */}
      <footer className="mt-8 border-t border-shibu pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Status notification */}
        <div className="flex-1 w-full sm:w-auto">
          {saveStatus.type === 'success' && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-sm w-full sm:max-w-md">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{saveStatus.message}</span>
            </div>
          )}
          {saveStatus.type === 'error' && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 rounded-sm w-full sm:max-w-md">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{saveStatus.message}</span>
            </div>
          )}
        </div>

        {/* Unified Save Button */}
        <button
          onClick={handleSaveLog}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sumi text-washi px-8 py-3.5 hover:bg-aizome transition-all duration-300 disabled:opacity-50 text-sm font-mono uppercase tracking-wider font-semibold shadow-sm"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving Journal...' : 'Save to Google Sheet'}
        </button>
      </footer>
    </div>
  );
}
