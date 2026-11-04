// app/join/[code]/page.tsx
// 초대 링크로 들어오는 참여 화면. 로그인 전에도 열린다 (미들웨어 제외)
// 승인 전에는 냉장고 이름과 구성원 수만 보여 준다. 품목이나 구성원 이름은 보이지 않는다

import type { Metadata } from 'next';
import { auth } from '@/auth';
import AuthShell from '@/app/components/auth/AuthShell';
import { currentPolicyVersion } from '@/app/lib/consent/policies';
import { getInvitePreview } from '@/app/lib/fridges/sharing';
import { getFridgeRole } from '@/app/lib/fridges/store';
import type { JoinPageState } from '@/app/lib/analytics/gtag';
import JoinActions from './JoinActions';

export const metadata: Metadata = {
  title: '냉장고 함께 쓰기',
  // 초대 링크 화면은 검색에 노출하지 않는다
  robots: { index: false, follow: false },
};

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const preview = await getInvitePreview(code);

  if (!preview) {
    return (
      <AuthShell
        title="쓸 수 없는 초대 링크예요"
        description={
          <>
            링크가 만료됐거나 새 링크로 바뀌었어요.
            <br />
            초대한 가족에게 새 링크를 받아 주세요.
          </>
        }
      >
        <JoinActions code={code} state="invalid" />
      </AuthShell>
    );
  }

  const session = await auth();
  const state: JoinPageState = !session?.user
    ? 'signed_out'
    : !session.registered || session.consentVersion !== currentPolicyVersion()
      ? 'needs_consent'
      : (await getFridgeRole(session.user.id, preview.fridgeId))
        ? 'member'
        : 'can_request';

  return (
    <AuthShell
      title={`${preview.fridgeName ?? '가족 냉장고'}에 초대받았어요`}
      description={
        <>
          지금 {preview.memberCount}명이 함께 보고 있어요.
          <br />
          참여를 요청하면 구성원이 승인한 뒤에 품목, 유통기한, 댓글을 함께 볼 수
          있어요.
        </>
      }
    >
      <JoinActions
        code={code}
        state={state}
        fridgeId={state === 'member' ? preview.fridgeId : undefined}
      />
    </AuthShell>
  );
}
