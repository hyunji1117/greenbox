// app/components/settings/FaqCard.tsx
// 자주 묻는 질문. 누르면 답이 펼쳐진다 (details/summary라 화면 읽기 프로그램과 키보드로도 열린다)
// 답은 지금 동작하는 사실만 적는다. 기능이 바뀌면 이 답도 함께 고친다

import React from 'react';
import { ChevronDownIcon, CircleHelpIcon } from 'lucide-react';
import { SURFACE } from '@/app/components/common/SegmentedTabs';

export const FAQS = [
  {
    question: '장보기 리스트는 누가 볼 수 있나요?',
    // 장보기 리스트는 서버가 아니라 이 기기에만 저장한다 (app/lib/storage/ShoppingListStorage.ts)
    answer:
      '나만 볼 수 있어요. 장보기 리스트는 이 휴대폰에만 저장돼서, 냉장고를 함께 쓰는 가족에게도 보이지 않아요.',
  },
  {
    question: '다른 기기에서도 장보기 리스트가 보이나요?',
    answer:
      '아니요. 휴대폰을 바꾸거나 앱 데이터를 지우면 리스트도 사라져요. 아이폰은 Safari와 홈 화면에 추가한 앱의 리스트가 서로 달라요.',
  },
] as const;

const FaqCard: React.FC = () => (
  <section className={`p-4 ${SURFACE}`} aria-labelledby="faq-title">
    <h2
      id="faq-title"
      className="flex items-center gap-2 text-sm font-semibold text-gray-800"
    >
      <CircleHelpIcon size={18} className="text-[#6B46C1]" aria-hidden />
      자주 묻는 질문
    </h2>
    <div className="mt-2 divide-y divide-gray-100">
      {FAQS.map(({ question, answer }) => (
        <details key={question} className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2 text-sm text-gray-800 [&::-webkit-details-marker]:hidden">
            <span>{question}</span>
            <ChevronDownIcon
              size={16}
              className="shrink-0 text-gray-400 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              aria-hidden
            />
          </summary>
          <p className="pb-3 text-sm leading-relaxed text-gray-600">{answer}</p>
        </details>
      ))}
    </div>
  </section>
);

export default FaqCard;
