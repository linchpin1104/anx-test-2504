import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
// Firebase Admin SDK는 제거합니다

// Set the proper runtime for OG image generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    // Get ID from URL params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('Generating OG image for ID:', id);
    
    // Generate a static image regardless of ID
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 40,
            fontWeight: 'bold',
            color: 'black',
            background: 'white',
            width: '100%',
            height: '100%',
            padding: 50,
            position: 'relative',
          }}
        >
          {/* 배경 스타일 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 300,
              height: 300,
              borderRadius: '0 0 0 100%',
              background: '#f0f9ff',
              opacity: 0.7,
            }}
          />

          {/* 헤더 */}
          <div style={{ fontSize: 70, fontWeight: 'bold', marginBottom: 20 }}>
            <span style={{ color: '#0ea5e9' }}>양육불안도</span> 검사 결과
          </div>

          {/* 결과 내용 */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            padding: '30px',
            background: '#f9fafb',
            borderRadius: 20,
            marginTop: 20,
          }}>
            <div style={{ fontSize: 50, marginBottom: 20 }}>
              나의 양육불안 측정 결과
            </div>
            
            <div style={{ 
              display: 'flex', 
              fontSize: 28,
              color: '#4b5563',
              marginTop: 10
            }}>
              부모의 양육 과정에서 경험하는 불안 수준을 측정한 결과입니다.
            </div>
          </div>

          {/* 카테고리 결과 요약 - 정적 콘텐츠로 대체 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: 30 
          }}>
            {[1, 2, 3].map((_, index) => (
              <div key={index} style={{ 
                flex: 1,
                padding: '15px',
                margin: '0 10px',
                background: '#f0f9ff',
                borderRadius: 15,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: 24, marginBottom: 10, textAlign: 'center' }}>
                  양육불안 분석
                </div>
                <div style={{ 
                  fontSize: 26, 
                  color: '#0284c7',
                  fontWeight: 'bold'
                }}>
                  상세결과 확인
                </div>
              </div>
            ))}
          </div>

          {/* 푸터 */}
          <div style={{ 
            position: 'absolute',
            bottom: 50,
            left: 50,
            right: 50,
            textAlign: 'center',
            fontSize: 24,
            color: '#6b7280'
          }}>
            상세한 결과를 확인하려면 링크를 클릭하세요
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG 이미지 생성 오류:', error);
    
    // 오류 발생 시 기본 이미지 반환
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            color: 'black',
            background: 'white',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 50,
          }}
        >
          <div style={{ fontWeight: 'bold' }}>양육불안도 검사</div>
          <div style={{ fontSize: 30, marginTop: 30 }}>
            나의 양육불안 측정 결과
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
} 