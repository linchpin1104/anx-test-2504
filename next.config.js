/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      // 외부 이미지 도메인 등록
      'example.com',
      'images.unsplash.com',
      // 필요한 다른 도메인 추가
    ],
  },
};

module.exports = nextConfig; 