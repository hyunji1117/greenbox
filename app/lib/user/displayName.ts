// app/lib/user/displayName.ts
// 로그인 사용자 프로필과 화면 표시 이름 규칙 (서버, 클라이언트 공용)

export interface MyProfile {
  name: string | null; // 구글 이름
  email: string | null;
  image: string | null;
  familyNickname: string | null; // 가족 내 호칭
}

export const FAMILY_NICKNAME_MAX = 20;

// 가족 내 호칭 > 구글 이름 > 이메일 앞부분 순서로 표시
export function toDisplayName(profile: MyProfile | null): string | null {
  if (!profile) return null;
  return (
    profile.familyNickname?.trim() ||
    profile.name?.trim() ||
    profile.email?.split('@')[0] ||
    null
  );
}

// 품목을 넣은 사람과 댓글 작성자 표시 (서버가 이름을 위 규칙대로 만들어 보낸다)
export interface PersonLike {
  id: string | null;
  name: string | null;
  isMember: boolean;
}

export function personLabel(person: PersonLike): string {
  if (!person.id) return '탈퇴한 구성원';
  const name = person.name ?? '이름 없는 구성원';
  return person.isMember ? name : `나간 구성원 ${name}`;
}

// 이름 뒤 주격 조사. 마지막 글자에 받침이 있으면 '이', 없거나 한글이 아니면 '가'
export function withSubjectParticle(name: string): string {
  const code = name.charCodeAt(name.length - 1);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const hasFinal = isHangul && (code - 0xac00) % 28 !== 0;
  return `${name}${hasFinal ? '이' : '가'}`;
}

// 이름 뒤 목적격 조사. 마지막 글자에 받침이 있으면 '을', 없거나 한글이 아니면 '를'
export function withObjectParticle(name: string): string {
  const code = name.charCodeAt(name.length - 1);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const hasFinal = isHangul && (code - 0xac00) % 28 !== 0;
  return `${name}${hasFinal ? '을' : '를'}`;
}
