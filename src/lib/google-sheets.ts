// src/lib/google-sheets.ts
import { google } from 'googleapis';
import { DailyLogEntry } from '@/types';

/**
 * Instantiates the Google Sheets API client using JWT (Service Account).
 */
function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error('Google Sheets API credentials are not configured in environment variables.');
  }

  // Handle escaped newlines in env vars
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email,
    key: formattedKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Formats the workout section (Strength + EMS + Mobility) into a structured string for the cell.
 */
function formatWorkoutCell(workout: DailyLogEntry['workout']): string {
  if (!workout) return '';
  const lines: string[] = [];

  // Strength Exercises
  if (workout.strength && workout.strength.length > 0) {
    const strengthLines = workout.strength.map((ex) => {
      const setDetails = ex.log
        .map((s) => `${s.weight}lbs ${s.sets}x${s.reps}${s.isAmrap ? ' AMRAP' : ''}`)
        .join(', ');
      return `• ${ex.name}: ${setDetails}`;
    });
    lines.push('[Strength / Calisthenics]\n' + strengthLines.join('\n'));
  }

  // EMS Suit
  if (workout.ems?.isEmsDay) {
    const emsInfo = [
      `Program: ${workout.ems.programType || 'None'}`,
      `Core Intensity: ${workout.ems.coreIntensity ?? 0}/10`,
      `Upper: ${workout.ems.upperIntensity ?? 0}/10, Lower: ${workout.ems.lowerIntensity ?? 0}/10`
    ].join('\n');
    lines.push('[Katalyst EMS Suit]\n' + emsInfo);
  }

  // Mobility
  if (workout.mobility && workout.mobility.durationMinutes > 0) {
    const activeMobility = workout.mobility.categories
      .filter((cat) => cat.exercises.some((ex) => ex.completed))
      .map((cat) => {
        const completedEx = cat.exercises
          .filter((ex) => ex.completed)
          .map((ex) => ex.name)
          .join(', ');
        return `  - ${cat.categoryName}: ${completedEx}`;
      });

    if (activeMobility.length > 0) {
      lines.push(
        `[Mobility - ${workout.mobility.durationMinutes} mins]\n` + activeMobility.join('\n')
      );
    }
  }

  return lines.join('\n\n');
}

/**
 * Formats the Oura data for the spreadsheet column.
 */
function formatOuraCell(oura: DailyLogEntry['oura']): string {
  if (!oura) return '';
  return `Readiness: ${oura.readinessScore} | Sleep: ${oura.sleepScore} | HRV: ${oura.hrvAverage}ms | RHR: ${oura.restingHeartRate}bpm`;
}

/**
 * Formats the Grappling log.
 */
function formatGrapplingCell(grappling: DailyLogEntry['grappling']): string {
  if (!grappling) return '';
  return `${grappling.matIntensity} (Intensity) | Duration: ${grappling.durationMinutes}m | Focus: ${grappling.technicalFocus}`;
}

/**
 * Formats the lifestyle stressors log.
 */
function formatStressorsCell(stressors: DailyLogEntry['stressors']): string {
  if (!stressors) return '';
  const parts: string[] = [];

  if (stressors.alcohol.consumed) {
    const drinks = stressors.alcohol.numberOfDrinks || 1;
    const timing = stressors.alcohol.lateConsumption ? ' (Late)' : '';
    parts.push(`Alcohol: ${drinks} drink${drinks > 1 ? 's' : ''}${timing}`);
  }

  if (stressors.lateHeavyMeal) {
    parts.push('Late Heavy Meal');
  }

  if (stressors.subjectiveStress > 1) {
    parts.push(`Stress: ${stressors.subjectiveStress}/5`);
  }

  return parts.join(' | ') || 'None';
}

import fs from 'fs';
import path from 'path';

/**
 * Synchronizes (upserts) a daily log entry into the Google Sheet.
 * @param entry The daily log entry object
 * @param sheetId The target Google Sheet spreadsheet ID
 */
