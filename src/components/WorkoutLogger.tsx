// src/components/WorkoutLogger.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { StrengthExercise, EmsTraining, StrengthSet } from '@/types';
import { Plus, Trash2, Dumbbell, Zap, History, RotateCcw, ChevronDown } from 'lucide-react';

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
  'Zercher Squat',
  'Push Press',
  'Weighted Pull-up',
  'Weighted Dip',
  'Barbell Deadlift',
  'L-Sit Hold'
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
  const [templates, setTemplates] = useState<Record<string, StrengthExercise[]>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isEditingTemplates, setIsEditingTemplates] = useState(false);
  const [editableTemplates, setEditableTemplates] = useState<Record<string, StrengthExercise[]>>({});
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Load templates from API
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);

  // Sync editable templates when modal opens
  useEffect(() => {
    if (isEditingTemplates) {
      const clone = JSON.parse(JSON.stringify(templates));
      setEditableTemplates(clone);
      const keys = Object.keys(clone);
      if (keys.length > 0 && !keys.includes(selectedTemplateName)) {
        setSelectedTemplateName(keys[0]);
      } else if (keys.length > 0) {
        setSelectedTemplateName(selectedTemplateName);
      } else {
        setSelectedTemplateName('');
      }
    }
  }, [isEditingTemplates, templates]);

  const handleCreateTemplate = () => {
    const newName = prompt('Enter a name for the new template (e.g. Day 6):');
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

  const handleDeleteTemplate = () => {
    if (!selectedTemplateName) return;
    if (!confirm(`Are you sure you want to delete "${selectedTemplateName}"?`)) return;
    
    setEditableTemplates(prev => {
      const next = { ...prev };
      delete next[selectedTemplateName];
      return next;
    });

    const remainingKeys = Object.keys(editableTemplates).filter(k => k !== selectedTemplateName);
    if (remainingKeys.length > 0) {
      setSelectedTemplateName(remainingKeys[0]);
    } else {
      setSelectedTemplateName('');
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
      current[exIdx] = { ...current[exIdx], name: newName };
      return {
        ...prev,
        [selectedTemplateName]: current
      };
    });
  };

  const handleUpdateSetInTemplate = (exIdx: number, setIdx: number, key: string, value: any) => {
    if (!selectedTemplateName) return;
    setEditableTemplates(prev => {
      const current = [...(prev[selectedTemplateName] || [])];
      const log = [...current[exIdx].log];
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
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableTemplates)
      });
      if (res.ok) {
        setTemplates(editableTemplates);
        setIsEditingTemplates(false);
      } else {
        alert('Failed to save templates');
      }
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
      const matchedEx = templates[dayName].find(
        (e) => e.name.trim().toLowerCase() === key
      );
      if (matchedEx) return matchedEx.log;
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
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[3000px] opacity-100'}`}>

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
                {['Strength', 'Power', 'Cardio', 'Metabolic', 'None'].map((prog) => {
                  const isSelected = (ems.programType || 'None') === prog;
                  return (
                    <button
                      key={prog}
                      type="button"
                      onClick={() => updateEmsField('programType', prog === 'None' ? '' : prog)}
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone mb-1 font-mono">
                  Core Intensity: {ems.coreIntensity ?? 0}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={ems.coreIntensity ?? 0}
                  onChange={(e) => updateEmsField('coreIntensity', parseInt(e.target.value))}
                  className="w-full accent-aizome bg-shibu h-1 rounded"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone mb-1 font-mono">
                  Upper Intensity: {ems.upperIntensity ?? 0}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={ems.upperIntensity ?? 0}
                  onChange={(e) => updateEmsField('upperIntensity', parseInt(e.target.value))}
                  className="w-full accent-aizome bg-shibu h-1 rounded"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-stone mb-1 font-mono">
                  Lower Intensity: {ems.lowerIntensity ?? 0}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={ems.lowerIntensity ?? 0}
                  onChange={(e) => updateEmsField('lowerIntensity', parseInt(e.target.value))}
                  className="w-full accent-aizome bg-shibu h-1 rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Strength & Calisthenics Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs uppercase tracking-wider text-stone font-mono">Strength Exercises</span>
          <button
            type="button"
            onClick={() => addExercise('')}
            className="flex items-center gap-1 text-xs text-aizome border border-aizome/20 px-2.5 py-1 hover:bg-aizome hover:text-washi transition-all duration-200"
          >
            <Plus className="w-3.5 h-3.5" /> Add Exercise
          </button>
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
            onClick={() => setIsEditingTemplates(true)}
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
                <button
                  type="button"
                  onClick={() => removeExercise(exIndex)}
                  className="absolute top-4 right-4 text-stone hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

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
                  <div className="grid grid-cols-4 gap-2 text-[10px] uppercase tracking-wider text-stone font-mono">
                    <div>Weight (lbs/kgs)</div>
                    <div>Sets</div>
                    <div>Reps</div>
                    <div className="text-center">AMRAP</div>
                  </div>

                  {ex.log.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-4 gap-2 items-center">
                      <input
                        type="number"
                        value={set.weight || ''}
                        onChange={(e) => updateSet(exIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome"
                      />
                      {/* Sets Counter */}
                      <div className="flex items-center border border-shibu bg-washi rounded-sm max-w-[80px] h-7">
                        <button
                          type="button"
                          onClick={() => updateSet(exIndex, setIndex, 'sets', Math.max(0, (set.sets ?? 0) - 1))}
                          className="w-7 h-full flex items-center justify-center text-xs text-stone hover:text-sumi hover:bg-tatami/40 font-mono select-none"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center text-xs font-mono text-sumi">
                          {set.sets ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSet(exIndex, setIndex, 'sets', (set.sets ?? 0) + 1)}
                          className="w-7 h-full flex items-center justify-center text-xs text-stone hover:text-sumi hover:bg-tatami/40 font-mono select-none"
                        >
                          +
                        </button>
                      </div>

                      {/* Reps Counter */}
                      <div className="flex items-center border border-shibu bg-washi rounded-sm max-w-[80px] h-7">
                        <button
                          type="button"
                          onClick={() => updateSet(exIndex, setIndex, 'reps', Math.max(0, (set.reps ?? 0) - 1))}
                          className="w-7 h-full flex items-center justify-center text-xs text-stone hover:text-sumi hover:bg-tatami/40 font-mono select-none"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center text-xs font-mono text-sumi">
                          {set.reps ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSet(exIndex, setIndex, 'reps', (set.reps ?? 0) + 1)}
                          className="w-7 h-full flex items-center justify-center text-xs text-stone hover:text-sumi hover:bg-tatami/40 font-mono select-none"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex justify-center items-center gap-2">
                        <input
                          type="checkbox"
                          checked={set.isAmrap}
                          onChange={(e) => updateSet(exIndex, setIndex, 'isAmrap', e.target.checked)}
                          className="accent-aizome"
                        />
                        {ex.log.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSet(exIndex, setIndex)}
                            className="text-stone hover:text-red-500 transition-colors ml-2"
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
                  onClick={() => addSet(exIndex)}
                  className="mt-3 text-[10px] uppercase tracking-widest text-aizome hover:underline"
                >
                  + Add Set config
                </button>
              </div>
            ))}
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
              <h3 className="text-lg font-serif font-light text-sumi">Manage Templates</h3>
              <button 
                onClick={() => setIsEditingTemplates(false)} 
                className="text-stone hover:text-sumi text-xs font-mono"
              >
                [Close]
              </button>
            </div>

            {/* Select template */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end mb-6">
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
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={handleCreateTemplate}
                  className="text-[10px] font-mono uppercase tracking-wider border border-aizome/30 px-3 py-2 text-aizome hover:bg-aizome hover:text-washi transition-all duration-200"
                >
                  Create New
                </button>
                {selectedTemplateName && (
                  <button 
                    type="button" 
                    onClick={handleDeleteTemplate}
                    className="text-[10px] font-mono uppercase tracking-wider border border-red-300 px-3 py-2 text-red-600 hover:bg-red-50 transition-all duration-200"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Edit exercise lists for selected template */}
            {selectedTemplateName && editableTemplates[selectedTemplateName] ? (
              <div className="space-y-4 mb-6">
                <h4 className="text-xs uppercase font-mono tracking-wider text-stone border-b border-shibu/30 pb-1">
                  Exercises for {selectedTemplateName}
                </h4>

                {editableTemplates[selectedTemplateName].map((ex, exIdx) => (
                  <div key={exIdx} className="border border-shibu/40 p-4 bg-tatami/20 relative rounded-sm">
                    <button 
                      type="button" 
                      onClick={() => handleRemoveExerciseFromTemplate(exIdx)}
                      className="absolute top-2 right-2 text-[10px] font-mono text-stone hover:text-red-500"
                    >
                      [Remove]
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
                        <div>Weight</div>
                        <div>Sets</div>
                        <div>Reps</div>
                        <div className="text-center">AMRAP</div>
                      </div>
                      {ex.log.map((set, setIdx) => (
                        <div key={setIdx} className="grid grid-cols-4 gap-2 items-center">
                          <input 
                            type="number" 
                            value={set.weight || ''} 
                            onChange={(e) => handleUpdateSetInTemplate(exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome text-sumi font-mono"
                          />
                          <input 
                            type="number" 
                            value={set.sets || ''} 
                            onChange={(e) => handleUpdateSetInTemplate(exIdx, setIdx, 'sets', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome text-sumi font-mono"
                          />
                          <input 
                            type="number" 
                            value={set.reps || ''} 
                            onChange={(e) => handleUpdateSetInTemplate(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome text-sumi font-mono"
                          />
                          <div className="flex justify-center items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={set.isAmrap} 
                              onChange={(e) => handleUpdateSetInTemplate(exIdx, setIdx, 'isAmrap', e.target.checked)}
                              className="accent-aizome"
                            />
                            {ex.log.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => handleRemoveSetFromTemplate(exIdx, setIdx)}
                                className="text-stone hover:text-red-500 font-mono text-xs"
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
                      className="mt-2 text-[9px] uppercase tracking-widest text-aizome hover:underline"
                    >
                      + Add Set Config
                    </button>
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={handleAddExerciseToTemplate}
                  className="w-full border border-dashed border-shibu/65 py-2 text-center text-xs text-stone hover:text-aizome hover:border-aizome transition-colors"
                >
                  + Add Exercise to Template
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-stone text-xs italic font-serif">
                Select a template from the list above or create a new one to begin editing.
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 border-t border-shibu pt-4 mt-6">
              <button 
                onClick={() => setIsEditingTemplates(false)}
                className="text-xs border border-shibu px-4 py-2 hover:bg-tatami/20 transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveTemplates}
                disabled={isSaving}
                className="text-xs bg-aizome text-washi px-4 py-2 hover:bg-aizome/90 transition-all duration-200 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Templates'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
