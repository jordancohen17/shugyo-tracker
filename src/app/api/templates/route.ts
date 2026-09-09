import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import defaultTemplatesData from '@/data/workout-templates.json';

export const dynamic = 'force-dynamic';

const filePath = path.join(process.cwd(), 'src/data/workout-templates.json');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('default') === 'true') {
      return NextResponse.json(defaultTemplatesData);
    }

    const data = await fs.readFile(filePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    console.warn('FileSystem read failed, falling back to bundled templates:', error);
    return NextResponse.json(defaultTemplatesData);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid templates format' }, { status: 400 });
    }

    // Attempt to write formatted JSON back to file (works in local dev)
    try {
      await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf8');
    } catch (fsError: any) {
      console.warn('FileSystem write failed (read-only environment):', fsError.message);
      // Return success with note so client localStorage can persist without failing UI
      return NextResponse.json({ success: true, persistedToFile: false, note: fsError.message });
    }

    return NextResponse.json({ success: true, persistedToFile: true });
  } catch (error: any) {
    console.error('Error writing templates:', error);
    return NextResponse.json({ error: error.message || 'Failed to save templates' }, { status: 500 });
  }
}

