// app/lib/speech/useVoiceFoodName.ts
// 말로 식재료 이름 넣기. 말하는 동안 들리는 글자는 보여 주기만 하고, 다 듣고 난 뒤 식재료 이름인지 확인해서 넣는다
// (말하는 도중의 "오"가 "오이"보다 먼저 등록되거나, 잘못 들은 말이 품목으로 들어가지 않게)

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  checkFoodName,
  type FoodNameCheck,
} from '@/app/lib/items/foodVocabulary';
import { ITEM_NAME_MAX } from '@/app/lib/schemas/item';
import { useSpeechInput } from '@/app/lib/speech/useSpeechInput';

interface Options {
  // 집마다 쓰는 이름 (이 냉장고에 넣은 적 있는 이름 등)
  knownNames?: readonly string[];
  // 식재료 이름으로 확인된 이름 (고친 이름 포함)
  onAccept: (name: string) => void;
}

export function useVoiceFoodName({ knownNames = [], onAccept }: Options) {
  // 지금 들리는 글자 (확인 전)
  const [heard, setHeard] = useState('');
  // 다 들은 뒤 확인 결과. 고쳤거나 모르는 이름일 때만 남겨 안내한다
  const [check, setCheck] = useState<FoodNameCheck | null>(null);
  const heardRef = useRef('');
  const speech = useSpeechInput(text => {
    const next = text.slice(0, ITEM_NAME_MAX);
    heardRef.current = next;
    setHeard(next);
  });
  const latest = useRef({ knownNames, onAccept });
  useEffect(() => {
    latest.current = { knownNames, onAccept };
  }, [knownNames, onAccept]);

  // 듣기가 끝나면 한 번 확인한다
  const wasListening = useRef(false);
  useEffect(() => {
    if (speech.isListening) {
      wasListening.current = true;
      return;
    }
    if (!wasListening.current) return;
    wasListening.current = false;
    const spoken = heardRef.current.trim();
    heardRef.current = '';
    setHeard('');
    if (!spoken) return;
    const result = checkFoodName(spoken, latest.current.knownNames);
    if (result.status !== 'unknown') latest.current.onAccept(result.name);
    // 상태 변화(듣기 끝)에 맞춰 한 번만 확인 결과를 남긴다
    setCheck(result.status === 'known' ? null : result);
  }, [speech.isListening]);

  const start = () => {
    setCheck(null);
    heardRef.current = '';
    setHeard('');
    speech.start();
  };

  return {
    speech: { ...speech, start },
    heard,
    check,
    // 모르는 이름이어도 그대로 넣기
    acceptHeard: () => {
      if (check?.status === 'unknown') onAccept(check.heard);
      setCheck(null);
    },
    clearCheck: () => setCheck(null),
  };
}
