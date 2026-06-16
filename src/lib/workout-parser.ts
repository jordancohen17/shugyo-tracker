// src/lib/workout-parser.ts
import { StrengthExercise, StrengthSet } from '@/types';

/**
 * Parses a formatted workout cell string back into StrengthExercise[]
 * Format:
 * [Strength / Calisthenics]
 * • Push Press: 135lbs 10x3
 * • Weighted Dip: 36lbs 5x3, 45lbs 5x3 AMRAP
 */
export function parseWorkoutString(workoutStr: string): StrengthExercise[] {
  if (!workoutStr) return [];
  const exercises: StrengthExercise[] = [];
  const lines = workoutStr.split('\n');
  
  let inStrengthSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '[Strength / Calisthenics]') {
      inStrengthSection = true;
      continue;
    }
    // If we hit another section header, stop parsing strength
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      inStrengthSection = false;
      continue;
    }
    
    if (inStrengthSection && (trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-'))) {
      // Remove bullet symbol
      const content = trimmed.substring(1).trim();
      const colonIndex = content.indexOf(':');
      if (colonIndex === -1) continue;
      
      const name = content.substring(0, colonIndex).trim();
      const setDetailsStr = content.substring(colonIndex + 1).trim();
      
      const log: StrengthSet[] = [];
      const setParts = setDetailsStr.split(',');
      for (const part of setParts) {
        const cleanPart = part.trim();
        if (!cleanPart) continue;
        
        const amrap = cleanPart.toUpperCase().includes('AMRAP');
        const basePart = cleanPart.replace(/amrap/i, '').trim();
        
        // Match weight (integer or decimal) and sets x reps
        // E.g. "135lbs 10x3", "135 10x3", "40.5lbs 5x3"
        const match = basePart.match(/^([\d.]+)\s*(?:lbs|kgs)?\s*(\d+)\s*x\s*(\d+)$/i);
        if (match) {
          log.push({
            weight: parseFloat(match[1]),
            sets: parseInt(match[2], 10),
            reps: parseInt(match[3], 10),
            isAmrap: amrap,
          });
        }
      }
      if (log.length > 0) {
        exercises.push({ name, log });
      }
    }
  }
  return exercises;
}

/**
 * Builds a history map of the most recent performance for each exercise.
 * Earliest entries are processed first, so the most recent log overrides them.
 */
export function buildExerciseHistoryMap(
  logs: any[],
  localStorageEntries: Record<string, any> = {}
): Record<string, { log: StrengthSet[]; date: string }> {
  const historyMap: Record<string, { log: StrengthSet[]; date: string }> = {};

  // Sort logs in chronological order (oldest to newest)
  // This ensures the newest entry updates the map last, making it the final value
  const sortedLogs = [...logs].sort((a, b) => a.day.localeCompare(b.day));

  for (const log of sortedLogs) {
    const day = log.day;
    let strengthExercises: StrengthExercise[] = [];

    // Prioritize high-fidelity JSON from local storage if available for that day
    const cachedEntry = localStorageEntries[day];
    if (cachedEntry && cachedEntry.workout?.strength) {
      strengthExercises = cachedEntry.workout.strength;
    } else if (log.workout) {
      // Fallback to parsing the string from Google Sheets
      strengthExercises = parseWorkoutString(log.workout);
    }

    // Record the configuration for each exercise
    for (const ex of strengthExercises) {
      if (!ex.name) continue;
      const key = ex.name.trim().toLowerCase();
      historyMap[key] = {
        log: ex.log,
        date: day,
      };
    }
  }

  return historyMap;
}
