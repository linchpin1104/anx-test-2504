import { Metadata, ResolvingMetadata } from 'next';
// Firebase 의존성 제거
// import { firestore } from '@/lib/firebaseAdmin';

type Props = {
  params: { id: string };
  children: React.ReactNode;
};

// 동적 메타데이터 생성 함수
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // 공유 ID로부터 결과 데이터 검색
  const id = params.id;
  const title = '양육불안도 검사 결과';
  const description = '양육 과정에서 겪는 불안과 스트레스를 측정한 결과입니다.';
  
  // Firebase 의존성 제거 - 정적 메타데이터만 사용
  
  // 기본 메타데이터와 병합
  const previousImages = (await parent).openGraph?.images || [];
  
  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: `/api/og-image?id=${id}`,
          width: 1200,
          height: 630,
          alt: title,
        },
        ...previousImages,
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [`/api/og-image?id=${id}`],
    },
  };
}

export default function ShareLayout({ children }: Props) {
  return (
    <>
      {children}
    </>
  );
} 