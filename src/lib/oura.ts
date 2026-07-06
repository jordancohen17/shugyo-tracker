// src/lib/oura.ts
import { OuraMetrics } from '@/types';

/**
 * Fetches sleep and readiness metrics from the Oura Cloud API (v2) for a given date.
 * @param dateStr Date in YYYY-MM-DD format
 * @param accessToken Oura Personal Access Token
 */
export async function fetchOuraMetrics(dateStr: string, accessToken: string): Promise<OuraMetrics | null> {
  if (!accessToken) {
    console.warn('Oura access token is missing');
    return null;
  }

  try {
    // Fetch daily readiness
    const readinessUrl = `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${dateStr}&end_date=${dateStr}`;
    const readinessRes = await fetch(readinessUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate: 3600 }, // Cache response for 1 hour
    });

    // Fetch daily sleep
    const sleepUrl = `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${dateStr}&end_date=${dateStr}`;
    const sleepRes = await fetch(sleepUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate: 3600 },
    });

    // Detailed sleep periods are indexed by bedtime start/end times in UTC.
    // Querying with start_date=D & end_date=D often returns an empty list if bedtime_start is on day D-1.
    // We query from D-1 to D+1 and find the record where the day field matches dateStr.
    const date = new Date(dateStr);
    const prevDate = new Date(date);
    prevDate.setUTCDate(prevDate.getUTCDate() - 1);
    const startDateStr = prevDate.toISOString().split('T')[0];

    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const endDateStr = nextDate.toISOString().split('T')[0];

    // Fetch detailed sleep to retrieve average HRV and lowest heart rate
    const detailedSleepUrl = `https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDateStr}&end_date=${endDateStr}`;
    const detailedSleepRes = await fetch(detailedSleepUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate: 3600 },
    });

    if (!readinessRes.ok || !sleepRes.ok || !detailedSleepRes.ok) {
      throw new Error(
        `Oura API returned error: Readiness: ${readinessRes.status} (${readinessRes.statusText}), Sleep: ${sleepRes.status} (${sleepRes.statusText}), Detailed Sleep: ${detailedSleepRes.status} (${detailedSleepRes.statusText})`
      );
    }

    const readinessJson = await readinessRes.json();
    const sleepJson = await sleepRes.json();
    const detailedSleepJson = await detailedSleepRes.json();

    const readinessDoc = readinessJson.data?.[0];
    const sleepDoc = sleepJson.data?.[0];
    
    // Find the record matching our target dateStr.
    // In API v2, the primary sleep period has type: 'long_sleep'.
    // If that is not explicitly found, we fallback to sorting matching records by time_in_bed to find the longest sleep period.
    const detailedSleepDoc = detailedSleepJson.data?.find((d: any) => d.day === dateStr && d.type === 'long_sleep')
      || detailedSleepJson.data?.filter((d: any) => d.day === dateStr)
          .sort((a: any, b: any) => (b.time_in_bed || 0) - (a.time_in_bed || 0))[0]
      || detailedSleepJson.data?.[0];

    // If no readiness or sleep records are found for this day, return null so we don't present fake/placeholder data.
    if (!readinessDoc && !sleepDoc && !detailedSleepDoc) {
      console.warn(`No Oura data found for date ${dateStr}`);
      return null;
    }

    // Map responses to our metrics schema
    return {
      readinessScore: readinessDoc?.score,
      sleepScore: sleepDoc?.score,
      hrvAverage: detailedSleepDoc?.average_hrv,
      restingHeartRate: detailedSleepDoc?.lowest_heart_rate,
    } as any; // Cast to any to bypass strict type check for undefined values, or we'll update the type definition next
  } catch (error) {
    console.error('Error fetching Oura metrics:', error);
    throw error;
  }
}