export async function syncLogToGoogleSheet(entry: DailyLogEntry, sheetId: string): Promise<{ success: boolean; action: 'updated' | 'appended' }> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    console.warn('Google Sheets API credentials are not configured. Simulating sync to Google Sheets...');
    const mockFilePath = path.join(process.cwd(), 'mock_sheet_sync.json');
    
    let existingLogs = [];
    if (fs.existsSync(mockFilePath)) {
      try {
        existingLogs = JSON.parse(fs.readFileSync(mockFilePath, 'utf8'));
      } catch (e) {
        existingLogs = [];
      }
    }
    
    const rowData = {
      day: entry.day,
      oura: formatOuraCell(entry.oura),
      workout: formatWorkoutCell(entry.workout),
      grappling: formatGrapplingCell(entry.grappling),
      stressors: formatStressorsCell(entry.stressors),
      timestamp: new Date().toISOString()
    };
    
    const existingIndex = existingLogs.findIndex((log: any) => log.day === entry.day);
    let action: 'updated' | 'appended' = 'appended';
    if (existingIndex !== -1) {
      existingLogs[existingIndex] = rowData;
      action = 'updated';
    } else {
      existingLogs.push(rowData);
    }
    
    fs.writeFileSync(mockFilePath, JSON.stringify(existingLogs, null, 2), 'utf8');
    console.log(`Mock Sync: Logged data for ${entry.day} to mock_sheet_sync.json (action: ${action})`);
    
    return { success: true, action };
  }

  const tabName = process.env.GOOGLE_SHEET_TAB_NAME || 'ShugyoLog';
  const sheets = getSheetsClient();

  // Verify if the tab exists in the spreadsheet, and create it if not
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });
  const sheetsList = spreadsheet.data.sheets || [];
  const tabExists = sheetsList.some((s) => s.properties?.title === tabName);

  if (!tabExists) {
    console.log(`Tab "${tabName}" not found in sheet. Creating it...`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: tabName,
              },
            },
          },
        ],
      },
    });
  }

  const rangeName = `${tabName}!A:E`; // Scopes first 5 columns

  // Fetch all rows to locate if the Day already exists
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: rangeName,
  });

  const rows = response.data.values || [];
  const headers = rows[0] || [];

  // Row format to write: [Day, Oura Readiness, Workout, BJJ Intensity, Lifestyle Stressors]
  const rowData = [
    entry.day,
    formatOuraCell(entry.oura),
    formatWorkoutCell(entry.workout),
    formatGrapplingCell(entry.grappling),
    formatStressorsCell(entry.stressors),
  ];

  // Find index of matching day (skipping header row)
  let matchingRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === entry.day) {
      matchingRowIndex = i;
      break;
    }
  }

    if (matchingRowIndex !== -1) {
    // Update existing row
    // Google Sheets is 1-indexed, so matchingRowIndex + 1 is the actual row number
    const updateRange = `${tabName}!A${matchingRowIndex + 1}:E${matchingRowIndex + 1}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: updateRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });
    return { success: true, action: 'updated' };
  } else {
    // Append new row
    if (rows.length === 0) {
      // Write header row first for a clean sheet
      const defaultHeaders = ['Day', 'Oura Readiness', 'Workout (Strength + EMS + Mobility)', 'BJJ Mat Intensity', 'Lifestyle Stressors'];
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${tabName}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [defaultHeaders, rowData],
        },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${tabName}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowData],
        },
      });
    }
    return { success: true, action: 'appended' };
  }
}

/**
 * Fetches all daily log entries from the Google Sheet.
 * @param sheetId The target Google Sheet spreadsheet ID
 */
export async function fetchLogsFromGoogleSheet(sheetId: string): Promise<any[]> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const tabName = process.env.GOOGLE_SHEET_TAB_NAME || 'ShugyoLog';

  if (!email || !privateKey) {
    console.warn('Google Sheets API credentials are not configured. Reading mock logs locally...');
    const mockFilePath = path.join(process.cwd(), 'mock_sheet_sync.json');
    if (fs.existsSync(mockFilePath)) {
      try {
        return JSON.parse(fs.readFileSync(mockFilePath, 'utf8'));
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  try {
    const sheets = getSheetsClient();
    const rangeName = `${tabName}!A:E`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: rangeName,
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return [];

    // Parse rows, skipping header (index 0)
    return rows.slice(1).map((row) => ({
      day: row[0] || '',
      oura: row[1] || '',
      workout: row[2] || '',
      grappling: row[3] || '',
      stressors: row[4] || '',
    }));
  } catch (error) {
    console.error('Error fetching logs from Google Sheets, returning empty:', error);
    return [];
  }
}
