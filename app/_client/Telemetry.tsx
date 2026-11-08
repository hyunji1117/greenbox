// app/_client/Telemetry.tsx
// 실제 사용자 기기의 성능 지표(web-vitals)와 화면 오류를 모은다
// 성능 지표는 우리 DB(p75 집계용)와 GA(화면별 분포 확인용)에 함께 보낸다

'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { track } from '@/app/lib/analytics/gtag';
import { installTelemetry, reportVital } from '@/app/lib/telemetry/client';

export default function Telemetry() {
  useReportWebVitals(metric => {
    reportVital(metric);
    track('web_vital', {
      metric_name: metric.name,
      value:
        metric.name === 'CLS'
          ? Math.round(metric.value * 1000)
          : Math.round(metric.value),
      rating: metric.rating,
    });
  });

  useEffect(() => {
    installTelemetry();
  }, []);

  return null;
}
