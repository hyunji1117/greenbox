// app/api/save-subscription/route.ts
// PWA 푸시 알림 구독 정보 저장 API

import { NextRequest, NextResponse } from 'next/server';

// ==========================================
//            구독 저장 API 핸들러
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // 클라이언트로부터 구독 정보 수신
    const subscription = await request.json();

    console.log('=== 구독 정보 저장 시작 ===');
    console.log(JSON.stringify(subscription, null, 2));

    // ==========================================
    //              DB 저장 로직
    // ==========================================
    // TODO: Supabase 또는 다른 DB에 구독 정보 저장
    // 예정:
    // const { data, error } = await supabase
    //   .from('push_subscriptions')
    //   .insert({
    //     endpoint: subscription.endpoint,
    //     keys: subscription.keys,
    //     created_at: new Date().toISOString(),
    //   });
    //
    // if (error) throw error;

    // ==========================================
    //              성공 응답
    // ==========================================
    return NextResponse.json({
      success: true,
      message: '구독 정보가 성공적으로 저장되었습니다',
    });
  } catch (error) {
    // ==========================================
    //              에러 처리
    // ==========================================
    console.error('❌ 구독 저장 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save subscription',
        message: '구독 정보 저장 중 오류가 발생했습니다',
      },
      { status: 500 },
    );
  }
}
