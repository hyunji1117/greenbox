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
