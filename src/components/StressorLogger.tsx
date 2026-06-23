// src/components/StressorLogger.tsx
'use client';

import React from 'react';
import { LifestyleStressors } from '@/types';
import { Activity, Wine, UtensilsCrossed, Brain } from 'lucide-react';

interface StressorLoggerProps {
  stressors: LifestyleStressors;
  onChange: (stressors: LifestyleStressors) => void;
}

export default function StressorLogger({ stressors, onChange }: StressorLoggerProps) {
  
  const updateAlcoholField = (field: 'consumed' | 'numberOfDrinks' | 'lateConsumption', value: any) => {
    onChange({
      ...stressors,
      alcohol: {
        ...stressors.alcohol,
        [field]: value,
      },
    });
  };

  const updateLateMeal = (value: boolean) => {
    onChange({
      ...stressors,
      lateHeavyMeal: value,
    });
  };

  const updateStress = (level: 1 | 2 | 3 | 4 | 5) => {
    onChange({
      ...stressors,
      subjectiveStress: level,
    });
  };

  return (
    <div className="bg-washi border border-sumi/10 shadow-sm p-6 md:p-8 relative">
      {/* Corner Shoji details */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-sumi/20"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-sumi/20"></div>

      {/* Title */}
      <div className="border-b border-shibu pb-4 mb-6">
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone">System Demands</span>
        <h2 className="text-xl font-serif font-light text-sumi mt-0.5 flex items-center gap-2">
          <Activity className="w-5 h-5 text-stone" /> Lifestyle Stressors
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Alcohol Section */}
        <div className="p-4 bg-tatami/40 border border-shibu rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-shibu pb-2">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs uppercase tracking-wider text-sumi">
                <input
                  type="checkbox"
                  checked={stressors.alcohol.consumed}
                  onChange={(e) => updateAlcoholField('consumed', e.target.checked)}
                  className="accent-aizome"
                />
                <Wine className="w-4 h-4 text-stone" />
                Alcohol Intake
              </label>
            </div>

            {stressors.alcohol.consumed && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-stone mb-1 font-mono">
                    Number of Drinks: {stressors.alcohol.numberOfDrinks || 1}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressors.alcohol.numberOfDrinks || 1}
                    onChange={(e) => updateAlcoholField('numberOfDrinks', parseInt(e.target.value) || 1)}
                    className="w-full accent-aizome bg-shibu h-1 rounded"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-stone hover:text-sumi transition-colors">
                    <input
                      type="checkbox"
                      checked={stressors.alcohol.lateConsumption}
                      onChange={(e) => updateAlcoholField('lateConsumption', e.target.checked)}
                      className="accent-aizome"
                    />
                    <span>Within 3h of bed</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          {!stressors.alcohol.consumed && (
            <p className="text-[10px] text-stone italic mt-4">Log alcohol consumption here.</p>
          )}
        </div>

        {/* Late Meal Section */}
        <div className="p-4 bg-tatami/40 border border-shibu rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-shibu pb-2">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-xs uppercase tracking-wider text-sumi">
                <input
                  type="checkbox"
                  checked={stressors.lateHeavyMeal}
                  onChange={(e) => updateLateMeal(e.target.checked)}
                  className="accent-aizome"
                />
                <UtensilsCrossed className="w-4 h-4 text-stone" />
                Late Heavy Meal
              </label>
            </div>
            
            <p className="text-[10px] text-stone leading-relaxed">
              Eating heavy meals within 3 hours of sleep forces digestion during rest, raising overnight body temperature and resting heart rate.
            </p>
          </div>
          {!stressors.lateHeavyMeal && (
            <p className="text-[10px] text-stone italic mt-4">Check if digestion overlapped with sleep.</p>
          )}
          {stressors.lateHeavyMeal && (
            <p className="text-[10px] text-amber-800 font-mono mt-4">✓ Disrupted sleep window.</p>
          )}
        </div>

        {/* Subjective Stress Section */}
        <div className="p-4 bg-tatami/40 border border-shibu rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-shibu pb-2 font-mono text-xs uppercase tracking-wider text-sumi">
              <Brain className="w-4 h-4 text-stone" />
              Cognitive / Life Stress
            </div>

            <div className="space-y-3 pt-1">
              <label className="block text-[10px] uppercase tracking-wider text-stone mb-1 font-mono">
                Daily Strain Level
              </label>
              
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as const).map((level) => {
                  const isSelected = stressors.subjectiveStress === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateStress(level)}
                      className={`flex-1 text-xs py-1.5 font-mono border transition-all duration-200 ${
                        isSelected
                          ? 'bg-aizome text-washi border-aizome'
                          : 'bg-washi text-stone border-shibu hover:border-sumi/50 hover:text-sumi'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-[8px] font-mono uppercase tracking-wider text-stone/80 px-0.5">
                <span>Zen (1)</span>
                <span>Peak (5)</span>
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-stone italic mt-4">
            Rating of general mental or external stress load.
          </p>
        </div>
      </div>
    </div>
  );
}
