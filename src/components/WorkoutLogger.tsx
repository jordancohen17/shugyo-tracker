// src/components/WorkoutLogger.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StrengthExercise, EmsTraining, StrengthSet } from '@/types';
import { Plus, Trash2, Dumbbell, Zap, History, RotateCcw, ChevronDown, Edit3, RefreshCw, Timer } from 'lucide-react';
import defaultTemplatesData from '@/data/workout-templates.json';
import RestTimer, { RestTimerHandle } from '@/components/RestTimer';

const TEMPLATES_STORAGE_KEY = 'shugyo_workout_templates_v5';
const LEGACY_STORAGE_KEY = 'shugyo_workout_templates_v4';
const ARCHIVE_STORAGE_KEY = 'shugyo_workout_templates_archive';

interface WorkoutLoggerProps {
  strength: StrengthExercise[];
  ems: EmsTraining;
  onChangeStrength: (strength: StrengthExercise[]) => void;
  onChangeEms: (ems: EmsTraining) => void;
  historyMap?: Record<string, { log: StrengthSet[]; date: string }>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const COMMON_MOVEMENTS = [
  'Barbell Overhead Press',
  'Zercher Squat',
  'Romanian Deadlift',
  'Weighted Ring Chin-up',
  'Weighted Ring Push-up',
  'L-Sit',
  'Back Bridge',
  'Hanging Leg Raise',
  'Durante Core 1',
  'Durante Core 2'
];

export default function WorkoutLogger({
  strength,
  ems,
  onChangeStrength,
  onChangeEms,
  historyMap,
  isCollapsed = false,
  onToggleCollapse,
}: WorkoutLoggerProps) {
  const [templates, setTemplates] = useState<Record<string, StrengthExercise[]>>(
    defaultTemplatesData as unknown as Record<string, StrengthExercise[]>
  );
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isEditingTemplates, setIsEditingTemplates] = useState(false);
  const [editableTemplates, setEditableTemplates] = useState<Record<string, StrengthExercise[]>>({});
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<RestTimerHandle | null>(null);

