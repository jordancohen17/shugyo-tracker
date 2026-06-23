// src/types/index.ts

export interface OuraMetrics {
  readinessScore: number;
  sleepScore: number;
  hrvAverage: number;
  restingHeartRate: number;
}

export interface StrengthSet {
  weight: number;      // in lbs or kgs
  sets: number;
  reps: number;
  isAmrap: boolean;
}

export interface StrengthExercise {
  name: string;        // e.g., "Zercher Squat", "Push Press", "Weighted Pull-up", "Weighted Dip"
  log: StrengthSet[];
}

export interface EmsTraining {
  isEmsDay: boolean;
  programType?: 'Strength' | 'Power' | 'Cardio' | 'Metabolic' | 'None';
  coreIntensity?: number;  // scale 1-10
  upperIntensity?: number; // scale 1-10
  lowerIntensity?: number; // scale 1-10
}

export interface MobilityExercise {
  name: string;
  completed: boolean;
}

export interface MobilityCategory {
  categoryName: string; // e.g., "Hips", "Spine", "Hamstrings", "Hip Flexors"
  exercises: MobilityExercise[];
}

export interface MobilityLog {
  categories: MobilityCategory[];
  durationMinutes: number;
  notes?: string;
}

export interface GrapplingLog {
  durationMinutes: number;
  matIntensity: 1 | 2 | 3 | 4 | 5; // 1 = flow roll, 5 = hard sparring/competition pace
  technicalFocus: string;          // e.g., "Half guard sweeps, front headlock escapes"
}

export interface RecoveryHabits {
  sauna: {
    completed: boolean;
    temperatureFahrenheit?: number;
    durationMinutes?: number;
  };
  coldPlunge: {
    completed: boolean;
    temperatureFahrenheit?: number;
    durationMinutes?: number;
  };
  sleepHygiene: {
    noScreensBeforeBed: boolean;
    magnesiumTaken: boolean;
    coolRoomTemp: boolean;
  };
}

export interface LifestyleStressors {
  alcohol: {
    consumed: boolean;
    numberOfDrinks?: number;
    lateConsumption: boolean; // within 3 hours of bed
  };
  lateHeavyMeal: boolean;      // eating within 3 hours of sleep
  subjectiveStress: 1 | 2 | 3 | 4 | 5; // 1 = peaceful, 5 = high stress
}

// The main aggregated record representing a single day's log entry
export interface DailyLogEntry {
  day: string; // ISO date format (YYYY-MM-DD)
  oura: OuraMetrics | null;
  workout: {
    strength: StrengthExercise[];
    ems: EmsTraining;
    mobility: MobilityLog;
  } | null;
  grappling: GrapplingLog | null;
  recovery: RecoveryHabits;
  stressors?: LifestyleStressors; // Stressors that degrade recovery/readiness
  llmRecommendation?: string; // Cache the morning autoregulation recommendation
}
