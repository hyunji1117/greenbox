// app/page.tsx
import { Suspense } from 'react';
import Loading from '@/app/components/layout/Loading';
import PageClient from '@/app/PageClient';

export default function Page() {
  return (
    <Suspense fallback={<Loading progress={0} />}>
      <PageClient />
    </Suspense>
  );
}
