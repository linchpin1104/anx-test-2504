import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { firestore } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

// Interface for threshold entries
interface ThresholdEntry {
  min?: number;
  max?: number;
  label?: string;
  description?: string;
}

// Interface for report-config.json structure
interface ReportConfig {
  thresholds: {
    categories: Record<string, ThresholdEntry[]>;
    globalAverage: ThresholdEntry[];
  };
  scales: Array<{ categories: string[] }>;
}

export async function POST(request: Request) {
  // Parse request body
  const { answers, userInfo } = await request.json();
  
  // 필수 사용자 정보 확인
  if (!userInfo || !userInfo.phone) {
    return NextResponse.json(
      { success: false, message: '사용자 정보가 유효하지 않습니다.' },
      { status: 400 }
    );
  }

  // 사용자 ID로 전화번호 사용 (고유 식별자)
  const userId = userInfo.phone;
  
  // 먼저 사용자 문서 참조 가져오기
  const userRef = firestore.collection('users').doc(userId);

  // Load questions
  const qPath = join(process.cwd(), 'content', 'questions.json');
  const qJson = await fs.readFile(qPath, 'utf8');
  const questions: { category: string; id: string }[] = JSON.parse(qJson);

  // Load report-config
  const rcPath = join(process.cwd(), 'content', 'report-config.json');
  const rcJson = await fs.readFile(rcPath, 'utf8');
  const reportConfig = JSON.parse(rcJson) as ReportConfig;
  const thresholds = reportConfig.thresholds;

  // Group answers by category
  const categoryValues: Record<string, number[]> = {};
  questions.forEach((q) => {
    const val = answers[q.id];
    if (val === undefined) return;
    const num = Number(val);
    if (!categoryValues[q.category]) categoryValues[q.category] = [];
    categoryValues[q.category].push(num);
  });

  // Helper to find threshold entry
  const findThreshold = (entries: ThresholdEntry[], value: number): ThresholdEntry | undefined => {
    return entries.find((e) => {
      if (e.min !== undefined && e.max !== undefined) return value >= e.min && value < e.max;
      if (e.min !== undefined) return value >= e.min;
      if (e.max !== undefined) return value <= e.max;
      return false;
    });
  };

  // Compute category results
  const categoryResults: Record<string, { mean: number; label: string; description: string }> = {};
  for (const cat in thresholds.categories) {
    const values = categoryValues[cat] || [];
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = values.length ? sum / values.length : 0;
    const entry = findThreshold(thresholds.categories[cat], mean);
    categoryResults[cat] = {
      mean,
      label: entry?.label || '',
      description: entry?.description || '',
    };
  }

  // Compute global average for the five parenting categories
  const globalCats: string[] = reportConfig.scales.find((s) => s.categories)?.categories ?? [];
  const means = globalCats.map((cat) => categoryResults[cat]?.mean || 0);
  const globalMean = means.reduce((a, b) => a + b, 0) / means.length;
  const globalEntry = findThreshold(thresholds.globalAverage, globalMean);
  const globalResult = {
    mean: globalMean,
    label: globalEntry?.label || '',
    description: globalEntry?.description || '',
  };

  // Compute BAI sum and result
  const baiValues = categoryValues['BAI 불안척도'] || [];
  const baiSum = baiValues.reduce((a, b) => a + b, 0);
  const baiEntry = findThreshold(thresholds.categories['BAI 불안척도'], baiSum);
  const baiResult = {
    sum: baiSum,
    label: baiEntry?.label || '',
    description: baiEntry?.description || '',
  };

  let resultId = '';

  // Firestore에 데이터 저장
  try {
    // 트랜잭션으로 사용자 정보 업데이트 및 결과 저장
    await firestore.runTransaction(async (transaction) => {
      // 1. 사용자 정보 저장/업데이트
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        // 새 사용자 생성
        transaction.set(userRef, {
          name: userInfo.name,
          phone: userInfo.phone,
          childAge: userInfo.childAge,
          childGender: userInfo.childGender,
          parentAgeGroup: userInfo.parentAgeGroup,
          caregiverType: userInfo.caregiverType,
          region: userInfo.region || '',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // 기존 사용자 업데이트
        transaction.update(userRef, {
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          // 추가 필드가 있으면 업데이트
          ...(userInfo.childAge && { childAge: userInfo.childAge }),
          ...(userInfo.childGender && { childGender: userInfo.childGender }),
          ...(userInfo.parentAgeGroup && { parentAgeGroup: userInfo.parentAgeGroup }),
          ...(userInfo.caregiverType && { caregiverType: userInfo.caregiverType }),
          ...(userInfo.region && { region: userInfo.region }),
        });
      }

      // 2. 검사 결과 저장 (사용자의 results 서브컬렉션)
      const resultRef = userRef.collection('results').doc();
      resultId = resultRef.id;
      
      transaction.set(resultRef, {
        answers,
        categoryResults,
        globalResult,
        baiResult,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. 기존 'responses' 컬렉션에도 호환성을 위해 저장 (선택적)
      const legacyRef = firestore.collection('responses').doc();
      transaction.set(legacyRef, {
        answers,
        categoryResults,
        globalResult,
        baiResult,
        userInfo,
        userId,
        resultId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    // 결과 반환 - 결과 ID도 포함
    return NextResponse.json({ 
      success: true,
      resultId,
      categoryResults, 
      globalResult, 
      baiResult
    });
    
  } catch (error) {
    console.error('[Result API] Firestore write error:', error);
    return NextResponse.json(
      { success: false, message: '결과 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 