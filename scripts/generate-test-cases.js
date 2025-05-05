const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// JSON 파일 불러오기
const reportConfigPath = path.join(__dirname, '..', 'content', 'report-config.json');
const questionsPath = path.join(__dirname, '..', 'content', 'questions.json');

const reportConfig = JSON.parse(fs.readFileSync(reportConfigPath, 'utf-8'));
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

// 카테고리 정보 추출
const categories = {};
questions.forEach(q => {
  if (!categories[q.category]) {
    categories[q.category] = [];
  }
  categories[q.category].push(q.id);
});

// 임의의 답변 생성 (1~5 또는 0~3 범위, 카테고리에 따라 다름)
function generateRandomAnswers() {
  const answers = {};
  
  questions.forEach(q => {
    // BAI 불안척도는 0-3 범위, 나머지는 1-5 범위
    const min = q.category === 'BAI 불안척도' ? 0 : 1;
    const max = q.category === 'BAI 불안척도' ? 3 : 5;
    
    answers[q.id] = Math.floor(Math.random() * (max - min + 1)) + min;
  });
  
  return answers;
}

// 특정 패턴의 답변 생성 (예: 모두 높음, 모두 낮음, 특정 카테고리만 높음 등)
function generatePatterndAnswers(pattern) {
  const answers = {};
  
  switch(pattern) {
    case 'all_high':
      questions.forEach(q => {
        answers[q.id] = q.category === 'BAI 불안척도' ? 3 : 5;
      });
      break;
    case 'all_medium':
      questions.forEach(q => {
        answers[q.id] = q.category === 'BAI 불안척도' ? 2 : 3;
      });
      break;
    case 'all_low':
      questions.forEach(q => {
        answers[q.id] = q.category === 'BAI 불안척도' ? 0 : 1;
      });
      break;
    case 'parent_efficacy_high':
      questions.forEach(q => {
        if (q.category === '부모역할 효능감으로 인한 불안') {
          answers[q.id] = 5;
        } else {
          answers[q.id] = q.category === 'BAI 불안척도' ? 1 : 2;
        }
      });
      break;
    case 'attachment_high':
      questions.forEach(q => {
        if (q.category === '자녀와의 애착에 대한 불안') {
          answers[q.id] = 5;
        } else {
          answers[q.id] = q.category === 'BAI 불안척도' ? 1 : 2;
        }
      });
      break;
    // 추가 패턴들...
    default:
      return generateRandomAnswers();
  }
  
  return answers;
}

// 응답에 따른 결과 계산
function calculateResults(answers) {
  // 카테고리별 평균 계산
  const categoryResults = {};
  
  Object.entries(categories).forEach(([category, questionIds]) => {
    const values = questionIds.map(id => answers[id] || 0);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = values.length ? sum / values.length : 0;
    
    let label = '';
    let description = '';
    
    if (category === 'BAI 불안척도') {
      // BAI는 합계 점수로 등급 결정
      const sum = values.reduce((a, b) => a + b, 0);
      const thresholdEntry = findThreshold(reportConfig.thresholds.categories[category], sum);
      
      categoryResults[category] = {
        sum,
        mean,
        label: thresholdEntry?.label || '',
        description: thresholdEntry?.description || ''
      };
    } else {
      // 다른 카테고리는 평균으로 등급 결정
      const thresholdEntry = findThreshold(reportConfig.thresholds.categories[category], mean);
      
      categoryResults[category] = {
        mean,
        label: thresholdEntry?.label || '',
        description: thresholdEntry?.description || ''
      };
    }
  });
  
  // 전체 평균 계산 (BAI 제외)
  const globalCats = reportConfig.scales.find(s => s.categories)?.categories || [];
  const means = globalCats.map(cat => categoryResults[cat]?.mean || 0);
  const globalMean = means.reduce((a, b) => a + b, 0) / means.length;
  const globalEntry = findThreshold(reportConfig.thresholds.globalAverage, globalMean);
  
  const globalResult = {
    mean: globalMean,
    label: globalEntry?.label || '',
    description: globalEntry?.description || ''
  };
  
  // BAI 결과
  const baiCategory = '바이 불안척도';
  const baiResult = categoryResults[baiCategory] || categoryResults['BAI 불안척도'] || {
    sum: 0,
    label: '',
    description: ''
  };
  
  return {
    categoryResults,
    globalResult,
    baiResult
  };
}

// 임계값 기준 찾기
function findThreshold(entries, value) {
  return entries.find(e => {
    if (e.min !== undefined && e.max !== undefined) {
      return value >= e.min && value < e.max;
    }
    if (e.min !== undefined) {
      return value >= e.min;
    }
    if (e.max !== undefined) {
      return value <= e.max;
    }
    return false;
  });
}

