// src/components/WorkoutLogger.tsx
'use client';

import React from 'react';
import { StrengthExercise, EmsTraining, StrengthSet } from '@/types';
import { Plus, Trash2, Dumbbell, Zap } from 'lucide-react';

interface WorkoutLoggerProps {
  strength: StrengthExercise[];
  ems: EmsTraining;
  onChangeStrength: (strength: StrengthExercise[]) => void;
  onChangeEms: (ems: EmsTraining) => void;
}

const COMMON_MOVEMENTS = [
  'Zercher Squat',
  'Push Press',
  'Weighted Pull-up',
  'Weighted Dip',
  'Barbell Deadlift',
  'L-Sit Hold'
];

const TEMPLATE_WORKOUTS: Record<string, StrengthExercise[]> = {
  'Day 1': [
    { name: 'Push Press', log: [{ weight: 135, sets: 10, reps: 3, isAmrap: false }] },
    { name: 'Zercher Squat', log: [{ weight: 135, sets: 10, reps: 3, isAmrap: false }] },
    { name: 'Weighted Pull-up', log: [{ weight: 45, sets: 5, reps: 3, isAmrap: false }] },
    { name: 'Weighted Dip', log: [{ weight: 36, sets: 5, reps: 3, isAmrap: false }] },
    { name: 'Hanging Leg Raise', log: [{ weight: 0, sets: 5, reps: 0, isAmrap: true }] },
    { name: 'Lat Raise', log: [{ weight: 0, sets: 5, reps: 10, isAmrap: false }] },
  ],
  'Day 2': [
    { name: 'AMRAP 20 mins (Pull-ups, Dips, Ab Wheel)', log: [{ weight: 0, sets: 1, reps: 1, isAmrap: true }] },
    { name: 'Hammer Curls', log: [{ weight: 0, sets: 5, reps: 3, isAmrap: false }] },
    { name: 'Skullcrushers', log: [{ weight: 0, sets: 5, reps: 3, isAmrap: false }] },
    { name: 'QL Extensions', log: [{ weight: 0, sets: 3, reps: 10, isAmrap: false }] },
    { name: 'SL Back Extensions', log: [{ weight: 0, sets: 3, reps: 10, isAmrap: false }] },
    { name: 'Seated Good Morning', log: [{ weight: 0, sets: 3, reps: 10, isAmrap: false }] },
  ],
  'Day 3': [
    { name: 'Power Clean', log: [{ weight: 135, sets: 6, reps: 5, isAmrap: false }] },
    { name: 'Incline Bench Press', log: [{ weight: 135, sets: 6, reps: 5, isAmrap: false }] },
    { name: 'Bench Press', log: [{ weight: 185, sets: 6, reps: 1, isAmrap: false }] },
    { name: 'Flat Bench Press', log: [{ weight: 0, sets: 2, reps: 0, isAmrap: true }] },
    { name: 'Back Squat (2-min AMRAP)', log: [{ weight: 0, sets: 1, reps: 0, isAmrap: true }] },
    { name: 'Hanging Leg Raise', log: [{ weight: 0, sets: 5, reps: 0, isAmrap: true }] },
    { name: 'Lat Raise', log: [{ weight: 0, sets: 5, reps: 10, isAmrap: false }] },
  ],
  'Day 4': [
    { name: 'Skullcrushers', log: [{ weight: 0, sets: 10, reps: 10, isAmrap: false }] },
    { name: 'Reverse Curls', log: [{ weight: 0, sets: 10, reps: 10, isAmrap: false }] },
    { name: 'QL Extensions', log: [{ weight: 0, sets: 3, reps: 10, isAmrap: false }] },
    { name: 'SL Back Extensions', log: [{ weight: 0, sets: 3, reps: 10, isAmrap: false }] },
    { name: 'Seated Good Morning', log: [{ weight: 0, sets: 3, reps: 10, isAmrap: false }] },
    { name: 'Ab Wheel', log: [{ weight: 0, sets: 5, reps: 0, isAmrap: true }] },
  ],
  'Day 5': [
    { name: 'Zercher Squat', log: [{ weight: 135, sets: 10, reps: 3, isAmrap: false }] },
    { name: 'Strict Military Press', log: [{ weight: 0, sets: 4, reps: 8, isAmrap: false }] },
    { name: 'Pendlay Row', log: [{ weight: 0, sets: 4, reps: 8, isAmrap: false }] },
    { name: 'Straps Shrugs', log: [{ weight: 0, sets: 8, reps: 3, isAmrap: false }] },
    { name: 'Hanging Leg Raise', log: [{ weight: 0, sets: 5, reps: 0, isAmrap: true }] },
  ],
};

export default function WorkoutLogger({
  strength,
  ems,
  onChangeStrength,
  onChangeEms,
}: WorkoutLoggerProps) {
  
  const applyTemplate = (dayName: string) => {
    const preset = TEMPLATE_WORKOUTS[dayName];
    if (preset) {
      onChangeStrength(JSON.parse(JSON.stringify(preset)));
    }
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
      <div className="border-b border-shibu pb-4 mb-6">
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone">Activity Logs</span>
        <h2 className="text-xl font-serif font-light text-sumi mt-0.5 flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-aizome" /> Strength & EMS Log
        </h2>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2 border-t border-shibu/50">
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone mb-2 font-mono">Program Type</label>
              <select
                value={ems.programType || 'None'}
                onChange={(e) => updateEmsField('programType', e.target.value)}
                className="w-full bg-washi border border-shibu px-3 py-1.5 text-xs text-sumi outline-none focus:border-aizome transition-colors"
              >
                <option value="None">Select Program...</option>
                <option value="Strength">Strength</option>
                <option value="Power">Power</option>
                <option value="Cardio">Cardio</option>
                <option value="Metabolic">Metabolic</option>
              </select>
            </div>
            
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
        <div className="flex flex-wrap gap-2 mb-4 bg-tatami/20 border border-shibu/30 p-3 rounded-sm">
          <span className="text-[10px] text-stone uppercase tracking-wider self-center mr-1 font-mono">Load Template:</span>
          {Object.keys(TEMPLATE_WORKOUTS).map((dayName) => (
            <button
              key={dayName}
              type="button"
              onClick={() => applyTemplate(dayName)}
              className="text-[10px] bg-washi border border-shibu px-3 py-1 text-sumi hover:bg-aizome hover:text-washi hover:border-aizome transition-all duration-200 uppercase font-semibold tracking-wider font-mono shadow-sm"
            >
              {dayName}
            </button>
          ))}
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
                    className="w-full bg-washi border border-shibu px-3 py-1.5 text-sm outline-none focus:border-aizome"
                  />
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
                      <input
                        type="number"
                        value={set.sets || ''}
                        onChange={(e) => updateSet(exIndex, setIndex, 'sets', parseInt(e.target.value) || 0)}
                        placeholder="1"
                        className="bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome"
                      />
                      <input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(exIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                        placeholder="5"
                        className="bg-washi border border-shibu px-2 py-1 text-xs outline-none focus:border-aizome"
                      />
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
  );
}
