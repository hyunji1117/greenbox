// next.config.mjs

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import withPWAInit from '@ducanh2912/next-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// next-pwa(5.6.0) → @ducanh2912/next-pwa(Next 15 호환 포크) 교체.
// 기존 설정(dest/register/skipWaiting/runtimeCaching)을 새 API로 동등 이전.
// skipWaiting·runtimeCaching은 이제 workboxOptions 하위로 이동.
const pwaConfig = withPWAInit({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [], // 기존과 동일: 추가 런타임 캐싱 없음(start-url만 자동 캐싱)
  },
});

const nextConfig = {
  // React Strict Mode 설정 (Fast Refresh 에러 해결)
  reactStrictMode: true,

  // 이미지 도메인 설정 - remotePatterns만 사용 (deprecated 경고 해결)
  images: {
    contentDispositionType: 'inline',
    formats: ['image/webp'],
    remotePatterns: [
      // 구글 서비스
      {
        protocol: 'https',
        hostname: '*.gstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
        pathname: '/**',
      },
      // 이커머스/식품 관련
      {
        protocol: 'https',
        hostname: 'img-cf.kurly.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shop.hansalim.or.kr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.8dogam.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'oasisprodproduct.edge.naverncp.com',
        pathname: '/**',
      },
      // 미디어/뉴스 사이트
      {
        protocol: 'https',
        hostname: 'www.nongmin.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.health.chosun.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.wip-news.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kormedi.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.news.hidoc.co.kr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'src.hidoc.co.kr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.khan.co.kr',
        pathname: '/**',
      },
      // 교육/위키
      {
        protocol: 'https',
        hostname: 'www.syu.ac.kr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.namu.wiki',
        pathname: '/**',
      },
      // CDN 및 기타 서비스
      {
        protocol: 'https',
        hostname: 'cdn.100ssd.co.kr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hips.hearstapps.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'liosystem.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.travie.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 't1.daumcdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.clipkit.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wooltariusa.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.finedininglovers.com',
        pathname: '/**',
      },
      // 스톡 이미지 서비스
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
    ],
  },

  // 워크스페이스 루트 명시 (상위 디렉터리의 lockfile 오인식 방지)
  outputFileTracingRoot: __dirname,

  // 실험적 기능 (Fast Refresh 개선)
  experimental: {
    // Fast Refresh 관련 최적화
    forceSwcTransforms: true,
  },
};

export default pwaConfig(nextConfig);

// import withPWA from 'next-pwa';

// const pwaConfig = withPWA({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development',
// });

// const nextConfig = {
//   // 이미지 도메인 설정
//   images: {
//     domains: [
//       'images.remotePatterns',
//       'images.unsplash.com',
//       'cdn.pixabay.com',
//       'image.8dogam.com',
//       'img-cf.kurly.com',
//       'encrypted-tbn1.gstatic.com',
//       'encrypted-tbn2.gstatic.com',
//       'www.nongmin.com',
//       'oasisprodproduct.edge.naverncp.com',
//       'www.syu.ac.kr',
//       'cdn.100ssd.co.kr',
//       'hips.hearstapps.com',
//       'm.health.chosun.com',
//       'cdn.wip-news.com',
//       'kormedi.com',
//       'shop.hansalim.or.kr',
//       'i.namu.wiki',
//       'liosystem.com',
//       'cdn.travie.com',
//       't1.daumcdn.net',
//       'cdn.news.hidoc.co.kr',
//       'img.khan.co.kr',
//       'src.hidoc.co.kr',
//       'cdn.clipkit.co',
//       'lh6.googleusercontent.com',
//       'wooltariusa.com',
//       'i.pravatar.cc',
//       'www.finedininglovers.com',
//       'hips.hearstapps.com',
//     ],
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'example.com',
//         pathname: '/**',
//       },
//     ],
//   },
// };

// export default pwaConfig(nextConfig);