  // Load templates on initial mount (localStorage with API / bundled fallback)
  useEffect(() => {
    async function loadTemplates() {
      // 1. Check for legacy templates in localStorage and archive them
      try {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          localStorage.setItem(ARCHIVE_STORAGE_KEY, legacy);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      } catch (e) {
        console.warn('Failed to archive legacy templates from localStorage:', e);
      }

      // 2. Try localStorage v2 for active templates
      try {
        const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            setTemplates(parsed);
            setLoadingTemplates(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to read templates from localStorage:', err);
      }

      // 2. Fetch from API
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            setTemplates(data);
            try {
              localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(data));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Failed to load templates from API:', err);
      } finally {
        setLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, []);

  // Open Manage Templates modal with a clean clone of active templates
  const handleOpenManageTemplates = () => {
    const currentSource = templates && Object.keys(templates).length > 0 ? templates : defaultTemplatesData;
    const clone: Record<string, StrengthExercise[]> = JSON.parse(JSON.stringify(currentSource));
    setEditableTemplates(clone);
    const keys = Object.keys(clone);
    if (keys.length > 0) {
      if (!selectedTemplateName || !keys.includes(selectedTemplateName)) {
        setSelectedTemplateName(keys[0]);
      }
    } else {
      setSelectedTemplateName('');
    }
    setIsEditingTemplates(true);
  };

  const handleCreateTemplate = () => {
    const rawName = prompt('Enter a name for the new template (e.g. Day 6 or Upper Body):');
    if (!rawName) return;
    const newName = rawName.trim();
    if (!newName) return;
    if (editableTemplates[newName]) {
      alert('A template with that name already exists!');
      return;
    }
    setEditableTemplates(prev => ({
      ...prev,
      [newName]: [
        { name: 'New Exercise', log: [{ weight: 0, sets: 3, reps: 10, isAmrap: false }] }
      ]
    }));
    setSelectedTemplateName(newName);
  };

  const handleRenameTemplate = () => {
    if (!selectedTemplateName) return;
    const rawName = prompt(`Enter new name for "${selectedTemplateName}":`, selectedTemplateName);
    if (!rawName) return;
    const newName = rawName.trim();
    if (!newName || newName === selectedTemplateName) return;
    if (editableTemplates[newName]) {
      alert('A template with that name already exists!');
      return;
    }
    setEditableTemplates(prev => {
      const next: Record<string, StrengthExercise[]> = {};
      for (const [key, value] of Object.entries(prev)) {
        if (key === selectedTemplateName) {
          next[newName] = value;
        } else {
          next[key] = value;
        }
      }
      return next;
    });
    setSelectedTemplateName(newName);
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplateName) return;
    if (!confirm(`Are you sure you want to delete "${selectedTemplateName}"?`)) return;
    
    setEditableTemplates(prev => {
      const next = { ...prev };
      delete next[selectedTemplateName];
      const remainingKeys = Object.keys(next);
      setSelectedTemplateName(remainingKeys.length > 0 ? remainingKeys[0] : '');
      return next;
    });
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all templates back to default presets? Any custom template edits will be overwritten.')) return;
    try {
      const res = await fetch('/api/templates?default=true');
      let data = defaultTemplatesData;
      if (res.ok) {
        const fetched = await res.json();
        if (fetched && Object.keys(fetched).length > 0) {
          data = fetched;
        }
      }
      const clone = JSON.parse(JSON.stringify(data));
      setEditableTemplates(clone);
      const keys = Object.keys(clone);
      setSelectedTemplateName(keys.length > 0 ? keys[0] : '');
    } catch (e) {
      console.error('Failed to reset templates:', e);
      const clone = JSON.parse(JSON.stringify(defaultTemplatesData));
      setEditableTemplates(clone);
      const keys = Object.keys(clone);
      setSelectedTemplateName(keys.length > 0 ? keys[0] : '');
    }
  };

  const handleAddExerciseToTemplate = () => {
    if (!selectedTemplateName) return;
    setEditableTemplates(prev => {
      const current = prev[selectedTemplateName] || [];
      return {
        ...prev,
        [selectedTemplateName]: [
          ...current,
          { name: '', log: [{ weight: 0, sets: 3, reps: 10, isAmrap: false }] }
        ]
      };
    });
  };

  const handleRemoveExerciseFromTemplate = (exIdx: number) => {
    if (!selectedTemplateName) return;
    setEditableTemplates(prev => {
      const current = [...(prev[selectedTemplateName] || [])];
      current.splice(exIdx, 1);
      return {
        ...prev,
        [selectedTemplateName]: current
      };
    });
  };

  const handleUpdateExerciseNameInTemplate = (exIdx: number, newName: string) => {
    if (!selectedTemplateName) return;
    setEditableTemplates(prev => {
      const current = [...(prev[selectedTemplateName] || [])];
      if (!current[exIdx]) return prev;
      current[exIdx] = { ...current[exIdx], name: newName };
      return {
        ...prev,
        [selectedTemplateName]: current
      };
    });
  };

  const handleUpdateSetInTemplate = (exIdx: number, setIdx: number, key: keyof StrengthSet, value: any) => {
    if (!selectedTemplateName) return;
    setEditableTemplates(prev => {
      const current = [...(prev[selectedTemplateName] || [])];
      if (!current[exIdx]) return prev;
      const log = [...current[exIdx].log];
      if (!log[setIdx]) return prev;
      log[setIdx] = { ...log[setIdx], [key]: value };
      current[exIdx] = { ...current[exIdx], log };
      return {
        ...prev,
        [selectedTemplateName]: current
      };
    });
  };

  const handleAddSetToTemplate = (exIdx: number) => {
    if (!selectedTemplateName) return;
    setEditableTemplates(prev => {
      const current = [...(prev[selectedTemplateName] || [])];
      if (!current[exIdx]) return prev;
      const log = [...current[exIdx].log];
      const lastSet = log[log.length - 1] || { weight: 0, sets: 3, reps: 10, isAmrap: false };
      log.push({ ...lastSet });
      current[exIdx] = { ...current[exIdx], log };
      return {
        ...prev,
        [selectedTemplateName]: current
      };
    });
  };

  const handleRemoveSetFromTemplate = (exIdx: number, setIdx: number) => {
    if (!selectedTemplateName) return;
    setEditableTemplates(prev => {
      const current = [...(prev[selectedTemplateName] || [])];
      if (!current[exIdx]) return prev;
      const log = [...current[exIdx].log];
      log.splice(setIdx, 1);
      current[exIdx] = { ...current[exIdx], log };
      return {
        ...prev,
        [selectedTemplateName]: current
      };
    });
  };

  const handleSaveTemplates = async () => {
    setIsSaving(true);
    try {
      // 1. Immediately persist to localStorage
      try {
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(editableTemplates));
      } catch (lsErr) {
        console.warn('Failed to save templates to localStorage:', lsErr);
      }

      // 2. Persist to API route
      try {
        await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editableTemplates)
        });
      } catch (apiErr) {
        console.warn('API save warning (saved in localStorage):', apiErr);
      }

