// app/privacy/page.tsx
// 개인정보처리방침. 내용을 바꾸면 app/lib/consent/policies.ts의 POLICY_VERSION도 올린다.

import type { Metadata } from 'next';
import { POLICY_VERSION } from '@/app/lib/consent/policies';
import { APP_NAME } from '@/app/lib/brand';

export const metadata: Metadata = {
  title: '개인정보처리방침',
};

// 개인 운영이라 운영자가 개인정보 보호책임자를 겸한다
const OPERATOR = {
  name: '김현지',
  officer: '김현지',
  email: 'eve0204eve@gmail.com',
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </section>
  );
}

const cell = 'border border-gray-200 px-2 py-1.5 align-top';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <article className="mx-auto max-w-2xl space-y-8 rounded-2xl bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">개인정보처리방침</h1>
          <p className="text-sm text-gray-600">
            {OPERATOR.name}(이하 &lsquo;운영자&rsquo;)는 {APP_NAME}(이하
            &lsquo;서비스&rsquo;) 이용자의 개인정보를 「개인정보 보호법」에
            따라 보호하고, 관련 고충을 신속하게 처리하기 위해 다음과 같이
            개인정보처리방침을 둡니다.
          </p>
          <p className="text-xs text-gray-400">
            시행일: {POLICY_VERSION}
          </p>
        </header>

        <Section title="1. 수집하는 개인정보 항목과 수집 방법">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className={cell}>구분</th>
                  <th className={cell}>항목</th>
                  <th className={cell}>수집 방법</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={cell}>필수 (구글 로그인)</td>
                  <td className={cell}>
                    이름, 이메일 주소, 프로필 사진, 구글 계정 식별자
                  </td>
                  <td className={cell}>구글 로그인 시 구글로부터 제공받음</td>
                </tr>
                <tr>
                  <td className={cell}>필수 (동의 기록)</td>
                  <td className={cell}>
                    동의 항목, 동의한 방침 버전, 동의 일시, 브라우저 정보
                  </td>
                  <td className={cell}>동의 시 자동 기록</td>
                </tr>
                <tr>
                  <td className={cell}>자동 수집</td>
                  <td className={cell}>
                    접속 기록, 기기·브라우저 정보, 쿠키, 서비스 이용 통계
                  </td>
                  <td className={cell}>
                    서비스 이용 과정에서 자동 생성 (Google Analytics 포함)
                  </td>
                </tr>
                <tr>
                  <td className={cell}>선택 (호칭 등록 시)</td>
                  <td className={cell}>가족 내 호칭</td>
                  <td className={cell}>이용자가 설정 화면에서 직접 입력</td>
                </tr>
                <tr>
                  <td className={cell}>선택 (알림 사용 시)</td>
                  <td className={cell}>푸시 알림 구독 정보</td>
                  <td className={cell}>알림 허용 시 브라우저가 생성</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            냉장고 식재료, 장보기 목록, 구매 기록은 현재 이용자의 기기(브라우저
            저장소)에만 저장되며 운영자에게 전송되지 않습니다.
          </p>
        </Section>

        <Section title="2. 개인정보의 수집·이용 목적">
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 식별, 로그인 및 계정 관리</li>
            <li>개인정보 처리 동의 사실의 확인과 보관</li>
            <li>유통기한 알림 등 서비스 기능 제공</li>
            <li>서비스 이용 통계 분석과 품질 개선</li>
          </ul>
          <p>
            구글 로그인으로 제공받는 정보(이름, 이메일 주소, 프로필 사진, 구글
            계정 식별자)는 회원 식별과 서비스 화면의 이름 및 사진 표시에만
            이용합니다. 이 정보를 광고에 이용하거나 판매하지 않으며, 4조와 5조에
            적힌 경우 외에는 다른 곳에 제공하지 않습니다. 서비스는 구글 계정의
            다른 데이터(메일, 드라이브, 연락처 등)에 접근하지 않습니다.
          </p>
        </Section>

        <Section title="3. 보유 및 이용 기간">
          <p>
            회원 탈퇴 시 지체 없이 파기합니다. 다만 동의 기록은 동의 사실을
            증명하기 위해 회원 탈퇴 시까지 보관하며, 관계 법령에 따라 보존할
            필요가 있는 경우 해당 기간 동안 보관합니다.
          </p>
        </Section>

        <Section title="4. 개인정보의 제3자 제공">
          <p>
            운영자는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만
            법령에 근거가 있거나 수사기관이 법령에 정해진 절차에 따라 요청하는
            경우는 예외로 합니다.
          </p>
        </Section>

        <Section title="5. 개인정보 처리 위탁 및 국외 이전">
          <p>
            운영자는 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를
            위탁하며, 일부 수탁자는 국외에 있습니다. 개인정보는 서비스 이용
            시점에 네트워크를 통해 전송됩니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className={cell}>수탁자 (국가)</th>
                  <th className={cell}>위탁 업무</th>
                  <th className={cell}>이전 항목</th>
                  <th className={cell}>보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={cell}>Vultr (미국)</td>
                  <td className={cell}>
                    회원 정보와 동의 기록 저장 (저장 위치: 대한민국 서울)
                  </td>
                  <td className={cell}>
                    이름, 이메일 주소, 프로필 사진, 구글 계정 식별자, 가족 내
                    호칭, 동의 기록
                  </td>
                  <td className={cell}>회원 탈퇴 또는 위탁 계약 종료 시까지</td>
                </tr>
                <tr>
                  <td className={cell}>Vercel Inc. (미국)</td>
                  <td className={cell}>서비스 호스팅, 서버 운영</td>
                  <td className={cell}>접속 기록, 기기·브라우저 정보</td>
                  <td className={cell}>위탁 계약 종료 시까지</td>
                </tr>
                <tr>
                  <td className={cell}>Google LLC (미국)</td>
                  <td className={cell}>
                    구글 계정 로그인, 이용 통계 분석(Google Analytics)
                  </td>
                  <td className={cell}>
                    구글 계정 정보, 접속 기록, 쿠키, 이용 통계
                  </td>
                  <td className={cell}>Google의 보관 정책에 따름</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            이용자는 국외 이전을 거부할 수 있으나, 서비스는 로그인한 이용자만
            이용할 수 있으므로 이 경우 서비스를 이용할 수 없습니다.
          </p>
        </Section>

        <Section title="6. 이용자의 권리와 행사 방법">
          <p>
            이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지,
            동의 철회를 요구할 수 있습니다. 아래 개인정보 보호책임자에게
            이메일로 요청하면 지체 없이 조치합니다. 필수 항목에 대한 동의를
            철회하면 회원 탈퇴로 처리됩니다.
          </p>
        </Section>

        <Section title="7. 개인정보의 파기">
          <p>
            보유 기간이 끝나거나 처리 목적이 달성된 개인정보는 지체 없이
            파기합니다. 전자적 파일은 복구할 수 없는 방법으로 삭제합니다.
          </p>
        </Section>

        <Section title="8. 안전성 확보 조치">
          <ul className="list-disc space-y-1 pl-5">
            <li>전송 구간 암호화(HTTPS)와 저장 데이터 암호화</li>
            <li>접근 제어로 본인 데이터만 조회할 수 있도록 제한</li>
            <li>관리 권한 키의 서버 보관과 접근 권한 최소화</li>
          </ul>
        </Section>

        <Section title="9. 만 14세 미만 아동의 개인정보">
          <p>
            서비스는 만 14세 미만 아동의 회원 가입을 받지 않습니다. 만 14세
            미만임이 확인되면 해당 개인정보를 지체 없이 파기합니다.
          </p>
        </Section>

        <Section title="10. 쿠키의 설치·운영 및 거부">
          <p>
            서비스는 로그인 상태 유지와 이용 통계 분석을 위해 쿠키를 사용합니다.
            이용자는 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우
            로그인 상태를 유지할 수 없어 서비스를 이용할 수 없습니다.
          </p>
        </Section>

        <Section title="11. 개인정보 보호책임자">
          <ul className="list-disc space-y-1 pl-5">
            <li>성명: {OPERATOR.officer}</li>
            <li>이메일: {OPERATOR.email}</li>
          </ul>
        </Section>

        <Section title="12. 권익침해 구제 방법">
          <p>
            개인정보 침해에 대한 신고나 상담이 필요하면 아래 기관에 문의할 수
            있습니다.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>개인정보침해신고센터: (국번 없이) 118, privacy.kisa.or.kr</li>
            <li>개인정보분쟁조정위원회: 1833-6972, www.kopico.go.kr</li>
            <li>대검찰청: (국번 없이) 1301, www.spo.go.kr</li>
            <li>경찰청: (국번 없이) 182, ecrm.police.go.kr</li>
          </ul>
        </Section>

        <Section title="13. 방침의 변경">
          <p>
            이 방침이 변경되면 시행 전에 서비스 안에서 알리며, 변경된 방침에
            대한 동의가 필요한 경우 다음 로그인 시 다시 동의를 받습니다.
          </p>
        </Section>
      </article>
    </main>
  );
}
