// app/api/public-vapid-key/route.ts
// 푸시 알림을 위한 VAPID 공개 키를 반환하는 API 라우트

// import { NextResponse } from 'next/server';

// export async function GET() {
//   const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

//   console.log('=== VAPID Key Debug ===');
//   console.log('Public Key:', publicKey);
//   console.log('Key exists:', !!publicKey);
//   console.log('Key length:', publicKey?.length);

//   if (!publicKey) {
//     return NextResponse.json(
//       { error: 'VAPID public key not found' },
//       { status: 500 },
//     );
//   }

//   return NextResponse.json({ publicKey });
// }

export async function GET() {
  return Response.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
}
