import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

export async function GET(_request: NextRequest) {
  // Read the report-config.json file from the content directory
  const filePath = join(process.cwd(), 'content', 'report-config.json');
  const json = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(json);

  // Return the JSON data as API response
  return NextResponse.json(data);
} 