// 30개의 테스트 케이스 생성
function generateTestCases() {
  const testCases = [];
  
  // 특정 패턴의 케이스들
  const patterns = [
    'all_high', 'all_medium', 'all_low', 
    'parent_efficacy_high', 'attachment_high'
  ];
  
  patterns.forEach(pattern => {
    const answers = generatePatterndAnswers(pattern);
    const results = calculateResults(answers);
    
    testCases.push({
      pattern,
      answers,
      results
    });
  });
  
  // 나머지는 랜덤 케이스로 채우기
  for (let i = testCases.length; i < 30; i++) {
    const answers = generateRandomAnswers();
    const results = calculateResults(answers);
    
    testCases.push({
      pattern: `random_${i}`,
      answers,
      results
    });
  }
  
  return testCases;
}

// 테스트 케이스를 엑셀 데이터로 변환
function convertToExcelData(testCases) {
  const data = [];
  
  // 헤더 행 추가
  const headers = [
    '케이스번호', '패턴', 
    '전체평균점수', '전체평균등급', '전체평균멘트',
    '부모역할점수', '부모역할등급', '부모역할멘트',
    '자녀애착점수', '자녀애착등급', '자녀애착멘트',
    '자녀염려점수', '자녀염려등급', '자녀염려멘트',
    '사회적지지점수', '사회적지지등급', '사회적지지멘트',
    '완벽주의점수', '완벽주의등급', '완벽주의멘트',
    'BAI점수', 'BAI등급', 'BAI멘트'
  ];
  
  // 질문 ID를 헤더에 추가
  questions.forEach(q => {
    headers.push(`Q${q.id}`);
  });
  
  data.push(headers);
  
  // 각 테스트 케이스에 대한 데이터 행 생성
  testCases.forEach((testCase, index) => {
    const { pattern, answers, results } = testCase;
    
    const row = [
      index + 1,
      pattern,
      results.globalResult.mean.toFixed(2),
      results.globalResult.label,
      results.globalResult.description,
    ];
    
    // 각 카테고리별 결과 추가
    const addCategoryData = (category) => {
      const result = results.categoryResults[category] || { mean: 0, label: '', description: '' };
      row.push(
        result.mean ? result.mean.toFixed(2) : '0.00',
        result.label,
        result.description
      );
    };
    
    addCategoryData('부모역할 효능감으로 인한 불안');
    addCategoryData('자녀와의 애착에 대한 불안');
    addCategoryData('자녀에 대한 염려');
    addCategoryData('사회적 지지에 대한 염려');
    addCategoryData('완벽주의로 인한 불안');
    
    // BAI 점수는 합계 사용
    const baiResult = results.baiResult;
    row.push(
      baiResult.sum,
      baiResult.label,
      baiResult.description
    );
    
    // 각 질문에 대한 답변 추가
    questions.forEach(q => {
      row.push(answers[q.id]);
    });
    
    data.push(row);
  });
  
  return data;
}

// 엑셀 파일 생성 및 저장
function saveToExcel(data, filename) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  XLSX.utils.book_append_sheet(wb, ws, '테스트 케이스');
  
  // 열 너비 설정
  const colWidths = data[0].map((_, i) => {
    if (i >= 2 && i <= 22 && (i - 2) % 3 === 2) { // 멘트 열
      return { width: 60 };
    }
    return { width: 15 };
  });
  
  ws['!cols'] = colWidths;
  
  XLSX.writeFile(wb, filename);
  
  console.log(`엑셀 파일이 저장되었습니다: ${filename}`);
}

// 메인 실행 함수
function main() {
  try {
    console.log('테스트 케이스 생성 중...');
    const testCases = generateTestCases();
    
    console.log('엑셀 데이터 변환 중...');
    const excelData = convertToExcelData(testCases);
    
    console.log('엑셀 파일 저장 중...');
    const filename = path.join(__dirname, 'test-cases.xlsx');
    saveToExcel(excelData, filename);
    
    console.log(`총 ${testCases.length}개의 테스트 케이스가 생성되었습니다.`);
    
    // 상세 테스트 케이스 JSON으로도 저장
    const detailFilename = path.join(__dirname, 'test-cases-detail.json');
    fs.writeFileSync(detailFilename, JSON.stringify(testCases, null, 2));
    console.log(`상세 테스트 케이스가 JSON으로 저장되었습니다: ${detailFilename}`);
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 스크립트 실행
main(); 