      setTemplates(editableTemplates);
      setIsEditingTemplates(false);
    } catch (err) {
      console.error(err);
      alert('Error saving templates');
    } finally {
      setIsSaving(false);
    }
  };
  
  const applyTemplate = (dayName: string) => {
    const preset = templates[dayName];
    if (preset) {
      const templateCopy: StrengthExercise[] = JSON.parse(JSON.stringify(preset));
      if (historyMap) {
        for (const ex of templateCopy) {
          if (!ex.name) continue;
          const key = ex.name.trim().toLowerCase();
          if (historyMap[key]) {
            ex.log = JSON.parse(JSON.stringify(historyMap[key].log));
          }
        }
      }
      onChangeStrength(templateCopy);
    }
  };

  const applyHistoryToExercise = (exIndex: number, historicalLog: StrengthSet[]) => {
    const newStrength = [...strength];
    newStrength[exIndex].log = JSON.parse(JSON.stringify(historicalLog));
    onChangeStrength(newStrength);
  };

  const findTemplateDefault = (exerciseName: string): StrengthSet[] | null => {
    if (!exerciseName) return null;
    const key = exerciseName.trim().toLowerCase();
    for (const dayName of Object.keys(templates)) {
      const dayList = templates[dayName];
      if (!Array.isArray(dayList)) continue;
      const matchedEx = dayList.find(
        (e) => e && e.name && e.name.trim().toLowerCase() === key
      );
      if (matchedEx && Array.isArray(matchedEx.log)) return matchedEx.log;
    }
    return null;
  };

  const isMatchingSets = (current: StrengthSet[], target: StrengthSet[]) => {
    if (current.length !== target.length) return false;
    for (let i = 0; i < current.length; i++) {
      if (
        current[i].weight !== target[i].weight ||
        current[i].sets !== target[i].sets ||
        current[i].reps !== target[i].reps ||
        current[i].isAmrap !== target[i].isAmrap
      ) {
        return false;
      }
    }
    return true;
  };
  // Add a new empty strength exercise row
  const addExercise = (name = '') => {
    const newExercise: StrengthExercise = {
      name,
      log: [{ weight: 0, sets: 1, reps: 5, isAmrap: false }]
    };
    onChangeStrength([...strength, newExercise]);
  };

  // Remove a strength exercise row
  const removeExercise = (index: number) => {
    const newStrength = [...strength];
    newStrength.splice(index, 1);
    onChangeStrength(newStrength);
  };

  // Modify strength exercise details
  const updateExerciseName = (index: number, name: string) => {
    const newStrength = [...strength];
    newStrength[index].name = name;
    onChangeStrength(newStrength);
  };

  // Set management inside an exercise
  const addSet = (exIndex: number) => {
    const newStrength = [...strength];
    const lastSet = newStrength[exIndex].log[newStrength[exIndex].log.length - 1];
    newStrength[exIndex].log.push({
      weight: lastSet ? lastSet.weight : 0,
      sets: 1,
      reps: lastSet ? lastSet.reps : 5,
      isAmrap: false
    });
    onChangeStrength(newStrength);
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    const newStrength = [...strength];
    newStrength[exIndex].log.splice(setIndex, 1);
    if (newStrength[exIndex].log.length === 0) {
      newStrength[exIndex].log.push({ weight: 0, sets: 1, reps: 5, isAmrap: false });
    }
    onChangeStrength(newStrength);
  };

  const updateSet = (exIndex: number, setIndex: number, field: keyof StrengthSet, value: any) => {
    const newStrength = [...strength];
    newStrength[exIndex].log[setIndex] = {
      ...newStrength[exIndex].log[setIndex],
      [field]: value
    };
    onChangeStrength(newStrength);
  };

  // EMS handlers
  const updateEmsField = (field: keyof EmsTraining, value: any) => {
    onChangeEms({
      ...ems,
      [field]: value
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
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone">Activity Logs</span>
          <h2 className="text-xl font-serif font-light text-sumi mt-0.5 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-aizome" /> Strength & EMS Log
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
      <div className={`transition-opacity duration-300 ease-in-out ${isCollapsed ? 'hidden' : 'block opacity-100'}`}>

      {/* Katalyst EMS Suit Training Block */}
      <div className="mb-8 p-4 bg-tatami/40 border border-shibu rounded-sm">
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-sumi">
            <input
              type="checkbox"
              checked={ems.isEmsDay}
              onChange={(e) => updateEmsField('isEmsDay', e.target.checked)}
              className="accent-aizome"
            />
            <Zap className={`w-4 h-4 ${ems.isEmsDay ? 'text-aizome' : 'text-stone'}`} />
            Katalyst EMS Suit Training Session
          </label>
        </div>

        {ems.isEmsDay && (
          <div className="flex flex-col gap-6 pt-2 border-t border-shibu/50">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-stone mb-2 font-mono">Program Type</label>
              <div className="flex flex-wrap gap-1.5">
                {['Strength', 'Power'].map((prog) => {
                  const isSelected = ems.programType === prog;
                  return (
                    <button
                      key={prog}
                      type="button"
                      onClick={() => updateEmsField('programType', isSelected ? '' : prog)}
                      className={`text-[10px] px-3 py-1.5 font-mono border transition-all duration-200 uppercase font-semibold tracking-wider ${
                        isSelected
                          ? 'bg-aizome text-washi border-aizome'
                          : 'bg-washi text-stone border-shibu hover:border-sumi/50 hover:text-sumi'
                      }`}
                    >
                      {prog}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="max-w-sm">
              <label className="block text-xs uppercase tracking-wider text-stone mb-1 font-mono">
                Intensity: {ems.intensity ?? 150}
              </label>
              <input
                type="range"
                min="150"
                max="480"
                value={ems.intensity ?? 150}
                onChange={(e) => updateEmsField('intensity', parseInt(e.target.value))}
                className="w-full accent-aizome bg-shibu h-1 rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* Strength & Calisthenics Section */}
      <div>
        {/* Rest & Set Timer Component */}
        <RestTimer
          onTimerRef={(handle) => {
            timerRef.current = handle;
          }}
          className="mb-6"
        />

        <div className="flex justify-between items-center mb-4">
          <span className="text-xs uppercase tracking-wider text-stone font-mono">Strength Exercises</span>
          {strength.length === 0 && (
            <button
              type="button"
              onClick={() => addExercise('')}
              className="flex items-center gap-1 text-xs text-aizome border border-aizome/20 px-2.5 py-1 hover:bg-aizome hover:text-washi transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" /> Add Exercise
            </button>
          )}
        </div>

        {/* Load Preset Template */}
        <div className="flex flex-wrap gap-2 mb-4 bg-tatami/20 border border-shibu/30 p-3 rounded-sm items-center">
          <span className="text-[10px] text-stone uppercase tracking-wider self-center mr-1 font-mono">Load Template:</span>
          {Object.keys(templates).map((dayName) => (
            <button
              key={dayName}
              type="button"
              onClick={() => applyTemplate(dayName)}
              className="text-[10px] bg-washi border border-shibu px-3 py-1 text-sumi hover:bg-aizome hover:text-washi hover:border-aizome transition-all duration-200 uppercase font-semibold tracking-wider font-mono shadow-sm"
            >
              {dayName}
            </button>
          ))}
          <button
            type="button"
            onClick={handleOpenManageTemplates}
            className="text-[10px] bg-tatami border border-stone/30 hover:border-aizome px-3 py-1.5 text-aizome transition-all duration-200 uppercase font-semibold tracking-wider font-mono shadow-sm ml-auto"
          >
            Manage Templates
          </button>
        </div>

        {/* Quick select buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-[10px] text-stone uppercase tracking-wider self-center mr-1 font-mono">Quick Add:</span>
          {COMMON_MOVEMENTS.map((mv) => (
            <button
              key={mv}
              type="button"
              onClick={() => addExercise(mv)}
              className="text-[10px] border border-shibu px-2 py-1 text-stone hover:text-aizome hover:border-aizome transition-all duration-200"
            >
              + {mv}
            </button>
          ))}
        </div>

        {/* Exercise rows */}
        {strength.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-shibu text-xs text-stone italic">
            No movements logged yet. Add one above.
          </div>
        ) : (
          <div className="space-y-6">
            {strength.map((ex, exIndex) => (
              <div key={exIndex} className="p-4 border border-shibu rounded-sm relative">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => timerRef.current?.startRest(undefined, ex.name || 'Rest')}
                    className="hidden sm:flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-tatami border border-shibu/60 text-aizome hover:bg-aizome hover:text-washi transition-all rounded-sm"
                    title="Start rest timer for this movement"
                  >
                    <Timer className="w-3 h-3" />
                    <span>Rest Timer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExercise(exIndex)}
                    className="text-stone hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4 max-w-sm">
                  <label className="block text-[10px] uppercase tracking-wider text-stone mb-1 font-mono">Movement Name</label>
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) => updateExerciseName(exIndex, e.target.value)}
                    placeholder="e.g. Zercher Squat"
                    className="w-full bg-washi border border-shibu px-3 py-1.5 text-sm outline-none focus:border-aizome mb-2"
                  />
                  {ex.name.trim() && (
                    (() => {
                      const key = ex.name.trim().toLowerCase();
                      const historyEntry = historyMap?.[key];
                      const templateDefault = findTemplateDefault(ex.name);
                      const isHistoryMatch = historyEntry && isMatchingSets(ex.log, historyEntry.log);
                      const isDefaultMatch = templateDefault && isMatchingSets(ex.log, templateDefault);
                      
                      return (
                        <div className="p-2.5 bg-tatami/20 border border-shibu/30 rounded-sm flex flex-col gap-1.5 text-[11px] text-sumi mt-2">
                          {/* History Entry Info */}
                          {historyEntry ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-stone font-semibold">
                                <History className="w-3 h-3 text-aizome" /> Last Performance:
                              </span>
                              <span className="font-mono bg-washi px-1.5 py-0.5 border border-shibu/40 text-[9px] text-sumi">
                                {historyEntry.log
                                   .map((s) => `${s.weight}lbs ${s.sets}x${s.reps}${s.isAmrap ? ' AMRAP' : ''}`)
                                  .join(', ')}
                              </span>
                              <span className="text-[9px] text-stone font-mono">
                                ({historyEntry.date})
                              </span>
                              
                              {isHistoryMatch ? (
                                <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-sm">
                                  Loaded Last
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => applyHistoryToExercise(exIndex, historyEntry.log)}
                                  className="text-[9px] text-aizome underline font-mono hover:text-sumi transition-colors"
                                >
                                  Apply Last Logged
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[9px] text-stone font-mono">
                              <History className="w-2.5 h-2.5 text-stone/40" /> No history recorded for this movement yet.
                            </div>
                          )}

                          {/* Template Default Info & Reset */}
                          {templateDefault && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-shibu/20 mt-0.5">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-stone">
                                Template Default:
                              </span>
                              <span className="font-mono text-[9px] text-stone">
                                {templateDefault
                                  .map((s) => `${s.weight}lbs ${s.sets}x${s.reps}${s.isAmrap ? ' AMRAP' : ''}`)
                                  .join(', ')}
                              </span>
                              {!isDefaultMatch && (
                                <button
                                  type="button"
                                  onClick={() => applyHistoryToExercise(exIndex, templateDefault)}
                                  className="text-[9px] text-stone underline font-mono hover:text-sumi transition-colors flex items-center gap-1"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" /> Reset to Default
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Sets List */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider text-stone font-mono items-center">
                    <div className="col-span-3 sm:col-span-3 truncate">Weight</div>
                    <div className="col-span-3 sm:col-span-2">Sets</div>
                    <div className="col-span-3 sm:col-span-2">Reps</div>
                    <div className="col-span-1 sm:col-span-2 text-center text-[9px] sm:text-[10px]">AMRAP</div>
                    <div className="col-span-2 sm:col-span-3 text-right text-[9px] sm:text-[10px] pr-1">Rest</div>
                  </div>

                  {ex.log.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3 sm:col-span-3">
                        <input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => updateSet(exIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome"
                        />
                      </div>
                      
                      {/* Sets Counter */}
                      <div className="col-span-3 sm:col-span-2 flex items-center border border-shibu bg-washi rounded-sm h-7">
                        <button
                          type="button"
                          onClick={() => updateSet(exIndex, setIndex, 'sets', Math.max(0, (set.sets ?? 0) - 1))}
                          className="w-6 sm:w-7 h-full flex items-center justify-center text-xs text-stone hover:text-sumi hover:bg-tatami/40 font-mono select-none"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center text-xs font-mono text-sumi">
                          {set.sets ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSet(exIndex, setIndex, 'sets', (set.sets ?? 0) + 1)}
                          className="w-6 sm:w-7 h-full flex items-center justify-center text-xs text-stone hover:text-sumi hover:bg-tatami/40 font-mono select-none"
                        >
                          +
                        </button>
                      </div>

                      {/* Reps Counter */}
                      <div className="col-span-3 sm:col-span-2 flex items-center border border-shibu bg-washi rounded-sm h-7">
                        <button
                          type="button"
                          onClick={() => updateSet(exIndex, setIndex, 'reps', Math.max(0, (set.reps ?? 0) - 1))}
                          className="w-6 sm:w-7 h-full flex items-center justify-center text-xs text-stone hover:text-sumi hover:bg-tatami/40 font-mono select-none"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center text-xs font-mono text-sumi">
                          {set.reps ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSet(exIndex, setIndex, 'reps', (set.reps ?? 0) + 1)}
                          className="w-6 sm:w-7 h-full flex items-center justify-center text-xs text-stone hover:text-sumi hover:bg-tatami/40 font-mono select-none"
                        >
                          +
                        </button>
                      </div>

                      {/* AMRAP Toggle */}
                      <div className="col-span-1 sm:col-span-2 flex justify-center items-center">
                        <input
                          type="checkbox"
                          checked={set.isAmrap}
                          onChange={(e) => updateSet(exIndex, setIndex, 'isAmrap', e.target.checked)}
                          className="accent-aizome cursor-pointer"
                        />
                      </div>

                      {/* Rest Timer Button & Remove */}
                      <div className="col-span-2 sm:col-span-3 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => timerRef.current?.startRest(undefined, `${ex.name || 'Exercise'} (Set ${setIndex + 1})`)}
                          className="flex items-center justify-center p-1 sm:px-2 sm:py-1 bg-tatami hover:bg-aizome hover:text-washi border border-shibu hover:border-aizome rounded-sm transition-all"
                          title="Start rest timer for this set"
                        >
                          <Timer className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-aizome group-hover:text-washi" />
                          <span className="hidden sm:inline font-mono text-[10px] ml-1">Rest</span>
                        </button>
                        {ex.log.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSet(exIndex, setIndex)}
                            className="text-stone hover:text-red-500 transition-colors px-1 text-xs"
                            title="Remove set config"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <button
                    type="button"
                    onClick={() => addSet(exIndex)}
                    className="text-[10px] uppercase tracking-widest text-aizome hover:underline font-mono"
                  >
                    + Add Set config
                  </button>

                  <button
                    type="button"
                    onClick={() => timerRef.current?.startStopwatch(ex.name || 'Hold Set')}
                    className="sm:hidden flex items-center gap-1 text-[10px] font-mono text-stone hover:text-sumi underline"
                  >
                    <Timer className="w-2.5 h-2.5" /> Hold Timer
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-start pt-2">
              <button
                type="button"
                onClick={() => addExercise('')}
                className="flex items-center gap-1 text-xs text-aizome border border-aizome/20 px-2.5 py-1 hover:bg-aizome hover:text-washi transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Exercise
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Template Editor Modal */}
      {isEditingTemplates && (
        <div className="fixed inset-0 bg-sumi/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-washi border border-sumi/20 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 relative shadow-lg">
            {/* Shoji Corner Decorators */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sumi/20"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-sumi/20"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-sumi/20"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-sumi/20"></div>

            <div className="flex justify-between items-center border-b border-shibu pb-3 mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-light text-sumi">Manage Templates</h3>
                <span className="text-[10px] font-mono text-stone">({Object.keys(editableTemplates).length} templates)</span>
              </div>
              <button 
                onClick={() => setIsEditingTemplates(false)} 
                className="text-stone hover:text-sumi text-xs font-mono"
              >
                [Close]
              </button>
            </div>

            {/* Select template and template actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-6 pb-4 border-b border-shibu/30">
              <div className="flex-1">
                <label className="block text-[10px] uppercase font-mono tracking-wider text-stone mb-1">Select Template</label>
                <select 
                  value={selectedTemplateName} 
                  onChange={(e) => setSelectedTemplateName(e.target.value)}
                  className="w-full bg-washi border border-shibu px-3 py-2 text-xs outline-none focus:border-aizome text-sumi"
                >
                  <option value="" disabled>-- Choose a template --</option>
                  {Object.keys(editableTemplates).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  type="button" 
                  onClick={handleCreateTemplate}
                  className="text-[10px] font-mono uppercase tracking-wider border border-aizome/30 px-3 py-2 text-aizome hover:bg-aizome hover:text-washi transition-all duration-200"
                >
                  + Create
                </button>
                {selectedTemplateName && (
                  <>
                    <button 
                      type="button" 
                      onClick={handleRenameTemplate}
                      className="text-[10px] font-mono uppercase tracking-wider border border-shibu px-3 py-2 text-stone hover:text-sumi hover:bg-tatami/40 transition-all duration-200"
                    >
                      Rename
                    </button>
                    <button 
                      type="button" 
                      onClick={handleDeleteTemplate}
                      className="text-[10px] font-mono uppercase tracking-wider border border-red-300 px-3 py-2 text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                      Delete
                    </button>
                  </>
                )}
                <button 
                  type="button" 
                  onClick={handleResetToDefaults}
                  title="Reset all templates back to default initial configuration"
                  className="text-[10px] font-mono uppercase tracking-wider border border-shibu/60 px-2.5 py-2 text-stone hover:text-amber-700 transition-all duration-200"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* Edit exercise lists for selected template */}
            {selectedTemplateName && editableTemplates[selectedTemplateName] ? (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center border-b border-shibu/30 pb-1">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-stone">
                    Exercises for <span className="font-bold text-sumi">{selectedTemplateName}</span>
                  </h4>
                  <span className="text-[10px] font-mono text-stone">
                    {editableTemplates[selectedTemplateName].length} exercise{editableTemplates[selectedTemplateName].length === 1 ? '' : 's'}
                  </span>
                </div>

                {editableTemplates[selectedTemplateName].map((ex, exIdx) => (
                  <div key={exIdx} className="border border-shibu/40 p-4 bg-tatami/20 relative rounded-sm">
                    <button 
                      type="button" 
                      onClick={() => handleRemoveExerciseFromTemplate(exIdx)}
                      className="absolute top-2 right-2 text-[10px] font-mono text-stone hover:text-red-500"
                    >
                      [Remove Exercise]
                    </button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[9px] uppercase font-mono tracking-wider text-stone mb-1">Exercise Name</label>
                        <input 
                          type="text" 
                          value={ex.name} 
                          onChange={(e) => handleUpdateExerciseNameInTemplate(exIdx, e.target.value)}
                          placeholder="e.g. Zercher Squat"
                          className="w-full bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome text-sumi font-sans"
                        />
                      </div>
                    </div>

                    {/* Sets config */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2 text-[9px] uppercase tracking-wider text-stone font-mono">
                        <div>Weight (lbs)</div>
                        <div>Sets</div>
                        <div>Reps</div>
                        <div className="text-center">AMRAP</div>
                      </div>
                      {ex.log.map((set, setIdx) => (
                        <div key={setIdx} className="grid grid-cols-4 gap-2 items-center">
                          <input 
                            type="number" 
                            value={set.weight !== undefined && set.weight !== null ? set.weight : ''} 
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              handleUpdateSetInTemplate(exIdx, setIdx, 'weight', isNaN(val) ? 0 : val);
                            }}
                            placeholder="0"
                            className="bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome text-sumi font-mono"
                          />
                          <input 
                            type="number" 
                            value={set.sets !== undefined && set.sets !== null ? set.sets : ''} 
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                              handleUpdateSetInTemplate(exIdx, setIdx, 'sets', isNaN(val) ? 0 : val);
                            }}
                            placeholder="0"
                            className="bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome text-sumi font-mono"
                          />
                          <input 
                            type="number" 
                            value={set.reps !== undefined && set.reps !== null ? set.reps : ''} 
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                              handleUpdateSetInTemplate(exIdx, setIdx, 'reps', isNaN(val) ? 0 : val);
                            }}
                            placeholder="0"
                            className="bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome text-sumi font-mono"
                          />
                          <div className="flex justify-center items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={!!set.isAmrap} 
                              onChange={(e) => handleUpdateSetInTemplate(exIdx, setIdx, 'isAmrap', e.target.checked)}
                              className="accent-aizome"
                            />
                            {ex.log.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => handleRemoveSetFromTemplate(exIdx, setIdx)}
                                className="text-stone hover:text-red-500 font-mono text-xs px-1"
                                title="Remove Set"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleAddSetToTemplate(exIdx)}
                      className="mt-2.5 text-[9px] uppercase tracking-widest text-aizome hover:underline font-mono"
                    >
                      + Add Set Config
                    </button>
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={handleAddExerciseToTemplate}
                  className="w-full border border-dashed border-shibu/65 py-2.5 text-center text-xs text-stone hover:text-aizome hover:border-aizome transition-colors font-mono uppercase tracking-wider"
                >
                  + Add Exercise to Template
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-stone text-xs italic font-serif">
                Select a template from the dropdown above or click "+ Create" to begin editing.
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 border-t border-shibu pt-4 mt-6">
              <button 
                type="button"
                onClick={() => setIsEditingTemplates(false)}
                className="text-xs border border-shibu px-4 py-2 hover:bg-tatami/20 transition-all duration-200 text-stone hover:text-sumi"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveTemplates}
                disabled={isSaving}
                className="text-xs bg-aizome text-washi px-5 py-2 hover:bg-aizome/90 transition-all duration-200 disabled:opacity-50 font-medium shadow-sm"
              >
                {isSaving ? 'Saving...' : 'Save Templates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
