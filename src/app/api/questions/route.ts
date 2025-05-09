import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read the questions.json file from the content directory
    const filePath = join(process.cwd(), 'content', 'questions.json');
    const json = await fs.readFile(filePath, 'utf8');
    const questions = JSON.parse(json);

    // Return the JSON data as API response with success flag
    return NextResponse.json({
      success: true,
      questions: questions
    });
  } catch (error) {
    console.error('질문 데이터 로드 오류:', error);
    return NextResponse.json({
      success: false,
      message: '질문 데이터를 불러오는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
} 