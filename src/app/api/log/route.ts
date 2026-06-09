import { NextResponse } from 'next/server';
import { syncLogToGoogleSheet, fetchLogsFromGoogleSheet } from '@/lib/google-sheets';
import { DailyLogEntry } from '@/types';

export async function GET() {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      return NextResponse.json(
        { error: 'GOOGLE_SHEET_ID is not configured in environment variables.' },
        { status: 500 }
      );
    }

    const logs = await fetchLogsFromGoogleSheet(sheetId);

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('API Log Read Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during spreadsheet reading.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const entry: DailyLogEntry = await request.json();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!entry || !entry.day) {
      return NextResponse.json(
        { error: 'Invalid payload. "day" parameter is required.' },
        { status: 400 }
      );
    }

    if (!sheetId) {
      return NextResponse.json(
        { error: 'GOOGLE_SHEET_ID is not configured in environment variables.' },
        { status: 500 }
      );
    }

    // Write to Google Sheets
    const result = await syncLogToGoogleSheet(entry, sheetId);

    return NextResponse.json({
      success: true,
      day: entry.day,
      action: result.action,
    });
  } catch (error: any) {
    console.error('API Log Write Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during spreadsheet logging.' },
      { status: 500 }
    );
  }
}
