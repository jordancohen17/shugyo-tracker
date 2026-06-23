// src/app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { fetchOuraMetrics } from '@/lib/oura';
import { generateAutoregulationRecommendation } from '@/lib/llm';
import { syncLogToGoogleSheet } from '@/lib/google-sheets';
import { DailyLogEntry } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get('day');

  if (!day) {
    return NextResponse.json(
      { error: 'Missing required query parameter "day" (format YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  const ouraToken = process.env.OURA_ACCESS_TOKEN;
  const geminiKey = process.env.GEMINI_API_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!ouraToken) {
    return NextResponse.json(
      { error: 'OURA_ACCESS_TOKEN is not configured in environment variables.' },
      { status: 500 }
    );
  }

  try {
    // 1. Fetch metrics from Oura Cloud
    const ouraMetrics = await fetchOuraMetrics(day, ouraToken);

    // 2. Generate Autoregulation recommendation via Gemini or Rule Engine
    const recommendation = await generateAutoregulationRecommendation(ouraMetrics, undefined, geminiKey);

    // 3. Write or update Google Sheet entry
    let syncStatus = null;
    if (sheetId) {
      const entry: DailyLogEntry = {
        day,
        oura: ouraMetrics,
        workout: null, // Just syncing morning status; workout details will sync via the logger route
        grappling: null,
        recovery: {
          sauna: { completed: false },
          coldPlunge: { completed: false },
          sleepHygiene: { noScreensBeforeBed: false, magnesiumTaken: false, coolRoomTemp: false },
        },
        stressors: {
          alcohol: { consumed: false, numberOfDrinks: 0, lateConsumption: false },
          lateHeavyMeal: false,
          subjectiveStress: 1,
        },
        llmRecommendation: recommendation,
      };
      syncStatus = await syncLogToGoogleSheet(entry, sheetId);
    } else {
      console.warn('GOOGLE_SHEET_ID is not configured, skipping spreadsheet write.');
    }

    return NextResponse.json({
      success: true,
      day,
      oura: ouraMetrics,
      recommendation,
      sheetsSynced: !!sheetId,
      action: syncStatus?.action || 'skipped',
    });
  } catch (error: any) {
    console.error('API Sync Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during synchronization.' },
      { status: 500 }
    );
  }
}
