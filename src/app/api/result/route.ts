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
  const { answers } = await request.json();

  // Attempt to save raw answers to Firestore (skip if misconfigured)
  let rawDocRef!: admin.firestore.DocumentReference<admin.firestore.DocumentData>;
  try {
    rawDocRef = firestore.collection('responses').doc();
    await rawDocRef.set({ answers, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  } catch (e) {
    console.warn('[Result API] Firestore write skipped:', e);
  }

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

  // Attempt to save computed results (skip if write failed)
  if (rawDocRef) {
    try {
      await rawDocRef.update({ categoryResults, globalResult, baiResult });
    } catch (e) {
      console.warn('[Result API] Firestore update skipped:', e);
    }
  }

  return NextResponse.json({ categoryResults, globalResult, baiResult });
} 