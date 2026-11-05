// app/lib/fridges/useFridgeSharing.ts
// 냉장고 함께 쓰기 화면용 훅: 냉장고 목록과 전환, 이름 바꾸기, 초대 링크, 참여 요청, 내보내기, 나가기
// 냉장고가 바뀌거나 빠지면 그 냉장고의 품목 캐시를 지워 다른 냉장고 품목이 화면에 남지 않게 한다

'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';
import { track } from '@/app/lib/analytics/gtag';
import { apiFetch } from '@/app/lib/api/apiFetch';
import { CURRENT_FRIDGE_URL } from '@/app/lib/fridges/useCurrentFridge';
import { fridgeKeys, itemKeys } from '@/app/lib/query/keys';
import {
  CurrentFridgeSchema,
  InviteResponseSchema,
  InviteSchema,
  JoinRequestListSchema,
  MyFridgeListSchema,
} from '@/app/lib/schemas/fridge';

const NoContent = z.null();
const fridgeUrl = (fridgeId: string) =>
  `/api/fridges/${encodeURIComponent(fridgeId)}`;

// 전환, 나가기, 내보내기 뒤에는 어느 냉장고를 볼지 서버가 다시 정하므로 품목 캐시를 모두 비운다
async function resetFridgeCaches(queryClient: QueryClient) {
  await queryClient.cancelQueries({ queryKey: itemKeys.all });
  queryClient.removeQueries({ queryKey: itemKeys.all });
  await queryClient.invalidateQueries({ queryKey: fridgeKeys.all });
}

export function useMyFridges(enabled = true) {
  return useQuery({
    queryKey: fridgeKeys.mine(),
    queryFn: () => apiFetch('/api/fridges', MyFridgeListSchema),
    enabled,
    // 목록을 열 때마다 새로 받는다. 방금 승인된 냉장고가 바로 보여야 한다
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useSwitchFridge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fridgeId: string) =>
      apiFetch(CURRENT_FRIDGE_URL, CurrentFridgeSchema, {
        method: 'PUT',
        body: { fridgeId },
      }),
    onSuccess: async fridge => {
      track('fridge_switched');
      // 바꾼 냉장고를 먼저 넣어야, 다시 확인할 때 이전 냉장고를 "보고 있는 냉장고"로 보내지 않는다
      await queryClient.cancelQueries({ queryKey: fridgeKeys.current() });
      queryClient.setQueryData(fridgeKeys.current(), fridge);
      await queryClient.cancelQueries({ queryKey: itemKeys.all });
      queryClient.removeQueries({ queryKey: itemKeys.all });
      await queryClient.invalidateQueries({ queryKey: fridgeKeys.mine() });
    },
  });
}

export function useRenameFridge(fridgeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    // 앞 이름만 보낸다. 서버가 "앞 이름 냉장고"로 저장한다
    mutationFn: (label: string) =>
      apiFetch(fridgeUrl(fridgeId), NoContent, {
        method: 'PATCH',
        body: { label },
      }),
    onSuccess: () => {
      track('fridge_renamed');
      return queryClient.invalidateQueries({ queryKey: fridgeKeys.all });
    },
  });
}

// ---------- 초대 링크 ----------

export function useInvite(fridgeId: string, enabled = true) {
  return useQuery({
    queryKey: fridgeKeys.invite(fridgeId),
    queryFn: () =>
      apiFetch(`${fridgeUrl(fridgeId)}/invite`, InviteResponseSchema),
    enabled,
  });
}

export function useCreateInvite(fridgeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`${fridgeUrl(fridgeId)}/invite`, InviteSchema, {
        method: 'POST',
      }),
    onSuccess: invite => {
      track('invite_link_created');
      queryClient.setQueryData(fridgeKeys.invite(fridgeId), invite);
    },
  });
}

export function useRevokeInvite(fridgeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`${fridgeUrl(fridgeId)}/invite`, NoContent, {
        method: 'DELETE',
      }),
    onSuccess: () =>
      queryClient.setQueryData(fridgeKeys.invite(fridgeId), null),
  });
}

export function inviteUrl(code: string): string {
  return `${window.location.origin}/join/${code}`;
}

// ---------- 참여 요청 ----------

export function usePendingRequests(fridgeId: string, enabled = true) {
  return useQuery({
    queryKey: fridgeKeys.requests(fridgeId),
    queryFn: () =>
      apiFetch(`${fridgeUrl(fridgeId)}/requests`, JoinRequestListSchema),
    enabled,
    // 구성원 화면을 열어 둔 동안 새 요청이 바로 보이게 한다
    refetchInterval: 5_000,
  });
}

export function useDecideRequest(fridgeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      decision,
    }: {
      requestId: string;
      decision: 'approve' | 'reject';
    }) =>
      apiFetch(
        `${fridgeUrl(fridgeId)}/requests/${encodeURIComponent(requestId)}`,
        z.object({ status: z.enum(['approved', 'rejected']) }),
        { method: 'POST', body: { decision } },
      ),
    onSuccess: ({ status }) =>
      track(status === 'approved' ? 'join_approved' : 'join_rejected'),
    // 실패해도(이미 다른 구성원이 처리함 등) 최신 목록으로 맞춘다
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: fridgeKeys.all }),
  });
}

// ---------- 내보내기와 나가기 ----------

export function useRemoveMember(fridgeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch(
        `${fridgeUrl(fridgeId)}/members/${encodeURIComponent(userId)}`,
        NoContent,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      track('member_removed');
      return queryClient.invalidateQueries({ queryKey: fridgeKeys.all });
    },
  });
}

export function useLeaveFridge(fridgeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(
        `${fridgeUrl(fridgeId)}/leave`,
        z.object({ currentFridgeId: z.string() }),
        { method: 'POST' },
      ),
    onSuccess: () => {
      track('fridge_left');
      return resetFridgeCaches(queryClient);
    },
  });
}

// 참여 화면: 요청을 보낸 뒤 승인됐는지 새로고침 없이 알 수 있도록 다시 확인한다
export function useMyJoinStatus(code: string, enabled: boolean) {
  return useQuery({
    queryKey: [...fridgeKeys.all, 'join', code] as const,
    queryFn: () =>
      apiFetch(
        `/api/join/${encodeURIComponent(code)}`,
        z.object({
          status: z.enum(['member', 'pending', 'none']),
          fridgeId: z.string(),
        }),
      ),
    enabled,
    refetchInterval: query =>
      query.state.data?.status === 'member' ? false : 5_000,
  });
}

// 참여 화면에서 요청 보내기
export function useRequestJoin(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(
        `/api/join/${encodeURIComponent(code)}`,
        z.object({ status: z.enum(['pending', 'member']) }),
        { method: 'POST' },
      ),
    onSuccess: ({ status }) => {
      track('join_requested', { result: status });
      // 기다리는 동안 승인 여부를 바로 확인하기 시작한다
      return queryClient.invalidateQueries({
        queryKey: [...fridgeKeys.all, 'join', code],
      });
    },
  });
}
