import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
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
  
  // Load questions
  const qPath = join(process.cwd(), 'content', 'questions.json');
  const qJson = await fs.readFile(qPath, 'utf8');
  const questions: { category: string; id: string }[] = JSON.parse(qJson);

  // Load report-config
  const rcPath = join(process.cwd(), 'content', 'report-config.json');
  const rcJson = await fs.readFile(rcPath, 'utf8');
  const reportConfig = JSON.parse(rcJson) as ReportConfig;

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
  Object.entries(categoryValues).forEach(([category, values]) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const threshold = findThreshold(reportConfig.thresholds.categories[category] || [], mean);
    categoryResults[category] = {
      mean,
      label: threshold?.label || '평가 불가',
      description: threshold?.description || '결과를 평가할 수 없습니다.'
    };
  });

  // Compute global result
  const globalValues = Object.values(categoryResults)
    .filter(r => r.label !== '평가 불가')
    .map(r => r.mean);
  const globalMean = globalValues.reduce((a, b) => a + b, 0) / globalValues.length;
  const globalThreshold = findThreshold(reportConfig.thresholds.globalAverage, globalMean);
  const globalResult = {
    mean: globalMean,
    label: globalThreshold?.label || '평가 불가',
    description: globalThreshold?.description || '결과를 평가할 수 없습니다.'
  };

  // Compute BAI result
  const baiValues = categoryValues['BAI 불안척도'] || [];
  const baiSum = baiValues.reduce((a, b) => a + b, 0);
  const baiThreshold = findThreshold(reportConfig.thresholds.categories['BAI 불안척도'] || [], baiSum);
  const baiResult = {
    sum: baiSum,
    label: baiThreshold?.label || '평가 불가',
    description: baiThreshold?.description || '결과를 평가할 수 없습니다.'
  };

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Generate a unique result ID
  const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // 개발 환경에서는 Firebase 저장을 건너뛰고 바로 결과 반환
    if (isDevelopment) {
      console.log('[DEV] 개발 모드에서 Firebase 저장을 건너뜁니다.');
      return NextResponse.json({ 
        success: true,
        resultId,
        categoryResults, 
        globalResult, 
        baiResult
      });
    }

    // 프로덕션 환경에서는 Firebase에 저장
    if (firestore && typeof firestore.collection === 'function') {
      await firestore.runTransaction(async (transaction) => {
        // 1. 사용자 정보 저장/업데이트
        const userRef = firestore.collection('users').doc(userId);
        transaction.set(userRef, {
          ...userInfo,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 2. 결과 저장 (새로운 구조)
        const resultRef = userRef.collection('results').doc(resultId);
        transaction.set(resultRef, {
          answers,
          categoryResults,
          globalResult,
          baiResult,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 3. 레거시 구조에도 저장 (호환성 유지)
        const legacyRef = firestore.collection('responses').doc(resultId);
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
    } else {
      console.warn('[Result API] Firestore not initialized or not properly configured');
      if (!isDevelopment) {
        throw new Error('데이터베이스 연결에 실패했습니다.');
      }
    }
    
    // 결과 반환
    return NextResponse.json({ 
      success: true,
      resultId,
      categoryResults, 
      globalResult, 
      baiResult,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
  } catch (error) {
    console.error('[Result API] Error:', error);
    
    // 개발 환경에서는 에러를 무시하고 결과 반환
    if (isDevelopment) {
      console.log('[DEV] 개발 모드에서 에러를 무시하고 결과를 반환합니다.');
      return NextResponse.json({ 
        success: true,
        resultId,
        categoryResults, 
        globalResult, 
        baiResult
      });
    }
    
    return NextResponse.json(
      { success: false, message: '결과 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사용자별 최신 검사 결과를 불러오는 GET API
export async function GET(request: NextRequest) {
  try {
    // URL에서 사용자 ID (전화번호) 파라미터 추출
    const url = request.nextUrl;
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 개발 환경에서는 임시 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] 개발 모드에서 임시 결과를 반환합니다.', { userId });
      
      // 이미 로컬 스토리지에 데이터가 있다면 불러올 수 있게 설정
      return NextResponse.json({
        success: true,
        message: '개발 환경에서는 로컬 스토리지의 데이터를 사용합니다.',
        useLocalStorage: true
      });
    }
    
    // 프로덕션 환경에서는 Firestore에서 데이터 검색
    if (!firestore) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    
    // 사용자의 최신 검사 결과 가져오기
    const userRef = firestore.collection('users').doc(userId);
    const resultsRef = userRef.collection('results');
    const resultsSnapshot = await resultsRef
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (resultsSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: '검사 결과를 찾을 수 없습니다.',
        noResult: true
      });
    }
    
    // 결과 데이터 추출
    const resultDoc = resultsSnapshot.docs[0];
    const resultData = resultDoc.data();
    
    // 사용자 정보 가져오기
    const userSnapshot = await userRef.get();
    const userInfo = userSnapshot.exists ? userSnapshot.data() : null;
    
    // 결과 반환
    return NextResponse.json({
      success: true,
      resultId: resultDoc.id,
      categoryResults: resultData.categoryResults,
      globalResult: resultData.globalResult,
      baiResult: resultData.baiResult,
      userInfo,
      createdAt: resultData.createdAt?.toDate?.() || null
    });
    
  } catch (error) {
    console.error('[Result API GET] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: '결과를 불러오는 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
} 