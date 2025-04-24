import { NextResponse } from 'next/server';

export async function POST() {
  // 항상 성공 응답
  return NextResponse.json({
    verified: true
  });
} 