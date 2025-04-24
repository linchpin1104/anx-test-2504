# 프론트엔드 개발 규칙

## 1. 스타일링
- 모든 UI/UX는 Tailwind CSS 기반으로 작성
- 커스텀 스타일이 필요한 경우 `@apply` 지시문 사용
- 글로벌 스타일은 `src/app/globals.css`에서 관리

## 2. 컴포넌트
- shadcn/ui 컴포넌트 우선 사용
  - 버튼, 카드, 섹션, 모달 등 기본 컴포넌트
  - 커스텀 컴포넌트는 shadcn/ui 스타일 가이드라인 준수
- React 컴포넌트는 `/components` 폴더에 구조화
  - 공통 컴포넌트: `/components/ui`
  - 페이지별 컴포넌트: `/components/(marketing)`, `/components/(dashboard)` 등
  - 레이아웃 컴포넌트: `/components/layout`

## 3. 라우팅 & 페이지 구조
- Next.js App Router 사용
- 페이지는 `/app/(marketing)/page.tsx` 형식으로 구성
- 마케팅 페이지: `/app/(marketing)`
- 대시보드 페이지: `/app/(dashboard)`
- API 라우트: `/app/api`

## 4. 컨텐츠 관리
- Markdown 컨텐츠는 MDX 또는 CMS 연동
- 컨텐츠 파일은 `/content` 디렉토리에 저장
- CMS 연동 시 환경 변수로 API 키 관리

## 5. 레이아웃 & 섹션
- Hero 섹션은 `h-screen` 기준
- Scroll-snap 기능 활용 가능
- 반응형 디자인 필수 (모바일 퍼스트)

## 6. 아이콘
- 모든 아이콘은 Lucide-react 사용
- 아이콘 컴포넌트는 `/components/icons`에서 관리

## 7. 상태 관리
- 서버 컴포넌트 우선 사용
- 클라이언트 상태는 React Context 또는 Zustand 사용
- API 데이터는 React Query 사용

## 8. 성능 최적화
- 이미지 최적화 (Next.js Image 컴포넌트 사용)
- 코드 스플리팅
- 지연 로딩 구현

## 9. 접근성
- ARIA 레이블 사용
- 키보드 네비게이션 지원
- 색상 대비 준수

## 10. 테스트
- 컴포넌트 단위 테스트 작성
- E2E 테스트 구현
- 스토리북 활용 