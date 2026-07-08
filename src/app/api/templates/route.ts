import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import templatesData from '@/data/workout-templates.json';

export const dynamic = 'force-dynamic';

const filePath = path.join(process.cwd(), 'src/data/workout-templates.json');

export async function GET() {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    console.warn('FileSystem read failed, falling back to bundled templates:', error);
    return NextResponse.json(templatesData);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid templates format' }, { status: 400 });
    }

    // Write formatted JSON back to file
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error writing templates:', error);
    return NextResponse.json({ error: error.message || 'Failed to save templates' }, { status: 500 });
  }
}
