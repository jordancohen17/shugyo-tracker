// src/lib/llm.ts
import { OuraMetrics, LifestyleStressors } from '@/types';
import { GoogleGenAI } from '@google/genai';

/**
 * Generates a single-sentence training recommendation based on Oura Readiness, HRV, Sleep scores, and yesterday's lifestyle stressors.
 * Uses Gemini 2.5 Flash if an API key is provided, otherwise falls back to a rule-based engine.
 */
export async function generateAutoregulationRecommendation(
  metrics: OuraMetrics | null,
  stressors: LifestyleStressors | undefined,
  apiKey: string | undefined
): Promise<string> {
  const readiness = metrics?.readinessScore ?? 80;
  const hrv = metrics?.hrvAverage ?? 50;
  const sleep = metrics?.sleepScore ?? 80;
  const rhr = metrics?.restingHeartRate ?? 60;

  // Rule-based fallback if API key is not present
  const getHeuristicRecommendation = () => {
    const isAlcoholAffected = stressors?.alcohol.consumed && stressors?.alcohol.lateConsumption;
    const isHighStress = stressors && stressors.subjectiveStress >= 4;

    if (readiness >= 85 && hrv >= 60 && !isAlcoholAffected && !isHighStress) {
      return "Ready for high-intensity training. Central nervous system is fully recovered; focus on heavy compound movements or intense sparring.";
    } else if (readiness >= 70 && !isAlcoholAffected && stressors?.subjectiveStress !== 5) {
      return "Moderate intensity recommended. Body is recovering steadily; focus on technical drilling, mobility, or steady-state calisthenics.";
    } else {
      return "Suggesting active recovery or rest. Central nervous system is fatigued or impacted by lifestyle stressors; prioritize sauna, cold plunge, and sleep hygiene.";
    }
  };

  if (!apiKey) {
    console.log('No GEMINI_API_KEY found, using rule-based recommendation engine.');
    return getHeuristicRecommendation();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a Zen master, BJJ black belt, and elite athletic coach. Evaluate the athlete's morning biometrics:
- Readiness Score: ${readiness}/100
- HRV (Heart Rate Variability): ${hrv} ms
- Sleep Score: ${sleep}/100
- Resting Heart Rate: ${rhr} bpm

Lifestyle Stressors from yesterday:
- Alcohol consumed: ${stressors?.alcohol.consumed ? `Yes, ${stressors.alcohol.numberOfDrinks || 1} drinks (${stressors.alcohol.lateConsumption ? 'within 3h of bed' : 'earlier in the day'})` : 'No'}
- Late-night heavy meal: ${stressors?.lateHeavyMeal ? 'Yes (within 3h of bed)' : 'No'}
- Subjective mental/life stress: ${stressors?.subjectiveStress ?? 1}/5

Provide a single-sentence recommendation (under 25 words) advising whether they should go hard (strength/grappling), focus on technical/moderate work, or do active recovery/rest. Be direct, philosophical, and practical. Highlight if any stressors like late-night eating or alcohol likely degraded their recovery. Do not use quotes or introductory tags in the output.`,
    });

    return response.text?.trim() || getHeuristicRecommendation();
  } catch (error) {
    console.error('Failed to generate recommendation via Gemini API, falling back:', error);
    return getHeuristicRecommendation();
  }
}
